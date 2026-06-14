import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { SetContextLink } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { queueApolloError, queueRedirectToLogin } from "../components/apollo-error-queue";
import { extractGraphQLErrorMessage, type ApolloErrorLike, type GraphQLErrorExtensions } from "../utilities/graphql-error.util";
import { paginatedQueryTypePolicies } from "./apollo/paginated-query-cache.policy";

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

const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    for (const graphQLError of error.errors) {
      logGraphQlDiagnostic(graphQLError.message, graphQLError.locations, graphQLError.path);

      const errorMessage = extractGraphQLErrorMessage(apolloLikeFromGraphQlField(graphQLError));
      queueApolloError(errorMessage);

      const gql = graphQLError as { code?: string };
      const errorCode =
        gql.code ?? (graphQLError.extensions as { code?: string } | undefined)?.code;
      if (errorCode === "UNAUTHENTICATED" || errorCode === "FORBIDDEN") {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
        if (errorCode === "UNAUTHENTICATED") {
          queueRedirectToLogin();
        }
      }
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

    if (error.statusCode === 401 || error.statusCode === 403) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
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
  link: ApolloLink.from([errorLink, authLink, httpLink]),
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
