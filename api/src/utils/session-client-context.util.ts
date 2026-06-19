import { Request } from "express";

import { SessionClientContext } from "../database/schemas/session-client-context.schema";
import { SessionClientContextGqlInput } from "../modules/user/graphql/inputs/session-client-context.gql.input";

function readHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  const trimmed = value?.trim();
  return trimmed || undefined;
}

function trimOrUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function extractRequestIp(req?: Request): string | undefined {
  const forwardedFor = readHeaderValue(req?.headers?.["x-forwarded-for"]);
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || undefined;
  }

  return req?.ip || req?.socket?.remoteAddress || undefined;
}

export function buildSessionClientContext(
  req: Request | undefined,
  clientInput?: SessionClientContextGqlInput | null,
): SessionClientContext {
  const userAgent = readHeaderValue(req?.headers?.["user-agent"]);
  const acceptLanguage = readHeaderValue(req?.headers?.["accept-language"]);

  return {
    capturedAt: new Date(),
    ipAddress: extractRequestIp(req),
    userAgent,
    acceptLanguage,
    clientType: trimOrUndefined(clientInput?.clientType),
    deviceName: trimOrUndefined(clientInput?.deviceName),
    deviceModel: trimOrUndefined(clientInput?.deviceModel),
    deviceCategory: trimOrUndefined(clientInput?.deviceCategory),
    osName: trimOrUndefined(clientInput?.osName),
    osVersion: trimOrUndefined(clientInput?.osVersion),
    browserName: trimOrUndefined(clientInput?.browserName),
    browserVersion: trimOrUndefined(clientInput?.browserVersion),
    engineName: trimOrUndefined(clientInput?.engineName),
    architecture: trimOrUndefined(clientInput?.architecture),
    bitness: trimOrUndefined(clientInput?.bitness),
    platform: trimOrUndefined(clientInput?.platform),
    screenResolution: trimOrUndefined(clientInput?.screenResolution),
    viewportSize: trimOrUndefined(clientInput?.viewportSize),
    devicePixelRatio: clientInput?.devicePixelRatio,
    language: trimOrUndefined(clientInput?.language),
    languages: trimOrUndefined(clientInput?.languages),
    timezone: trimOrUndefined(clientInput?.timezone),
    timezoneOffset: trimOrUndefined(clientInput?.timezoneOffset),
    colorScheme: trimOrUndefined(clientInput?.colorScheme),
    touchInput: clientInput?.touchInput,
    maxTouchPoints: clientInput?.maxTouchPoints,
    connectionType: trimOrUndefined(clientInput?.connectionType),
    downlinkMbps: clientInput?.downlinkMbps,
    rttMs: clientInput?.rttMs,
    saveData: clientInput?.saveData,
    cpuCores: clientInput?.cpuCores,
    deviceMemoryGb: clientInput?.deviceMemoryGb,
    cookiesEnabled: clientInput?.cookiesEnabled,
    pdfViewerEnabled: clientInput?.pdfViewerEnabled,
    appVersion: trimOrUndefined(clientInput?.appVersion),
    pageUrl: trimOrUndefined(clientInput?.pageUrl),
    referrer: trimOrUndefined(clientInput?.referrer),
  };
}
