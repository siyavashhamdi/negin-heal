import CallRoundedIcon from "@mui/icons-material/CallRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import { type ReactElement } from "react";
import styles from "./styles/support.module.scss";

const supportItems = [
  {
    id: "ticket",
    title: "ثبت تیکت پشتیبانی",
    description: "ارسال درخواست برای بررسی مشکل یا سوال تخصصی",
    Icon: ConfirmationNumberRoundedIcon,
  },
  {
    id: "chat",
    title: "گفتگوی آنلاین",
    description: "ارتباط سریع با تیم پشتیبانی در ساعات کاری",
    Icon: ChatRoundedIcon,
  },
  {
    id: "phone",
    title: "تماس با پشتیبانی",
    description: "مشاهده شماره‌های تماس و ساعات پاسخگویی",
    Icon: CallRoundedIcon,
  },
  {
    id: "email",
    title: "ارسال ایمیل",
    description: "ارسال جزئیات مشکل برای پیگیری غیر فوری",
    Icon: MailOutlineRoundedIcon,
  },
];

const Support = (): ReactElement => (
  <section className={styles.page}>
    <div className={styles.hero}>
      <div className={styles.heroIcon}>
        <HelpOutlineRoundedIcon />
      </div>
      <div>
        <p>پشتیبانی</p>
        <h2>چطور می‌توانیم کمک کنیم؟</h2>
        <span>مسیرهای ارتباطی و راهنمایی‌های مرتبط با حساب و سامانه</span>
      </div>
    </div>

    <div className={styles.grid}>
      {supportItems.map(({ id, title, description, Icon }) => (
        <button key={id} type="button" className={styles.card}>
          <Icon />
          <span>
            <strong>{title}</strong>
            <small>{description}</small>
          </span>
        </button>
      ))}
    </div>
  </section>
);

export default Support;
