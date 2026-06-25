type BlobUrlEntry = {
  readonly blob: Blob;
  readonly url: string;
  refCount: number;
};

const blobUrlEntries = new Map<string, BlobUrlEntry>();

export function acquireCachedFileBlobUrl(fileId: string, blob: Blob): string {
  const existing = blobUrlEntries.get(fileId);
  if (existing && existing.blob.size === blob.size && existing.blob.type === blob.type) {
    existing.refCount += 1;
    return existing.url;
  }

  if (existing) {
    URL.revokeObjectURL(existing.url);
    blobUrlEntries.delete(fileId);
  }

  const url = URL.createObjectURL(blob);
  blobUrlEntries.set(fileId, { blob, url, refCount: 1 });
  return url;
}

export function releaseCachedFileBlobUrl(fileId: string): void {
  const entry = blobUrlEntries.get(fileId);
  if (!entry) {
    return;
  }

  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    URL.revokeObjectURL(entry.url);
    blobUrlEntries.delete(fileId);
  }
}

export function revokeAllCachedFileBlobUrls(): void {
  for (const entry of blobUrlEntries.values()) {
    URL.revokeObjectURL(entry.url);
  }

  blobUrlEntries.clear();
}
