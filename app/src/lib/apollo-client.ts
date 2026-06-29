import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from "@apollo/client";
import type { WatchQueryFetchPolicy } from "@apollo/client";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { SetContextLink } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { GraphqlWsLink } from "./graphql-ws-link";
import { getMainDefinition } from "@apollo/client/utilities";
import { tap } from "rxjs/operators";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { paginatedQueryTypePolicies } from "./apollo/paginated-query-cache.policy";
import { queueApolloError } from "../components/apollo-error-queue";
import { notifyAuthSessionExpired } from "./auth-session-expired-listeners";
import {
  extractGraphQLErrorMessage,
  isAccessDeniedGraphQLError,
  isAuthSessionInvalidGraphQLError,
  type ApolloErrorLike,
  type GraphQLErrorExtensions,
} from "../utilities/graphql-error.util";
import { isLandingRoute, isStandaloneShellRoute } from "../routing/app-shell-routes";
import {
  clearPersistedApolloCache,
  hydrateApolloCache,
  registerApolloCacheUnloadPersist,
} from "./apollo-cache-persist";
import { clearFileContentCache } from "./file-content-cache";
import { createCacheFallbackLink } from "./apollo-offline-link";
import { resolveGraphqlHttpUrl } from "../utils/apiBaseUrl.util";
import {
  getIsBrowserOffline,
  getIsOfflineMode,
  markBackendReachable,
  markBackendUnreachable,
  probeBackendReachability,
} from "./offline-state";

function shouldBypassApolloErrorUx(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return isLandingRoute(window.location.pathname);
}

function shouldIgnoreAuthSessionExpiry(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return isStandaloneShellRoute(window.location.pathname);
}

function shouldSuppressNetworkErrorUx(operationContext: Record<string, unknown>): boolean {
  return getIsOfflineMode() || operationContext.offlineCacheFallback === true;
}

const httpLink = new HttpLink({
  uri: resolveGraphqlHttpUrl(),
  credentials: "include",
});

const authLink = new SetContextLink((prevContext) => {
  const explicitAuthorization =
    typeof prevContext.headers?.authorization === "string"
      ? prevContext.headers.authorization
      : undefined;
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  return {
    headers: {
      ...prevContext.headers,
      authorization: explicitAuthorization ?? (token ? `Bearer ${token}` : ""),
      "content-type": "application/json",
    },
  };
});

const wsLink = typeof window !== "undefined" ? new GraphqlWsLink() : null;

function logGraphQlDiagnostic(message: string, locations: unknown, path: unknown): void {
  const loc = JSON.stringify(locations);
  const p = JSON.stringify(path);
  console.error(`[GraphQL error]: Message: ${message}, Location: ${loc}, Path: ${p}`);
}

function apolloLikeFromGraphQlField(graphQLError: {
  readonly message: string;
  readonly code?: string;
  readonly payload?: Record<string, unknown>;
  readonly locations?: unknown;
  readonly path?: unknown;
  readonly extensions?: GraphQLErrorExtensions;
}): ApolloErrorLike {
  const { message, code, payload, extensions } = graphQLError;
  return {
    message,
    graphQLErrors: [{ message, code, payload, extensions }],
  };
}

function isIgnorableSocketClosedError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : String(error ?? "");

  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("socket closed") ||
    normalizedMessage.includes("websocket closed") ||
    normalizedMessage.includes("connection closed") ||
    normalizedMessage.includes("closed before the connection was established")
  );
}

