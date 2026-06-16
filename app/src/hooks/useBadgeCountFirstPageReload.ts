import { useEffect, useRef } from "react";

import { subscribeBadgeCountUpdates } from "../lib/badge-count-update-listeners";

type UseBadgeCountFirstPageReloadOptions = {
  readonly enabled?: boolean;
  readonly isOnFirstPage: boolean;
  readonly reload: () => void;
};

export const useBadgeCountFirstPageReload = ({
  enabled = true,
  isOnFirstPage,
  reload,
}: UseBadgeCountFirstPageReloadOptions): void => {
  const isOnFirstPageRef = useRef(isOnFirstPage);
  const reloadRef = useRef(reload);

  useEffect(() => {
    isOnFirstPageRef.current = isOnFirstPage;
  }, [isOnFirstPage]);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return subscribeBadgeCountUpdates(() => {
      if (!isOnFirstPageRef.current) {
        return;
      }

      reloadRef.current();
    });
  }, [enabled]);
};
