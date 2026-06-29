import { createClient, type Client } from "graphql-ws";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { resolveGraphqlWsUrl } from "../utils/apiBaseUrl.util";
import {
  resolveSubscriptionRetryDelayMs,
  waitForSubscriptionRetryDelayMs,
} from "./subscription-retry.util";

let isBrowserUnloading = false;
let graphqlWsClient: Client | null = null;
let lifecycleListenersRegistered = false;
let isWsConnected = false;
const wsConnectionListeners = new Set<(connected: boolean) => void>();

function notifyWsConnectionListeners(connected: boolean): void {
  for (const listener of wsConnectionListeners) {
    listener(connected);
  }
}

function isBrowserOpenForSubscriptionRetry(): boolean {
  return typeof window !== "undefined" && !isBrowserUnloading;
}

async function waitForWsSubscriptionRetry(retries: number): Promise<void> {
  const delayMs = resolveSubscriptionRetryDelayMs(retries);
  await waitForSubscriptionRetryDelayMs(delayMs);
}

function shouldRetryWsSubscriptionConnection(_errOrCloseEvent: unknown): boolean {
  if (!isBrowserOpenForSubscriptionRetry()) {
    return false;
  }

  // Retry all non-fatal connection problems while the tab is open.
  // graphql-ws still rejects fatal close codes internally.
  return true;
}

function buildGraphqlWsUrl(): string {
  return resolveGraphqlWsUrl();
}

function registerLifecycleListeners(): void {
  if (lifecycleListenersRegistered || typeof window === "undefined") {
    return;
  }

  lifecycleListenersRegistered = true;

  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) {
      isBrowserUnloading = true;
      void disposeGraphqlWsClient();
    }
  });

  window.addEventListener("pageshow", () => {
    isBrowserUnloading = false;
  });
}

function createGraphqlWsClient(): Client {
  return createClient({
    url: buildGraphqlWsUrl(),
    lazy: true,
    retryAttempts: Number.POSITIVE_INFINITY,
    retryWait: waitForWsSubscriptionRetry,
    shouldRetry: shouldRetryWsSubscriptionConnection,
    connectionParams: () => {
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      return token ? { authorization: `Bearer ${token}` } : {};
    },
    on: {
      connected: () => {
        isWsConnected = true;
        notifyWsConnectionListeners(true);
      },
      closed: () => {
        isWsConnected = false;
        notifyWsConnectionListeners(false);
      },
    },
  });
}

export function getGraphqlWsClient(): Client {
  if (typeof window === "undefined") {
    throw new Error("GraphQL WebSocket client is only available in the browser");
  }

  registerLifecycleListeners();

  if (!graphqlWsClient) {
    graphqlWsClient = createGraphqlWsClient();
  }

  return graphqlWsClient;
}

export function subscribeGraphqlWsConnection(listener: (connected: boolean) => void): () => void {
  wsConnectionListeners.add(listener);
  listener(isWsConnected);

  return () => {
    wsConnectionListeners.delete(listener);
  };
}

export async function disposeGraphqlWsClient(): Promise<void> {
  const client = graphqlWsClient;
  graphqlWsClient = null;
  isWsConnected = false;
  notifyWsConnectionListeners(false);

  if (client) {
    await client.dispose();
  }
}