const errorLink = new ErrorLink(({ error, operation }) => {
  if (isIgnorableSocketClosedError(error)) {
    return;
  }

  const operationContext = operation.getContext() as Record<string, unknown>;

  if (shouldBypassApolloErrorUx()) {
    if (CombinedGraphQLErrors.is(error)) {
      for (const graphQLError of error.errors) {
        logGraphQlDiagnostic(graphQLError.message, graphQLError.locations, graphQLError.path);
      }
    } else if (error) {
      const rawMessage =
        error instanceof Error
          ? error.message
          : ServerError.is(error)
            ? error.message || "Network error"
            : "An error occurred";
      console.error(`[Error on landing]: ${rawMessage}`);
    }
    return;
  }

  if (CombinedGraphQLErrors.is(error)) {
    let shouldLogout = false;

    for (const graphQLError of error.errors) {
      logGraphQlDiagnostic(graphQLError.message, graphQLError.locations, graphQLError.path);

      const gql = graphQLError as { code?: string };
      const errorCode =
        gql.code ?? (graphQLError.extensions as { code?: string } | undefined)?.code;
      const errorMessage = extractGraphQLErrorMessage(apolloLikeFromGraphQlField(graphQLError));
      const isRoleForbidden =
        isAccessDeniedGraphQLError({
          message: graphQLError.message,
          code: errorCode,
          extensions: graphQLError.extensions as GraphQLErrorExtensions | undefined,
        }) &&
        !isAuthSessionInvalidGraphQLError({
          message: graphQLError.message,
          code: errorCode,
          extensions: graphQLError.extensions as GraphQLErrorExtensions | undefined,
        });

      if (!(shouldIgnoreAuthSessionExpiry() && isRoleForbidden) && errorMessage.trim()) {
        queueApolloError(errorMessage);
      }

      if (
        isAuthSessionInvalidGraphQLError({
          message: graphQLError.message,
          code: errorCode,
          extensions: graphQLError.extensions as GraphQLErrorExtensions | undefined,
        })
      ) {
        shouldLogout = true;
      }
    }

    if (shouldLogout && !shouldIgnoreAuthSessionExpiry()) {
      notifyAuthSessionExpired();
    }
    return;
  }

  if (ServerError.is(error)) {
    if (shouldSuppressNetworkErrorUx(operationContext)) {
      return;
    }

    const rawMessage = error.message || "Network error";
    console.error(`[Network error]: ${rawMessage}`);

    const userFriendlyMessage = extractGraphQLErrorMessage({
      message: rawMessage,
      networkError: error,
    });
    if (userFriendlyMessage.trim()) {
      queueApolloError(userFriendlyMessage);
    }

    if (error.statusCode === 401 && !shouldIgnoreAuthSessionExpiry()) {
      notifyAuthSessionExpired();
    }
    return;
  }

  if (error) {
    if (shouldSuppressNetworkErrorUx(operationContext)) {
      return;
    }

    const rawMessage = error.message || "An error occurred";
    console.error(`[Error]: ${rawMessage}`);
    const userFriendlyMessage = extractGraphQLErrorMessage(
      error instanceof Error ? error : new Error(rawMessage)
    );
    if (userFriendlyMessage.trim()) {
      queueApolloError(userFriendlyMessage);
    }
  }
});

function createNetworkReachabilityLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    return forward(operation).pipe(
      tap(() => {
        markBackendReachable();
      })
    );
  });
}

function createHttpTransportLink(): ApolloLink {
  return ApolloLink.from([createNetworkReachabilityLink(), httpLink]);
}

function createTransportLink(): ApolloLink {
  const httpTransport = createHttpTransportLink();

  return wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === "OperationDefinition" && definition.operation === "subscription"
          );
        },
        wsLink,
        httpTransport
      )
    : httpTransport;
}

function createApolloLink(cache: InMemoryCache): ApolloLink {
  return ApolloLink.from([
    errorLink,
    createCacheFallbackLink(cache),
    authLink,
    createTransportLink(),
  ]);
}

export let apolloClient!: ApolloClient;

type InitApolloClientOptions = {
  readonly deferCacheHydrate?: boolean;
};

export async function initApolloClient(options?: InitApolloClientOptions): Promise<ApolloClient> {
  const cache = new InMemoryCache({
    typePolicies: paginatedQueryTypePolicies,
  });

  if (!options?.deferCacheHydrate) {
    await hydrateApolloCache(cache);
  }

  const defaultWatchQueryFetchPolicy: WatchQueryFetchPolicy = getIsBrowserOffline()
    ? "cache-only"
    : "cache-and-network";

  const client = new ApolloClient({
    link: createApolloLink(cache),
    cache,
    defaultOptions: {
      watchQuery: {
        errorPolicy: "all",
        fetchPolicy: defaultWatchQueryFetchPolicy,
      },
      query: {
        errorPolicy: "all",
        fetchPolicy: getIsBrowserOffline() ? "cache-only" : "cache-first",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  });

  apolloClient = client;
  registerApolloCacheUnloadPersist(cache);

  if (!getIsBrowserOffline()) {
    void probeBackendReachability().then((reachable) => {
      if (reachable) {
        markBackendReachable();
      } else {
        markBackendUnreachable();
      }
    });
  }

  return client;
}

export async function resetApolloClientCache(): Promise<void> {
  if (apolloClient) {
    await apolloClient.clearStore();
  }

  await clearFileContentCache();
  await clearPersistedApolloCache();
}
