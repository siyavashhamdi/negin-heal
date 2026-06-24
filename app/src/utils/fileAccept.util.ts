function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }

  return fileName.slice(dotIndex).toLowerCase();
}

function resolveMimeTypeFromFileName(fileName: string): string {
  const extension = getFileExtension(fileName).slice(1);
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    case "txt":
      return "text/plain";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "";
  }
}

function tokenMatchesFile(token: string, mimeType: string, extension: string): boolean {
  const normalizedToken = token.trim().toLowerCase();
  if (!normalizedToken || normalizedToken === "*/*") {
    return true;
  }

  if (normalizedToken.startsWith(".")) {
    return extension === normalizedToken;
  }

  if (normalizedToken.endsWith("/*")) {
    const prefix = normalizedToken.slice(0, -1);
    return mimeType.startsWith(prefix);
  }

  return mimeType === normalizedToken;
}

export function matchesFileAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0 || tokens.includes("*/*")) {
    return true;
  }

  const mimeType = normalizeMimeType(file.type) || resolveMimeTypeFromFileName(file.name);
  const extension = getFileExtension(file.name);

  return tokens.some((token) => tokenMatchesFile(token, mimeType, extension));
}
