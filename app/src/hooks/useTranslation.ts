import { useTranslation as useI18nTranslation } from "react-i18next";
import type { TFunction } from "i18next";

export interface AppTranslation {
  readonly t: TFunction;
}

/** Thin wrapper around react-i18next; the app locale is fixed to Persian (`fa`). */
export const useTranslation = (): AppTranslation => {
  const { t } = useI18nTranslation();
  return { t };
};
