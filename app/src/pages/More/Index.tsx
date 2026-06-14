import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { Switch } from "@mui/material";
import { type ReactElement } from "react";
import { APP_VERSION } from "../../constants/general.constant";
import { useThemeMode } from "../../contexts/ThemeContext";
import styles from "./styles/more.module.scss";

const More = (): ReactElement => {
  const { mode, toggleTheme } = useThemeMode();
  const isDarkMode = mode === "dark";

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <p>سایر</p>
        <h2>تنظیمات و میانبرها</h2>
        <span>دسترسی سریع به امکانات عمومی پنل</span>
      </div>

      <div className={styles.themeCard}>
        <div className={styles.themeIcon}>
          <LightModeRoundedIcon />
        </div>
        <div>
          <strong>حالت نمایش</strong>
          <small>{isDarkMode ? "حالت تاریک فعال است" : "حالت روشن فعال است"}</small>
        </div>
        <Switch checked={isDarkMode} onChange={toggleTheme} inputProps={{ "aria-label": "تغییر حالت نمایش" }} />
      </div>

      <div className={styles.linkGrid}>
        <button type="button" className={styles.linkCard}>
          <SettingsRoundedIcon />
          <span>تنظیمات سامانه</span>
        </button>
        <button type="button" className={styles.linkCard}>
          <NotificationsRoundedIcon />
          <span>تنظیمات اعلان‌ها</span>
        </button>
        <button type="button" className={styles.linkCard}>
          <SecurityRoundedIcon />
          <span>امنیت و دسترسی</span>
        </button>
        <button type="button" className={styles.linkCard}>
          <HelpOutlineRoundedIcon />
          <span>راهنما و پشتیبانی</span>
        </button>
        <button type="button" className={styles.linkCard}>
          <InfoOutlinedIcon />
          <span>درباره سامانه</span>
        </button>
        <button type="button" className={`${styles.linkCard} ${styles.bugReportCard}`}>
          <BugReportRoundedIcon />
          <span>گزارش باگ</span>
        </button>
      </div>

      <div className={styles.versionBlock}>
        <span />
        <p>نسخه {APP_VERSION}</p>
      </div>
    </section>
  );
};

export default More;
