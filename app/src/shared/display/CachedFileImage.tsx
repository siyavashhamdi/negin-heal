import type { ImgHTMLAttributes, ReactElement } from "react";

import { useCachedFileAccessUrl, useCachedFileUrl } from "../../hooks/useCachedFileAccessUrl";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

type CachedFileImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  readonly accessUrl?: FileAccessUrl | null;
  readonly networkUrl?: string | null;
  readonly fileId?: string | null;
};

export function CachedFileImage({
  accessUrl,
  networkUrl,
  fileId,
  alt,
  ...imageProps
}: CachedFileImageProps): ReactElement | null {
  const fromAccess = useCachedFileAccessUrl(accessUrl, {
    enabled: accessUrl != null,
  });
  const fromUrl = useCachedFileUrl({
    fileId,
    networkUrl,
    enabled: accessUrl == null,
  });
  const resolved = accessUrl != null ? fromAccess : fromUrl;

  if (!resolved.url) {
    return null;
  }

  return <img {...imageProps} src={resolved.url} alt={alt} />;
}
