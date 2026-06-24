export function areFormValuesEqual<T>(left: T, right: T): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function hasFormChanges<T>(
  initial: T | null | undefined,
  current: T | null | undefined
): boolean {
  if (initial == null || current == null) {
    return false;
  }

  return !areFormValuesEqual(initial, current);
}
