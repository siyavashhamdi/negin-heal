import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PasswordRoundedIcon from "@mui/icons-material/PasswordRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { Avatar, Button } from "@mui/material";
import { type ReactElement } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useMe } from "../../hooks/useMe";
import styles from "./styles/profile.module.scss";

const Profile = (): ReactElement => {
  const { logout, user: authUser } = useAuth();
  const { user, loading } = useMe();

  const displayName =
    user?.profile?.firstName && user.profile.lastName
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user?.profile?.firstName || user?.username || authUser?.username || "کاربر";
  const userInitial = displayName.trim().slice(0, 1) || "؟";
  const roleLabel = user?.roles?.join("، ") || authUser?.roles?.join("، ") || "کاربر سامانه";

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <Avatar className={styles.avatar}>{userInitial}</Avatar>
        <div>
          <p className={styles.eyebrow}>پروفایل</p>
          <h2>{loading ? "در حال دریافت اطلاعات..." : displayName}</h2>
          <p>{roleLabel}</p>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <button type="button" className={styles.actionCard}>
          <PersonRoundedIcon />
          <span>
            <strong>ویرایش اطلاعات کاربری</strong>
            <small>نام، اطلاعات تماس و مشخصات پروفایل</small>
          </span>
        </button>
        <button type="button" className={styles.actionCard}>
          <PasswordRoundedIcon />
          <span>
            <strong>تغییر رمز عبور</strong>
            <small>به‌روزرسانی رمز عبور حساب کاربری</small>
          </span>
        </button>
      </div>

      <Button
        variant="outlined"
        color="error"
        className={styles.logoutButton}
        startIcon={<LogoutRoundedIcon />}
        onClick={logout}
      >
        خروج از حساب کاربری
      </Button>
    </section>
  );
};

export default Profile;
