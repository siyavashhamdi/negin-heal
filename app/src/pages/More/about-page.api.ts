export type AppAboutPageConfig = {
  readonly html: string;
};

export type AppAboutPageConfigQuery = {
  readonly appAboutPageConfig: AppAboutPageConfig;
};

export const EMPTY_APP_ABOUT_PAGE: AppAboutPageConfig = {
  html: "",
};
