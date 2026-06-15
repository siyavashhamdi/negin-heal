import { useContext, type ReactElement, type ReactNode } from "react";
import { useQuery } from "@apollo/client/react";
import { APP_VERSION_QUERY } from "../graphql/queries/appVersionConfig.query";
import {
  AppSettingsContext,
  EMPTY_APP_VERSION,
  type AppSettingsContextValue,
} from "./app-settings-context";

type AppVersionConfigQuery = {
  readonly appVersionConfig: {
    readonly value: string;
  };
};

interface AppSettingsProviderProps {
  readonly children: ReactNode;
}

export const AppSettingsProvider = ({
  children,
}: AppSettingsProviderProps): ReactElement => {
  const { data } = useQuery<AppVersionConfigQuery>(APP_VERSION_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const value: AppSettingsContextValue = {
    appVersion: data?.appVersionConfig ?? EMPTY_APP_VERSION,
  };

  return (
    <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppSettings = (): AppSettingsContextValue => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error("The hook 'useAppSettings' should be used inside 'AppSettingsProvider'.");
  }
  return context;
};
