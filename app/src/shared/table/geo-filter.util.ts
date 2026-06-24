/** City/county filters must stay disabled until at least one province/state is selected. */
export function isCityFilterDisabled(stateIdsOrSingleStateId: readonly string[] | string): boolean {
  if (typeof stateIdsOrSingleStateId === "string") {
    return stateIdsOrSingleStateId.trim() === "";
  }
  return stateIdsOrSingleStateId.length === 0;
}
