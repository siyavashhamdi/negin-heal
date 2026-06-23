import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import faApp from "../locales/fa/app.json";
import faAuth from "../locales/fa/auth.json";
import faErrors from "../locales/fa/errors.json";
import faSuccess from "../locales/fa/success.json";
import faLayout from "../locales/fa/layout.json";
import faPages from "../locales/fa/pages.json";
import faTable from "../locales/fa/table.json";
import faSeo from "../locales/fa/seo.json";

const DEFAULT_LOCALE = "fa" as const;

const resources = {
  [DEFAULT_LOCALE]: {
    translation: {
      ...faApp,
      ...faLayout,
      ...faTable,
      ...faPages,
      ...faAuth,
      ...faErrors,
      ...faSuccess,
      ...faSeo,
    },
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [DEFAULT_LOCALE],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

document.documentElement.setAttribute("dir", "rtl");
document.documentElement.setAttribute("lang", DEFAULT_LOCALE);

export default i18n;
