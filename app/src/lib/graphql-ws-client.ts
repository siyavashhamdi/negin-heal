import { createClient, type Client } from "graphql-ws";
import { LOCAL_STORAGE_KEYS } from "../constants";

export const WS_SUBSCRIPTION_RETRY_ATTEMPTS = 10;

const WS_SUBSCRIPTION_BASE_RETRY_DELAY_MS = 1_000;

let isBrowserUnloading = false;
let graphqlWsClient: Client | null = null;
let lifecycleListenersRegistered = false;
let isWsConnected = false;

type GraphqlWsConnectionListener = (connected: boolean) => void;

const connectionListeners = new Set<GraphqlWsConnectionListener>();

function notifyConnectionListeners(connected: boolean): void {
  isWsConnected = connected;
  connectionListeners.forEach((listener) => {
    listener(connected);
  });
}

export function subscribeGraphqlWsConnection(
  listener: GraphqlWsConnectionListener,
): () => void {
  connectionListeners.add(listener);
  listener(isWsConnected);

  return () => {
    connectionListeners.delete(listener);
  };
}

function isBrowserOpenForSubscriptionRetry(): boolean {
  return typeof window !== "undefined" && !isBrowserUnloading;
}

async function waitForWsSubscriptionRetry(retries: number): Promise<void> {
  const delayMs = WS_SUBSCRIPTION_BASE_RETRY_DELAY_MS * 2 ** retries;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
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
  return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/graphql`;
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
    retryAttempts: WS_SUBSCRIPTION_RETRY_ATTEMPTS,
    retryWait: waitForWsSubscriptionRetry,
    shouldRetry: shouldRetryWsSubscriptionConnection,
    connectionParams: () => {
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      return {
        authorization: token ? `Bearer ${token}` : "",
      };
    },
    on: {
      connected: () => {
        notifyConnectionListeners(true);
      },
      closed: () => {
        notifyConnectionListeners(false);
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

export function isGraphqlWsConnected(): boolean {
  return isWsConnected;
}

export async function disposeGraphqlWsClient(): Promise<void> {
  const client = graphqlWsClient;
  graphqlWsClient = null;
  notifyConnectionListeners(false);

  if (client) {
    await client.dispose();
  }
}

/**
 * Drop the current WebSocket client so the next subscription reconnects with
 * fresh auth headers (for example after login/logout).
 */
export async function resetGraphqlWsClient(): Promise<void> {
  await disposeGraphqlWsClient();
}
