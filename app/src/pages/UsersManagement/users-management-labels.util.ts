import type { TFunction } from "i18next";
import { parseTfFlag as parseSharedTfFlag } from "../../shared/table/tf-flag-labels.util";

export function parseTfFlag(raw: string | null | undefined): boolean | null {
  return parseSharedTfFlag(raw);
}

export function tfLabel(value: string | null | undefined, t: TFunction, empty = "—"): string {
  const parsed = parseTfFlag(value);
  if (parsed === true) {
    return t("pages.usersManagement.flagLabels.yes");
  }
  if (parsed === false) {
    return t("pages.usersManagement.flagLabels.no");
  }
  return empty;
}

export function staffLabel(value: number | null | undefined, t: TFunction, empty = "—"): string {
  if (value === 1) {
    return t("pages.usersManagement.staffFilter.organizational");
  }
  if (value === 0) {
    return t("pages.usersManagement.staffFilter.applicant");
  }
  return empty;
}

export function staffFilterOptions(t: TFunction) {
  return [
    { value: "-1", label: t("pages.usersManagement.staffFilter.all") },
    { value: "0", label: t("pages.usersManagement.staffFilter.applicant") },
    { value: "1", label: t("pages.usersManagement.staffFilter.organizational") },
  ];
}

export function superuserFilterOptions(t: TFunction) {
  return [
    { value: "", label: t("pages.usersManagement.staffFilter.all") },
    { value: "t", label: t("pages.usersManagement.superuserLabels.yes") },
    { value: "f", label: t("pages.usersManagement.superuserLabels.no") },
  ];
}

export function flagFilterOptions(t: TFunction) {
  return superuserFilterOptions(t);
}

export function isAliveFilterOptions(t: TFunction) {
  return superuserFilterOptions(t);
}
