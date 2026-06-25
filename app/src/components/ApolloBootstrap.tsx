import { ApolloProvider } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { initApolloClient } from "../lib/apollo-client";
import { initFileContentCache } from "../lib/file-content-cache";
import { initBrowserOfflineListeners } from "../lib/offline-state";
import type { ApolloClient } from "@apollo/client";

type ApolloBootstrapProps = {
  readonly children: ReactNode;
};

export function ApolloBootstrap({ children }: ApolloBootstrapProps): ReactElement {
  const [client, setClient] = useState<ApolloClient | null>(null);

  useEffect(() => {
    initBrowserOfflineListeners();

    void initFileContentCache()
      .catch((error: unknown) => {
        console.warn("[File cache] SQLite cache unavailable; continuing without local cache.", error);
      })
      .then(() => initApolloClient())
      .then(setClient)
      .catch((error: unknown) => {
        console.error("[Apollo] Failed to initialize client.", error);
      });
  }, []);

  if (!client) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          gap: 1.25,
          px: 2,
        }}
      >
        <CircularProgress size={28} aria-hidden />
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری...
        </Typography>
      </Box>
    );
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
