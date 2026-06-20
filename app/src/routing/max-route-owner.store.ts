let activeOwnerId: string | null = null;

export function setMaxRouteOwner(ownerId: string): void {
  activeOwnerId = ownerId;
}

export function clearMaxRouteOwner(ownerId?: string): void {
  if (ownerId == null || activeOwnerId === ownerId) {
    activeOwnerId = null;
  }
}

export function isMaxRouteOwner(ownerId: string): boolean {
  return activeOwnerId === ownerId;
}
