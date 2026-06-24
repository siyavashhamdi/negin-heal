import { ApolloLink } from "@apollo/client/link";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { print } from "@apollo/client/utilities";
import { isNonNullObject } from "@apollo/client/utilities/internal";
import { Observable } from "rxjs";
import { getGraphqlWsClient } from "./graphql-ws-client";

function isLikeCloseEvent(val: unknown): val is { code: number; reason: string } {
  return isNonNullObject(val) && "code" in val && "reason" in val;
}

function isLikeErrorEvent(err: unknown): boolean {
  return (
    isNonNullObject(err) &&
    (err as { target?: { readyState?: number } }).target?.readyState === WebSocket.CLOSED
  );
}

/**
 * Resolves the shared graphql-ws client on each subscription so reconnects
 * always use the current client instance (never a disposed one).
 */
export class GraphqlWsLink extends ApolloLink {
  request(operation: ApolloLink.Operation): Observable<ApolloLink.Result> {
    return new Observable((observer) => {
      const client = getGraphqlWsClient();
      const { query, variables, operationName, extensions } = operation;

      return client.subscribe(
        {
          variables,
          operationName,
          extensions,
          query: print(query),
        },
        {
          next: observer.next.bind(observer),
          complete: observer.complete.bind(observer),
          error: (err) => {
            if (err instanceof Error) {
              return observer.error(err);
            }

            const likeClose = isLikeCloseEvent(err);
            if (likeClose || isLikeErrorEvent(err)) {
              return observer.error(
                new Error(
                  `Socket closed${likeClose ? ` with event ${err.code}` : ""}${likeClose ? ` ${err.reason}` : ""}`
                )
              );
            }

            return observer.error(
              new CombinedGraphQLErrors({
                errors: Array.isArray(err) ? err : [err],
              })
            );
          },
        }
      );
    });
  }
}
