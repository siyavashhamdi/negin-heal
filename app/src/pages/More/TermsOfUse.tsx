import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import { useQuery } from "@apollo/client/react";
import { type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { APP_TERMS_OF_USE_PAGE_QUERY } from "../../graphql/queries/appTermsOfUsePageConfig.query";
import {
  EMPTY_APP_TERMS_OF_USE_PAGE,
  type AppTermsOfUsePageConfigQuery,
} from "./terms-of-use-page.api";
import styles from "./styles/more.module.scss";

const hasText = (value: string): boolean => value.trim().length > 0;

const TermsOfUsePage = (): ReactElement => {
  const navigate = useNavigate();
  const { data, loading } = useQuery<AppTermsOfUsePageConfigQuery>(
    APP_TERMS_OF_USE_PAGE_QUERY,
    {
      fetchPolicy: "cache-and-network",
    },
  );
  const termsOfUsePage = data?.appTermsOfUsePageConfig ?? EMPTY_APP_TERMS_OF_USE_PAGE;

  return (
    <section className={styles.page} aria-busy={loading}>
      <div className={styles.hero}>
        <p>شرایط استفاده</p>
        <h2>شرایط استفاده از سامانه</h2>
        <span>قواعد استفاده از حساب، دوره‌ها، پرداخت‌ها و پشتیبانی Negin Heal</span>
      </div>

      <div className={styles.aboutPanel}>
        <div className={styles.aboutHeader}>
          <span className={styles.aboutIcon}>
            <GavelRoundedIcon />
          </span>
          <button type="button" onClick={() => navigate("/more")}>
            بازگشت
            <ArrowBackRoundedIcon />
          </button>
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
