export const ENAMAD_ID = "746175";
export const ENAMAD_CODE = "qGwindqwSNhAiRX2I9OD2RuBrvm3dnie";
export const ENAMAD_TRUST_URL = `https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;
export const ENAMAD_LOGO_PATH = `/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;
export const ENAMAD_LOGO_URL = `https://trustseal.enamad.ir${ENAMAD_LOGO_PATH}`;
export const ENAMAD_DEV_PROXY_PATH = "/enamad-trust-logo";

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
