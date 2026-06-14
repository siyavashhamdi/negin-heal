import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { Button } from "@mui/material";
import { type ReactElement } from "react";
import styles from "./styles/notifications.module.scss";

const notificationItems = [
  {
    id: "notify-1",
    title: "تایید نهایی پرونده صنف نان و شیرینی",
    description: "پرونده شماره ۱۰۲۳ در صف تایید نهایی قرار گرفت و نیاز به بررسی مدیر دارد.",
    timeLabel: "۲ دقیقه پیش",
  },
  {
    id: "notify-2",
    title: "یادآور جلسه کمیته نظارت",
    description: "جلسه هفتگی کمیته نظارت امروز ساعت ۱۴:۳۰ برگزار می‌شود.",
    timeLabel: "۱۲ دقیقه پیش",
  },
  {
    id: "notify-3",
    title: "ثبت درخواست جدید اتحادیه پوشاک",
    description: "درخواست جدید برای بروزرسانی مجوز فعالیت ثبت شد.",
    timeLabel: "۳۵ دقیقه پیش",
  },
];

const Notifications = (): ReactElement => (
  <section className={styles.page}>
    <div className={styles.hero}>
      <div className={styles.heroIcon}>
        <NotificationsRoundedIcon />
      </div>
      <div>
        <p>اعلان‌ها</p>
        <h2>پیام‌ها و رویدادهای جدید</h2>
        <span>بعدا این صفحه به اعلان‌های واقعی متصل می‌شود.</span>
      </div>
    </div>

    <div className={styles.list}>
      {notificationItems.map((item) => (
        <article key={item.id} className={styles.item}>
          <span className={styles.dot} />
          <div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <time>{item.timeLabel}</time>
          </div>
        </article>
      ))}
    </div>

    <Button variant="outlined" className={styles.actionButton} startIcon={<DoneAllRoundedIcon />}>
      علامت‌گذاری همه به عنوان خوانده‌شده
    </Button>
  </section>
);

export default Notifications;
