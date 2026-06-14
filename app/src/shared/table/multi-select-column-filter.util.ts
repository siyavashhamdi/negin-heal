/** TanStack column filter: row matches when its value is in the selected set (empty = no filter). */
export function multiSelectColumnFilterFn(rowValue: unknown, filterValue: unknown): boolean {
  if (!Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }
  return filterValue.includes(String(rowValue ?? ""));
}
