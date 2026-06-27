import { useEffect, useState, type ReactElement } from "react";
import { Box, LinearProgress } from "@mui/material";
import { NetworkStatus } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useLoading } from "../hooks/useLoading";
import styles from "./styles/LoadingBar.module.scss";

const APOLLO_LOADING_POLL_MS = 150;

const ACTIVE_APOLLO_NETWORK_STATUSES = new Set<NetworkStatus>([
  NetworkStatus.loading,
  NetworkStatus.setVariables,
  NetworkStatus.fetchMore,
  NetworkStatus.refetch,
  NetworkStatus.poll,
]);

/**
 * Top-of-viewport linear progress while GraphQL is in flight or app loading context is active.
 */
export const LoadingBar = (): ReactElement | null => {
  const apolloClient = useApolloClient();
  const { isLoading: contextLoading } = useLoading();
  const [apolloLoading, setApolloLoading] = useState(false);

  useEffect(() => {
    const syncApolloLoading = (): void => {
      try {
        const queries = apolloClient.getObservableQueries();
        const hasLoading = [...queries.values()].some((query) => {
          const { loading, networkStatus } = query.getCurrentResult();
          return loading && ACTIVE_APOLLO_NETWORK_STATUSES.has(networkStatus);
        });
        setApolloLoading(hasLoading);
      } catch {
        setApolloLoading(false);
      }
    };

    syncApolloLoading();
    const intervalId = window.setInterval(syncApolloLoading, APOLLO_LOADING_POLL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [apolloClient]);

  const showLoading = contextLoading || apolloLoading;
  if (!showLoading) {
    return null;
  }

  return (
    <Box className={styles.root}>
      <LinearProgress className={styles.progress} color="primary" />
    </Box>
  );
};
