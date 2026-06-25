let activeOwnerId: string | null = null;

export function setCompressMediaRouteOwner(ownerId: string): void {
  activeOwnerId = ownerId;
}

export function clearCompressMediaRouteOwner(ownerId?: string): void {
  if (ownerId == null || activeOwnerId === ownerId) {
    activeOwnerId = null;
  }
}

export function isCompressMediaRouteOwner(ownerId: string): boolean {
  return activeOwnerId === ownerId;
}
