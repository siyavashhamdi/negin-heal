import {
  ENAMAD_CODE,
  ENAMAD_DEV_PROXY_PATH,
  ENAMAD_LOGO_URL,
  ENAMAD_TRUST_URL,
} from "./enamad.constants";

function getEnamadLogoSrc(): string {
  return import.meta.env.DEV ? ENAMAD_DEV_PROXY_PATH : ENAMAD_LOGO_URL;
}

export function buildEnamadEmbedHtml(): string {
  const logoSrc = getEnamadLogoSrc();

  return (
    `<a referrerpolicy='origin' target='_blank' href='${ENAMAD_TRUST_URL}'>` +
    `<img referrerpolicy='origin' src='${logoSrc}' alt='' code='${ENAMAD_CODE}'></a>`
  );
}
