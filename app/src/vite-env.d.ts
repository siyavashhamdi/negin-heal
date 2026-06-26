/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_PORT: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_DEPLOY_HASH: string;
  readonly VITE_DEPLOY_DATE_TIME: string;
  readonly VITE_NODE_ENV: string;
  readonly VITE_CAPTCHA_ENABLED?: string;
  readonly VITE_UNDER_CONSTRUCTION?: string;
  readonly VITE_EXPOSE_VIA_NETWORK?: string;
  readonly VITE_ALLOWED_HOSTS?: string;
  readonly VITE_PWA_DEV?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.wasm?url" {
  const url: string;
  export default url;
}
