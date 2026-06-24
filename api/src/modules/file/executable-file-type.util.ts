const EXECUTABLE_EXTENSIONS = new Set([
  "exe",
  "msi",
  "msp",
  "com",
  "bat",
  "cmd",
  "scr",
  "pif",
  "ps1",
  "vbs",
  "vbe",
  "hta",
  "cpl",
  "msc",
  "inf",
  "reg",
  "lnk",
  "dll",
  "sys",
  "drv",
  "app",
  "dmg",
  "pkg",
  "command",
  "workflow",
  "sh",
  "bash",
  "zsh",
  "fish",
  "run",
  "bin",
  "deb",
  "rpm",
  "apk",
  "appimage",
  "jar",
  "jnlp",
  "msix",
  "appx",
  "ipa",
  "xap",
]);

const EXECUTABLE_MIME_TYPES = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-sh",
  "application/x-bat",
  "application/vnd.microsoft.portable-executable",
  "application/x-mach-binary",
  "application/java-archive",
  "application/vnd.android.package-archive",
  "application/x-apple-diskimage",
  "application/x-debian-package",
  "application/x-redhat-package-manager",
  "application/vnd.ms-cab-compressed",
  "application/x-ms-installer",
  "application/x-msi",
  "application/vnd.apple.installer+xml",
]);

export function getFileExtension(fileName: string): string {
  const trimmed = fileName.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return "";
  }

  return trimmed.slice(dotIndex + 1).toLowerCase();
}

export function isExecutableFileType(
  mimeType: string,
  fileName: string,
): boolean {
  const normalizedMime = mimeType.trim().toLowerCase();
  if (EXECUTABLE_MIME_TYPES.has(normalizedMime)) {
    return true;
  }

  if (
    normalizedMime === "application/octet-stream" &&
    EXECUTABLE_EXTENSIONS.has(getFileExtension(fileName))
  ) {
    return true;
  }

  return EXECUTABLE_EXTENSIONS.has(getFileExtension(fileName));
}
