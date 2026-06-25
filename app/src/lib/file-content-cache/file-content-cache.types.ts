export type CachedFileRecord = {
  readonly fileId: string;
  readonly mimeType: string;
  readonly fileName: string | null;
  readonly sizeBytes: number;
  readonly content: Uint8Array;
  readonly cachedAt: number;
};

export type FetchCachedFileParams = {
  readonly fileId: string;
  readonly networkUrl: string;
  readonly mimeType?: string | null;
  readonly fileName?: string | null;
};
