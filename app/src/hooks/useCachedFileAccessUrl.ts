import { useEffect, useState } from "react";

import {
  acquireCachedFileBlobUrl,
  fetchAndCacheFileContent,
  getCachedFileRecord,
  initFileContentCache,
  releaseCachedFileBlobUrl,
} from "../lib/file-content-cache";
import {
  getFileIdFromAccessUrl,
  resolveFileAccessUrl,
  type FileAccessUrl,
} from "../utils/fileAccessUrl.util";

export type CachedFileUrlState = {
  readonly url: string | null;
  readonly isLoading: boolean;
  readonly fromCache: boolean;
};

type UseCachedFileUrlParams = {
  readonly fileId: string | null | undefined;
  readonly networkUrl: string | null | undefined;
  readonly mimeType?: string | null;
  readonly fileName?: string | null;
  readonly enabled?: boolean;
};

function normalizeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function useCachedFileUrl({
  fileId,
  networkUrl,
  mimeType,
  fileName,
  enabled = true,
}: UseCachedFileUrlParams): CachedFileUrlState {
  const normalizedFileId = normalizeId(fileId);
  const normalizedNetworkUrl = normalizeUrl(networkUrl);
  const shouldResolve = enabled && normalizedFileId != null && normalizedNetworkUrl != null;

  const [state, setState] = useState<CachedFileUrlState>(() => ({
    url: shouldResolve ? normalizedNetworkUrl : normalizedNetworkUrl,
    isLoading: shouldResolve,
    fromCache: false,
  }));

  useEffect(() => {
    if (!shouldResolve || !normalizedFileId || !normalizedNetworkUrl) {
      setState({
        url: normalizedNetworkUrl,
        isLoading: false,
        fromCache: false,
      });
      return undefined;
    }

    let cancelled = false;
    let activeFileId: string | null = null;

    const resolveUrl = async (): Promise<void> => {
      setState({
        url: normalizedNetworkUrl,
        isLoading: true,
        fromCache: false,
      });

      try {
        await initFileContentCache();

        const cachedRecord = await getCachedFileRecord(normalizedFileId);
        if (cancelled) {
          return;
        }

        if (cachedRecord) {
          const blob = new Blob([cachedRecord.content], { type: cachedRecord.mimeType });
          activeFileId = normalizedFileId;
          const blobUrl = acquireCachedFileBlobUrl(normalizedFileId, blob);
          setState({
            url: blobUrl,
            isLoading: false,
            fromCache: true,
          });
          return;
        }

        const blob = await fetchAndCacheFileContent({
          fileId: normalizedFileId,
          networkUrl: normalizedNetworkUrl,
          mimeType,
          fileName,
        });

        if (cancelled) {
          return;
        }

        activeFileId = normalizedFileId;
        const blobUrl = acquireCachedFileBlobUrl(normalizedFileId, blob);
        setState({
          url: blobUrl,
          isLoading: false,
          fromCache: false,
        });
      } catch {
        if (!cancelled) {
          setState({
            url: normalizedNetworkUrl,
            isLoading: false,
            fromCache: false,
          });
        }
      }
    };

    void resolveUrl();

    return () => {
      cancelled = true;
      if (activeFileId) {
        releaseCachedFileBlobUrl(activeFileId);
      }
    };
  }, [fileName, mimeType, normalizedFileId, normalizedNetworkUrl, shouldResolve]);

  return state;
}

export function useCachedFileAccessUrl(
  access: FileAccessUrl | null | undefined,
  options?: { readonly enabled?: boolean }
): CachedFileUrlState {
  const fileId = getFileIdFromAccessUrl(access);
  const networkUrl = resolveFileAccessUrl(access);

  return useCachedFileUrl({
    fileId,
    networkUrl,
    mimeType: access?.mimeType,
    fileName: access?.name,
    enabled: options?.enabled,
  });
}
