import { createContext } from "react";

export type AppVersionConfig = {
  readonly value: string;
};

export interface AppSettingsContextValue {
  readonly appVersion: AppVersionConfig;
}

export const EMPTY_APP_VERSION: AppVersionConfig = {
  value: "",
};

export const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);
