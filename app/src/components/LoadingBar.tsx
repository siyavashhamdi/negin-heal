import { useEffect, useState, type ReactElement } from "react";
import { Box, LinearProgress } from "@mui/material";
import { useApolloClient } from "@apollo/client/react";
import { useLoading } from "../hooks/useLoading";
import styles from "./styles/LoadingBar.module.scss";

const APOLLO_LOADING_POLL_MS = 150;

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
        const hasLoading = [...queries.values()].some((query) => query.getCurrentResult().loading);
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
