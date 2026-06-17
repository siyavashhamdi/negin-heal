export type FileAccessUrl = {
  readonly baseUrl?: string | null;
  readonly apiPath: string;
  readonly fileId: string;
  readonly token: string;
};

export type ExistingFilePreview = {
  readonly accessUrl: string;
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

function getFallbackOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "";
}

export function resolveFileAccessUrl(
  access: FileAccessUrl | null | undefined,
  fallbackOrigin?: string,
): string | null {
  const fileId = access?.fileId?.trim();
  const token = access?.token?.trim();
  if (!fileId || !token || !access) {
    return null;
  }

  const base = (access.baseUrl?.trim() || fallbackOrigin || getFallbackOrigin()).replace(
    /\/$/,
    "",
  );
  const apiPath = access.apiPath.startsWith("/")
    ? access.apiPath
    : `/${access.apiPath}`;

  return `${base}${apiPath}/${fileId}/content?token=${encodeURIComponent(token)}`;
}

export function getFileIdFromAccessUrl(
  access: FileAccessUrl | null | undefined,
): string | null {
  const fileId = access?.fileId?.trim();
  return fileId || null;
}

export function buildExistingFilePreview(
  accessUrl: FileAccessUrl | null | undefined,
  name: string,
  mimeType: string,
): ExistingFilePreview | null {
  const resolved = resolveFileAccessUrl(accessUrl);
  if (!resolved) {
    return null;
  }

  return {
    accessUrl: resolved,
    name,
    mimeType,
    sizeBytes: 0,
  };
}
