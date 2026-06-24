import PrivacyTipRoundedIcon from "@mui/icons-material/PrivacyTipRounded";
import { useQuery } from "@apollo/client/react";
import { type ReactElement } from "react";
import { APP_PRIVACY_POLICY_PAGE_QUERY } from "../../graphql/queries/appPrivacyPolicyPageConfig.query";
import { useHtmlContentSeoOverride } from "../../hooks/useHtmlContentSeoOverride";
import { useTranslation } from "../../hooks/useTranslation";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import {
  EMPTY_APP_PRIVACY_POLICY_PAGE,
  type AppPrivacyPolicyPageConfigQuery,
} from "./privacy-policy-page.api";
import styles from "./styles/more.module.scss";
import { opaqueShellProps } from "../../shared/opaqueShell";

const hasText = (value: string): boolean => value.trim().length > 0;

const PrivacyPolicyPage = (): ReactElement => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<AppPrivacyPolicyPageConfigQuery>(
    APP_PRIVACY_POLICY_PAGE_QUERY,
    {
      fetchPolicy: "cache-and-network",
    }
  );
  const privacyPolicyPage = data?.appPrivacyPolicyPageConfig ?? EMPTY_APP_PRIVACY_POLICY_PAGE;

  useHtmlContentSeoOverride({
    html: privacyPolicyPage.html,
    fallbackDescriptionKey: "seo.pages.morePrivacyPolicy.description",
    canonicalPath: APP_SHELL_ROUTES.morePrivacyPolicy,
    breadcrumbs: [
      { name: t("app.pageTitles.more"), path: APP_SHELL_ROUTES.more },
      {
        name: t("app.pageTitles.morePrivacyPolicy"),
        path: APP_SHELL_ROUTES.morePrivacyPolicy,
      },
    ],
  });

  return (
    <section className={styles.page} aria-busy={loading}>
      <div className={styles.hero} {...opaqueShellProps}>
        <p>حریم خصوصی</p>
        <h2>سیاست حریم خصوصی</h2>
        <span>شفافیت درباره نگهداری، استفاده و حفاظت از اطلاعات کاربران</span>
      </div>

      <div className={styles.aboutPanel} {...opaqueShellProps}>
        <div className={styles.aboutHeader}>
          <span className={styles.aboutIcon}>
            <PrivacyTipRoundedIcon />
          </span>
        </div>

        {hasText(privacyPolicyPage.html) ? (
          <div
            className={styles.aboutContent}
            dangerouslySetInnerHTML={{ __html: privacyPolicyPage.html }}
          />
        ) : (
          <p className={styles.aboutEmpty}>محتوای سیاست حریم خصوصی هنوز تنظیم نشده است.</p>
        )}
      </div>
    </section>
  );
};

export default PrivacyPolicyPage;
