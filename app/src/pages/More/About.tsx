import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useQuery } from "@apollo/client/react";
import { type ReactElement } from "react";
import { APP_ABOUT_PAGE_QUERY } from "../../graphql/queries/appAboutPageConfig.query";
import EnamadTrustSeal from "../../shared/EnamadTrustSeal";
import PageBackNavigation from "../../shared/PageBackNavigation";
import { EMPTY_APP_ABOUT_PAGE, type AppAboutPageConfigQuery } from "./about-page.api";
import styles from "./styles/more.module.scss";
import { opaqueShellProps } from "../../shared/opaqueShell";

const hasText = (value: string): boolean => value.trim().length > 0;

const AboutPage = (): ReactElement => {
  const { data, loading } = useQuery<AppAboutPageConfigQuery>(APP_ABOUT_PAGE_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const aboutPage = data?.appAboutPageConfig ?? EMPTY_APP_ABOUT_PAGE;

  return (
    <section className={styles.page} aria-busy={loading}>
      <PageBackNavigation label="بازگشت به سایر" fallbackTo="/more" />

      <div className={styles.hero} {...opaqueShellProps}>
        <p>درباره سامانه</p>
        <h2>Negin Heal</h2>
        <span>معرفی کوتاه امکانات، هدف و تجربه کاربری سامانه</span>
      </div>

      <div className={styles.aboutPanel} {...opaqueShellProps}>
        <div className={styles.aboutHeader}>
          <span className={styles.aboutIcon}>
            <InfoOutlinedIcon />
          </span>
        </div>

        {hasText(aboutPage.html) ? (
          <div
            className={styles.aboutContent}
            dangerouslySetInnerHTML={{ __html: aboutPage.html }}
          />
        ) : (
          <p className={styles.aboutEmpty}>محتوای درباره سامانه هنوز تنظیم نشده است.</p>
        )}

        <div className={styles.aboutTrustSection}>
          <p className={styles.aboutSafePayment}>
            پرداخت‌های آنلاین در این سامانه از طریق درگاه‌های معتبر بانکی انجام می‌شود و اطلاعات
            مالی شما با رعایت استانداردهای امنیتی محافظت می‌گردد.
          </p>
          <EnamadTrustSeal />
        </div>
      </div>
    </section>
  );
};

export default AboutPage;
