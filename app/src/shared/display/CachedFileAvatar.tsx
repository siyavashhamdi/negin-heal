import { Avatar, type AvatarProps } from "@mui/material";
import type { ReactElement } from "react";

import { useCachedFileAccessUrl, useCachedFileUrl } from "../../hooks/useCachedFileAccessUrl";
import type { FileAccessUrl } from "../../utils/fileAccessUrl.util";

type CachedFileAvatarProps = Omit<AvatarProps, "src"> & {
  readonly accessUrl?: FileAccessUrl | null;
  readonly networkUrl?: string | null;
  readonly fileId?: string | null;
};

export function CachedFileAvatar({
  accessUrl,
  networkUrl,
  fileId,
  ...avatarProps
}: CachedFileAvatarProps): ReactElement {
  const fromAccess = useCachedFileAccessUrl(accessUrl, {
    enabled: accessUrl != null,
  });
  const fromUrl = useCachedFileUrl({
    fileId,
    networkUrl,
    enabled: accessUrl == null,
  });
  const resolved = accessUrl != null ? fromAccess : fromUrl;

  return <Avatar {...avatarProps} src={resolved.url ?? undefined} />;
}
