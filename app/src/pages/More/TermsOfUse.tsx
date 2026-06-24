import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import { useQuery } from "@apollo/client/react";
import { type ReactElement } from "react";
import { APP_TERMS_OF_USE_PAGE_QUERY } from "../../graphql/queries/appTermsOfUsePageConfig.query";
import { useHtmlContentSeoOverride } from "../../hooks/useHtmlContentSeoOverride";
import { useTranslation } from "../../hooks/useTranslation";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import {
  EMPTY_APP_TERMS_OF_USE_PAGE,
  type AppTermsOfUsePageConfigQuery,
} from "./terms-of-use-page.api";
import styles from "./styles/more.module.scss";
import { opaqueShellProps } from "../../shared/opaqueShell";

const hasText = (value: string): boolean => value.trim().length > 0;

const TermsOfUsePage = (): ReactElement => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<AppTermsOfUsePageConfigQuery>(APP_TERMS_OF_USE_PAGE_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const termsOfUsePage = data?.appTermsOfUsePageConfig ?? EMPTY_APP_TERMS_OF_USE_PAGE;

  useHtmlContentSeoOverride({
    html: termsOfUsePage.html,
    fallbackDescriptionKey: "seo.pages.moreTermsOfUse.description",
    canonicalPath: APP_SHELL_ROUTES.moreTermsOfUse,
    breadcrumbs: [
      { name: t("app.pageTitles.more"), path: APP_SHELL_ROUTES.more },
      {
        name: t("app.pageTitles.moreTermsOfUse"),
        path: APP_SHELL_ROUTES.moreTermsOfUse,
      },
    ],
  });

  return (
    <section className={styles.page} aria-busy={loading}>
      <div className={styles.hero} {...opaqueShellProps}>
        <p>شرایط استفاده</p>
        <h2>شرایط استفاده از سامانه</h2>
        <span>قواعد استفاده از حساب، دوره‌ها، پرداخت‌ها و پشتیبانی Negin Heal</span>
      </div>

      <div className={styles.aboutPanel} {...opaqueShellProps}>
        <div className={styles.aboutHeader}>
          <span className={styles.aboutIcon}>
            <GavelRoundedIcon />
          </span>
        </div>

        {hasText(termsOfUsePage.html) ? (
          <div
            className={styles.aboutContent}
            dangerouslySetInnerHTML={{ __html: termsOfUsePage.html }}
          />
        ) : (
          <p className={styles.aboutEmpty}>محتوای شرایط استفاده هنوز تنظیم نشده است.</p>
        )}
      </div>
    </section>
  );
};

export default TermsOfUsePage;
