import type { Database } from "sql.js";

import { GQL_QUERY_CACHE_TABLE } from "./file-content-cache.constants";
import {
  initFileContentCache,
  runWithFileContentDatabase,
  scheduleFileContentCachePersist,
} from "./file-content-cache.service";
import type { CachedGqlQueryRecord, UpsertCachedGqlQueryParams } from "./gql-query-cache.types";
import {
  hashVariablesKey,
  normalizeOperationName,
  stableStringifyVariables,
} from "./gql-query-cache.util";
import { isPersistableGqlQueryName } from "../gql-cache-policy";

function readCachedGqlQueryRecord(
  db: Database,
  operationName: string,
  variablesHash: string
): CachedGqlQueryRecord | null {
  const statement = db.prepare(
    `SELECT variables_json, response_json, updated_at
     FROM ${GQL_QUERY_CACHE_TABLE}
     WHERE operation_name = ? AND variables_hash = ?`
  );

  try {
    statement.bind([operationName, variablesHash]);

    if (!statement.step()) {
      return null;
    }

    const [variablesJson, responseJson, cachedAt] = statement.get() as [string, string, number];

    if (!variablesJson?.trim() || !responseJson?.trim()) {
      return null;
    }

    let variables: Record<string, unknown>;
    let response: Record<string, unknown>;

    try {
      variables = JSON.parse(variablesJson) as Record<string, unknown>;
      response = JSON.parse(responseJson) as Record<string, unknown>;
    } catch {
      return null;
    }

    return {
      operationName,
      variables,
      response,
      cachedAt: Number.isFinite(cachedAt) ? cachedAt : Date.now(),
    };
  } finally {
    statement.free();
  }
}

function listCachedGqlQueryRecords(db: Database): CachedGqlQueryRecord[] {
  const statement = db.prepare(
    `SELECT operation_name, variables_json, response_json, updated_at
     FROM ${GQL_QUERY_CACHE_TABLE}
     ORDER BY updated_at DESC`
  );

  const records: CachedGqlQueryRecord[] = [];

  try {
    while (statement.step()) {
      const [operationName, variablesJson, responseJson, cachedAt] = statement.get() as [
        string,
        string,
        string,
        number,
      ];

      if (!operationName?.trim() || !variablesJson?.trim() || !responseJson?.trim()) {
        continue;
      }

      try {
        records.push({
          operationName,
          variables: JSON.parse(variablesJson) as Record<string, unknown>,
          response: JSON.parse(responseJson) as Record<string, unknown>,
          cachedAt: Number.isFinite(cachedAt) ? cachedAt : Date.now(),
        });
      } catch {
        // Skip malformed rows.
      }
    }
  } finally {
    statement.free();
  }

  return records.filter((record) => isPersistableGqlQueryName(record.operationName));
}

function writeCachedGqlQueryRecord(
  db: Database,
  params: UpsertCachedGqlQueryParams,
  variablesJson: string,
  variablesHash: string
): void {
  const responseJson = JSON.stringify(params.response);

  db.run(
    `INSERT OR REPLACE INTO ${GQL_QUERY_CACHE_TABLE}
      (operation_name, variables_hash, variables_json, response_json, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [params.operationName, variablesHash, variablesJson, responseJson, Date.now()]
  );
}

export async function upsertCachedGqlQuery(params: UpsertCachedGqlQueryParams): Promise<void> {
  const operationName = normalizeOperationName(params.operationName);
  if (
    !operationName ||
    !isPersistableGqlQueryName(operationName) ||
    Object.keys(params.response).length === 0
  ) {
    return;
  }

  const variablesJson = stableStringifyVariables(params.variables);
  const variablesHash = hashVariablesKey(variablesJson);

  await runWithFileContentDatabase((db) => {
    writeCachedGqlQueryRecord(
      db,
      {
        operationName,
        variables: params.variables ?? {},
        response: params.response,
      },
      variablesJson,
      variablesHash
    );
    scheduleFileContentCachePersist();
  });
}

export async function getCachedGqlQuery(
  operationNameInput: string,
  variables?: Record<string, unknown> | null
): Promise<CachedGqlQueryRecord | null> {
  const operationName = normalizeOperationName(operationNameInput);
  if (!operationName || !isPersistableGqlQueryName(operationName)) {
    return null;
  }

  const variablesJson = stableStringifyVariables(variables);
  const variablesHash = hashVariablesKey(variablesJson);

  const record = await runWithFileContentDatabase((db) =>
    readCachedGqlQueryRecord(db, operationName, variablesHash)
  );

  return record ?? null;
}

export async function getCachedGqlQueryResponse(
  operationName: string,
  variables?: Record<string, unknown> | null
): Promise<Record<string, unknown> | null> {
  const record = await getCachedGqlQuery(operationName, variables);
  return record?.response ?? null;
}

export async function listCachedGqlQueries(): Promise<CachedGqlQueryRecord[]> {
  const records = await runWithFileContentDatabase((db) => listCachedGqlQueryRecords(db));
  return records ?? [];
}

export async function clearCachedGqlQueries(): Promise<void> {
  await runWithFileContentDatabase((db) => {
    db.run(`DELETE FROM ${GQL_QUERY_CACHE_TABLE}`);
    scheduleFileContentCachePersist();
  });
}

export async function ensureGqlQueryCacheReady(): Promise<boolean> {
  await initFileContentCache();
  return true;
}
