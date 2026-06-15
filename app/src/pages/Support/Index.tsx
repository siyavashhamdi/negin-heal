import CallRoundedIcon from "@mui/icons-material/CallRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import { type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SupportTicketsIndex from "./TicketsIndex";
import styles from "./styles/support.module.scss";

const supportItems = [
  {
    id: "ticket",
    title: "تیکت پشتیبانی",
    description: "ثبت و پیگیری درخواست‌های پشتیبانی",
    Icon: ConfirmationNumberRoundedIcon,
    path: "/support/tickets",
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

const Support = (): ReactElement => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isStaff = roles.includes("SUPER_ADMIN") || roles.includes("ADMIN");

  if (isStaff) {
    return <SupportTicketsIndex />;
  }

  return (
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
        {supportItems.map(({ id, title, description, Icon, path }) => (
          <button
            key={id}
            type="button"
            className={styles.card}
            onClick={() => {
              if (path) {
                navigate(path);
              }
            }}
          >
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
};

export default Support;
