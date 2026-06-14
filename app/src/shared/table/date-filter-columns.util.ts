/** Column ids that use {@link JalaliDateFilterField} in list row filters. */
export const DATE_FILTER_COLUMN_IDS = [
  "actionDate",
  "sendDate",
  "sessionDate",
  "electionAt",
  "startAt",
  "endAt",
  "supervisionAt",
  "createDate",
  "statusChangeDate",
  "issuedAt",
  "expireDate",
] as const;

export type DateFilterColumnId = (typeof DATE_FILTER_COLUMN_IDS)[number];

export function isDateFilterColumnId(columnId: string): columnId is DateFilterColumnId {
  return (DATE_FILTER_COLUMN_IDS as readonly string[]).includes(columnId);
}

/** Supplementary / param keys such as sessionDateFrom, issuedAtStart. */
export function isDateRangeFilterKey(key: string): boolean {
  return /(?:Date|At)(?:From|To|Start|End)$/.test(key);
}
