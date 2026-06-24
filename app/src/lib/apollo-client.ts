import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from "@apollo/client";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { SetContextLink } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { GraphqlWsLink } from "./graphql-ws-link";
import { getMainDefinition } from "@apollo/client/utilities";
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

const httpLink = new HttpLink({
  uri: "/graphql",
  credentials: "include",
});

const authLink = new SetContextLink((prevContext) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : "",
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

const errorLink = new ErrorLink(({ error }) => {
  if (isIgnorableSocketClosedError(error)) {
    return;
  }

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

      if (!(shouldIgnoreAuthSessionExpiry() && isRoleForbidden)) {
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
    const rawMessage = error.message || "Network error";
    console.error(`[Network error]: ${rawMessage}`);

    const userFriendlyMessage = extractGraphQLErrorMessage({
      message: rawMessage,
      networkError: error,
    });
    queueApolloError(userFriendlyMessage);

    if (error.statusCode === 401 && !shouldIgnoreAuthSessionExpiry()) {
      notifyAuthSessionExpired();
    }
    return;
  }

  if (error) {
    const rawMessage = error.message || "An error occurred";
    console.error(`[Error]: ${rawMessage}`);
    queueApolloError(
      extractGraphQLErrorMessage(error instanceof Error ? error : new Error(rawMessage))
    );
  }
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    errorLink,
    authLink,
    wsLink
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === "OperationDefinition" && definition.operation === "subscription"
            );
          },
          wsLink,
          httpLink
        )
      : httpLink,
  ]),
  cache: new InMemoryCache({
    typePolicies: paginatedQueryTypePolicies,
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});
