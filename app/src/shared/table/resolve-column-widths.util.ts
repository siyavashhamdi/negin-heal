/** Minimum width for column-filter cells that host select/autocomplete controls. */
export const COLUMN_FILTER_DROPDOWN_MIN_WIDTH = "15rem";

function parseRemValue(width: string): number {
  const match = /^([\d.]+)rem$/.exec(width.trim());
  return match ? Number(match[1]) : 10;
}

function formatRemValue(value: number): string {
  return `${value}rem`;
}

function totalRemWidth(
  columnIds: readonly string[],
  widthById: Record<string, string>,
  fallbackRem = 10
): number {
  return columnIds.reduce(
    (sum, id) => sum + parseRemValue(widthById[id] ?? formatRemValue(fallbackRem)),
    0
  );
}

/** Per-column width/min-width in rem from {@link widthById}. */
export function columnWidthRem(
  columnId: string,
  widthById: Record<string, string>,
  fallbackRem = 10
): string {
  return widthById[columnId] ?? formatRemValue(fallbackRem);
}

/** Share of table width (0–100) from rem weights in {@link widthById}. */
export function columnWidthPercent(
  columnId: string,
  allColumnIds: readonly string[],
  widthById: Record<string, string>,
  fallbackRem = 10
): string {
  const total = totalRemWidth(allColumnIds, widthById, fallbackRem);
  if (total <= 0) {
    return "100%";
  }
  const own = parseRemValue(widthById[columnId] ?? formatRemValue(fallbackRem));
  return `${(own / total) * 100}%`;
}

/** Combined percent width for filter cells spanning multiple columns. */
export function sumColumnWidthPercents(
  columnIds: readonly string[],
  allColumnIds: readonly string[],
  widthById: Record<string, string>,
  fallbackRem = 10
): string {
  const totalAll = totalRemWidth(allColumnIds, widthById, fallbackRem);
  if (totalAll <= 0) {
    return "100%";
  }
  const spanTotal = totalRemWidth(columnIds, widthById, fallbackRem);
  return `${(spanTotal / totalAll) * 100}%`;
}

/** Sum rem widths for a list of column ids (used for merged filter cells). */
export function sumColumnWidthsRem(
  columnIds: readonly string[],
  widthById: Record<string, string>,
  fallbackRem = 10
): string {
  const total = columnIds.reduce(
    (sum, id) => sum + parseRemValue(widthById[id] ?? formatRemValue(fallbackRem)),
    0
  );
  return formatRemValue(total);
}

/**
 * Merges data column widths with optional wider filter-row widths (table-layout: fixed
 * uses one width per column, so filter width applies to the whole column).
 *
 * @deprecated Column layout uses {@link columnWidthById} only; filter controls use poppers.
 */
export function resolveColumnWidths(
  columnWidthById: Record<string, string>,
  columnFilterWidthById?: Record<string, string>
): Record<string, string> {
  const merged = { ...columnWidthById };
  if (!columnFilterWidthById) {
    return merged;
  }

  for (const [id, filterWidth] of Object.entries(columnFilterWidthById)) {
    const dataWidth = columnWidthById[id] ?? "10rem";
    merged[id] = parseRemValue(filterWidth) > parseRemValue(dataWidth) ? filterWidth : dataWidth;
  }

  return merged;
}
