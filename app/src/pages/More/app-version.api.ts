export type AppVersionConfig = {
  readonly value: string;
};

export type AppVersionConfigQuery = {
  readonly appVersionConfig: AppVersionConfig;
};

export const EMPTY_APP_VERSION: AppVersionConfig = {
  value: "",
};
