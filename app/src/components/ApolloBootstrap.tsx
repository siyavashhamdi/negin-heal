import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import type { ApolloClient } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { hydrateApolloCache } from "../lib/apollo-cache-persist";
import { initApolloClient } from "../lib/apollo-client";
import { initFileContentCache } from "../lib/file-content-cache";
import { initBrowserOfflineListeners } from "../lib/offline-state";
import { isNativeAndroidShell } from "../utils/nativePlatform.util";

type ApolloBootstrapProps = {
  readonly children: ReactNode;
};

export function ApolloBootstrap({ children }: ApolloBootstrapProps): ReactElement {
  const [client, setClient] = useState<ApolloClient | null>(null);

  useEffect(() => {
    initBrowserOfflineListeners();

    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      try {
        if (isNativeAndroidShell()) {
          const fastClient = await initApolloClient({ deferCacheHydrate: true });
          if (cancelled) {
            return;
          }

          setClient(fastClient);

          void initFileContentCache()
            .catch((error: unknown) => {
              console.warn(
                "[File cache] SQLite cache unavailable; continuing without local cache.",
                error,
              );
            })
            .then(() => hydrateApolloCache(fastClient.cache))
            .catch((error: unknown) => {
              console.warn("[Offline cache] Failed to restore Apollo cache in background.", error);
            });
          return;
        }

        await initFileContentCache().catch((error: unknown) => {
          console.warn("[File cache] SQLite cache unavailable; continuing without local cache.", error);
        });

        const webClient = await initApolloClient();
        if (!cancelled) {
          setClient(webClient);
        }
      } catch (error: unknown) {
        console.error("[Apollo] Failed to initialize client.", error);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
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
