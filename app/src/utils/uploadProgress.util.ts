export type UploadProgressEntry = {
  readonly loaded: number;
  readonly total: number;
};

export function getFieldUploadPercent(entry: UploadProgressEntry | undefined): number | null {
  if (entry == null || entry.total <= 0) {
    return entry != null ? 0 : null;
  }

  return Math.min(100, Math.round((entry.loaded / entry.total) * 100));
}

export function calculateBatchUploadPercent(
  entries: Readonly<Record<string, UploadProgressEntry>>
): number {
  let loaded = 0;
  let total = 0;

  for (const entry of Object.values(entries)) {
    loaded += entry.loaded;
    total += entry.total;
  }

  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((loaded / total) * 100));
}
