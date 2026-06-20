import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PasswordRoundedIcon from "@mui/icons-material/PasswordRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useMobileAppLayout } from "../../hooks/useMobileAppLayout";
import { LoginRequiredState } from "../../shared/auth/LoginRequiredState";
import { USER_PROFILE_UPDATE_MUTATION } from "../../graphql/mutations/userProfileUpdate.mutation";
import { useMe } from "../../hooks/useMe";
import EntityConfirmDialogShell from "../../shared/crud/EntityConfirmDialogShell";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import { getFileIdFromAccessUrl, type FileAccessUrl } from "../../utils/fileAccessUrl.util";
import { uploadFile } from "../../utils/fileUpload.util";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import { APP_SHELL_ROUTES, isProfileAuthRoute } from "../../routing/app-shell-routes";
import { ProfileAuthRoutes } from "./ProfileAuthRoutes";
import styles from "./styles/profile.module.scss";

const PASSWORD_CHANGE_LOGOUT_COUNTDOWN_SECONDS = 5;

type UserProfileUpdateMutationResult = {
  readonly userProfileUpdate: {
    readonly id: string;
    readonly username: string;
    readonly profile?: {
      readonly firstName?: string | null;
      readonly lastName?: string | null;
      readonly email?: string | null;
      readonly phoneNumber?: string | null;
      readonly avatarAccessUrl?: FileAccessUrl | null;
      readonly bio?: string | null;
    } | null;
  };
};

type UserProfileUpdateMutationVariables = {
  readonly input: {
    readonly username?: string;
    readonly currentPassword?: string;
    readonly password?: string;
    readonly profile?: {
      readonly firstName?: string | null;
      readonly lastName?: string | null;
      readonly email?: string | null;
      readonly phoneNumber?: string | null;
      readonly avatarFileId?: string | null;
      readonly bio?: string | null;
    };
  };
};

type ProfileEditForm = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bio: string;
};

type ProfileUpdateInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatarFileId?: string | null;
  bio?: string | null;
};

type PasswordChangeForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function optionalTextInput(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const AuthenticatedProfile = (): ReactElement => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const { showError, showSuccess } = useSnackbar();
  const { user, avatarUrl, loading, refetch } = useMe();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileEditForm>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isAvatarDeleting, setIsAvatarDeleting] = useState(false);
  const [updateProfile, updateProfileResult] = useMutationWithSnackbar<
    UserProfileUpdateMutationResult,
    UserProfileUpdateMutationVariables
  >(USER_PROFILE_UPDATE_MUTATION, {
    errorMessage: "به‌روزرسانی پروفایل انجام نشد.",
  });

  const displayName =
    user?.profile?.firstName && user.profile.lastName
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user?.profile?.firstName || user?.username || authUser?.username || "کاربر";
  const userInitial = displayName.trim().slice(0, 1) || "؟";
  const displayRoles =
    user?.roles?.filter((role) => role !== "END_USER") ??
    authUser?.roles?.filter((role) => role !== "END_USER") ??
    [];
  const roleLabel = displayRoles.join("، ");
  const isAvatarUpdating =
    isAvatarUploading || isAvatarDeleting || updateProfileResult.loading;
  const hasAvatar = Boolean(avatarUrl);
  const isSavingProfile = updateProfileResult.loading;
  const isChangingPassword = updateProfileResult.loading;
  const isEmailLocked = Boolean(user?.profile?.email?.trim());
  const isPhoneNumberLocked = Boolean(user?.profile?.phoneNumber?.trim());
  const hasLockedContactField = isEmailLocked || isPhoneNumberLocked;

  useEffect(() => {
    if (logoutCountdown === null) {
      return undefined;
    }

    if (logoutCountdown <= 0) {
      logout();
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setLogoutCountdown((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [logout, logoutCountdown]);

  const buildEditForm = (): ProfileEditForm => ({
    username: user?.username ?? authUser?.username ?? "",
    firstName: user?.profile?.firstName ?? "",
    lastName: user?.profile?.lastName ?? "",
    email: user?.profile?.email ?? "",
    phoneNumber: user?.profile?.phoneNumber ?? "",
    bio: user?.profile?.bio ?? "",
  });

  const openEditDialog = (): void => {
    setEditForm(buildEditForm());
    setIsEditDialogOpen(true);
    navigate(`${APP_SHELL_ROUTES.profile}/edit`);
  };

  const closeEditDialog = (): void => {
    if (isSavingProfile) {
      return;
    }

    setIsEditDialogOpen(false);
    navigate(APP_SHELL_ROUTES.profile);
  };

  const setEditField = <TField extends keyof ProfileEditForm>(
    field: TField,
    value: ProfileEditForm[TField],
  ): void => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const openPasswordDialog = (): void => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsPasswordDialogOpen(true);
    navigate(`${APP_SHELL_ROUTES.profile}/password`);
  };

  const closePasswordDialog = (): void => {
    if (isChangingPassword) {
      return;
    }

    setIsPasswordDialogOpen(false);
    navigate(APP_SHELL_ROUTES.profile);
  };

  useEffect(() => {
    const profileRoutePrefix = `${APP_SHELL_ROUTES.profile}/`;
    if (!location.pathname.startsWith(profileRoutePrefix)) {
      return;
    }

    const routeSuffix = location.pathname.slice(profileRoutePrefix.length);
    if (routeSuffix === "edit") {
      setEditForm(buildEditForm());
      setIsEditDialogOpen(true);
      setIsPasswordDialogOpen(false);
      return;
    }

    if (routeSuffix === "password") {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordDialogOpen(true);
      setIsEditDialogOpen(false);
      return;
    }

    setIsEditDialogOpen(false);
    setIsPasswordDialogOpen(false);
  }, [location.pathname, user?.id, authUser?.id]);

  const setPasswordField = <TField extends keyof PasswordChangeForm>(
    field: TField,
    value: PasswordChangeForm[TField],
  ): void => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarButtonClick = (): void => {
    if (isAvatarUpdating) {
      return;
    }

    avatarInputRef.current?.click();
  };

  const handleAvatarDelete = async (): Promise<void> => {
    if (isAvatarUpdating || !hasAvatar) {
      return;
    }

    setIsAvatarDeleting(true);
    try {
      const result = await updateProfile({
        variables: {
          input: {
            profile: {
              avatarFileId: null,
            },
          },
        },
      }).catch(() => null);

      if (result?.data?.userProfileUpdate) {
        await refetch();
        showSuccess("تصویر پروفایل حذف شد.");
      }
    } finally {
      setIsAvatarDeleting(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showError("لطفا یک فایل تصویر انتخاب کنید.");
      return;
    }

    setIsAvatarUploading(true);
    let avatarFileId: string | null = null;
    try {
      const uploadResult = await uploadFile(file);
      avatarFileId = getFileIdFromAccessUrl(uploadResult.accessUrl);
    } catch {
      showError("آپلود تصویر پروفایل انجام نشد.");
    } finally {
      setIsAvatarUploading(false);
    }

    if (!avatarFileId) {
      return;
    }

    const result = await updateProfile({
      variables: {
        input: {
          profile: {
            avatarFileId,
          },
        },
      },
    }).catch(() => null);

    if (result?.data?.userProfileUpdate) {
      await refetch();
      showSuccess("تصویر پروفایل با موفقیت به‌روزرسانی شد.");
    }
  };

  const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const username = editForm.username.trim();
    if (!username) {
      showError("نام کاربری الزامی است.");
      return;
    }

    const profileInput: ProfileUpdateInput = {
      firstName: optionalTextInput(editForm.firstName),
      lastName: optionalTextInput(editForm.lastName),
      bio: optionalTextInput(editForm.bio),
    };
    if (!isEmailLocked) {
      profileInput.email = optionalTextInput(editForm.email);
    }
    if (!isPhoneNumberLocked) {
      profileInput.phoneNumber = optionalTextInput(editForm.phoneNumber);
    }

    const result = await updateProfile({
      variables: {
        input: {
          username,
          profile: profileInput,
        },
      },
    }).catch(() => null);

    if (result?.data?.userProfileUpdate) {
      await refetch();
      closeEditDialog();
      showSuccess("اطلاعات کاربری با موفقیت به‌روزرسانی شد.");
    }
  };

  const handleSubmitPassword = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("لطفا همه فیلدهای رمز عبور را تکمیل کنید.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }

    const result = await updateProfile({
      variables: {
        input: {
          currentPassword,
          password: newPassword,
        },
      },
    }).catch(() => null);

    if (result?.data?.userProfileUpdate) {
      closePasswordDialog();
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLogoutCountdown(PASSWORD_CHANGE_LOGOUT_COUNTDOWN_SECONDS);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.avatarWrap}>
          <Avatar className={styles.avatar} src={avatarUrl ?? undefined} alt={displayName}>
            {userInitial}
          </Avatar>
          <input
            ref={avatarInputRef}
            className={styles.avatarInput}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
          />
          {hasAvatar ? (
            <Tooltip title="حذف تصویر پروفایل">
              <span className={styles.avatarDeleteTooltipAnchor}>
                <IconButton
                  className={styles.avatarDeleteButton}
                  aria-label="حذف تصویر پروفایل"
                  size="small"
                  disabled={isAvatarUpdating}
                  onClick={() => {
                    void handleAvatarDelete();
                  }}
                >
                  {isAvatarDeleting ? (
                    <CircularProgress size={12} />
                  ) : (
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
          <Tooltip title="ویرایش تصویر پروفایل">
            <span className={styles.avatarEditTooltipAnchor}>
              <IconButton
                className={styles.avatarEditButton}
                aria-label="ویرایش تصویر پروفایل"
                size="small"
                disabled={isAvatarUpdating}
                onClick={handleAvatarButtonClick}
              >
                {isAvatarUploading ? (
                  <CircularProgress size={12} />
                ) : (
                  <EditRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </div>
        <div>
          <p className={styles.eyebrow}>پروفایل</p>
          <h2>{loading ? "در حال دریافت اطلاعات..." : displayName}</h2>
          {roleLabel ? <p>{roleLabel}</p> : null}
        </div>
      </div>

      <div className={styles.cardGrid}>
        <button type="button" className={styles.actionCard} onClick={openEditDialog}>
          <PersonRoundedIcon />
          <span>
            <strong>ویرایش اطلاعات کاربری</strong>
            <small>نام، اطلاعات تماس و مشخصات پروفایل</small>
          </span>
        </button>
        <button type="button" className={styles.actionCard} onClick={openPasswordDialog}>
          <PasswordRoundedIcon />
          <span>
            <strong>تغییر رمز عبور</strong>
            <small>به‌روزرسانی رمز عبور حساب کاربری</small>
          </span>
        </button>
      </div>

      <EntityModalShell
        open={isEditDialogOpen}
        onClose={closeEditDialog}
        title="ویرایش اطلاعات کاربری"
        maxWidth="sm"
        useFormWrapper
        onSubmit={handleSubmitEdit}
        closeOnSave
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: closeEditDialog,
                disabled: isSavingProfile,
              },
              {
                key: "submit",
                label: isSavingProfile ? "در حال ذخیره..." : "ذخیره تغییرات",
                type: "submit",
                disabled: isSavingProfile,
              },
            ]}
          />
        }
      >
        <Stack spacing={2}>
              <TextField
                label="نام کاربری"
                value={editForm.username}
                onChange={(event) => setEditField("username", event.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="username"
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="نام"
                  value={editForm.firstName}
                  onChange={(event) => setEditField("firstName", event.target.value)}
                  fullWidth
                  size="small"
                  autoComplete="given-name"
                />
                <TextField
                  label="نام خانوادگی"
                  value={editForm.lastName}
                  onChange={(event) => setEditField("lastName", event.target.value)}
                  fullWidth
                  size="small"
                  autoComplete="family-name"
                />
              </Stack>
              <TextField
                label="ایمیل"
                value={editForm.email}
                onChange={(event) => setEditField("email", event.target.value)}
                fullWidth
                size="small"
                type="email"
                autoComplete="email"
                disabled={isEmailLocked}
                helperText={isEmailLocked ? "برای تغییر ایمیل با پشتیبانی تماس بگیرید." : undefined}
              />
              <TextField
                label="شماره موبایل"
                value={editForm.phoneNumber}
                onChange={(event) => setEditField("phoneNumber", event.target.value)}
                fullWidth
                size="small"
                autoComplete="tel"
                disabled={isPhoneNumberLocked}
                helperText={
                  isPhoneNumberLocked
                    ? "برای تغییر شماره موبایل با پشتیبانی تماس بگیرید."
                    : undefined
                }
              />
              <TextField
                label="بیوگرافی"
                value={editForm.bio}
                onChange={(event) => setEditField("bio", event.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={3}
              />
              {hasLockedContactField ? (
                <Alert severity="info">
                  برای تغییر ایمیل یا شماره موبایل ثبت‌شده، لطفا از طریق{" "}
                  <RouterLink to="/support/tickets" className={styles.supportLink}>
                    تیکت پشتیبانی
                  </RouterLink>{" "}
                  درخواست خود را ارسال کنید.
                </Alert>
              ) : null}
            </Stack>
      </EntityModalShell>

      <EntityModalShell
        open={isPasswordDialogOpen}
        onClose={closePasswordDialog}
        title="تغییر رمز عبور"
        maxWidth="sm"
        useFormWrapper
        onSubmit={handleSubmitPassword}
        closeOnSave={false}
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: closePasswordDialog,
                disabled: isChangingPassword,
              },
              {
                key: "submit",
                label: isChangingPassword ? "در حال ذخیره..." : "ذخیره رمز عبور",
                type: "submit",
                disabled: isChangingPassword,
              },
            ]}
          />
        }
      >
        <Stack spacing={2}>
              <Alert severity="info">
                رمز عبور جدید باید حداقل ۸ کاراکتر و حداقل شامل یک حرف بزرگ
                انگلیسی، یک حرف کوچک انگلیسی، یک عدد و یک کاراکتر ویژه باشد. همچنین از
                رمزهای عبور رایج و قابل حدس استفاده نکنید.
              </Alert>
              <TextField
                label="رمز عبور فعلی"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordField("currentPassword", event.target.value)}
                required
                fullWidth
                size="small"
                type="password"
                autoComplete="current-password"
              />
              <TextField
                label="رمز عبور جدید"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordField("newPassword", event.target.value)}
                required
                fullWidth
                size="small"
                type="password"
                autoComplete="new-password"
              />
              <TextField
                label="تکرار رمز عبور جدید"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordField("confirmPassword", event.target.value)}
                required
                fullWidth
                size="small"
                type="password"
                autoComplete="new-password"
              />
            </Stack>
      </EntityModalShell>

      <EntityConfirmDialogShell
        open={logoutCountdown !== null}
        onClose={logout}
        title="رمز عبور تغییر کرد"
        footer={
          <ModalFooterActions
            reverseOrderOnMobile={false}
            actions={[
              {
                key: "logout",
                label: "خروج و ورود دوباره",
                onClick: logout,
              },
            ]}
          />
        }
      >
        <Alert severity="success">
          رمز عبور با موفقیت به‌روزرسانی شد. برای ادامه، باید دوباره وارد حساب شوید.
          خروج خودکار تا {logoutCountdown ?? 0} ثانیه دیگر انجام می‌شود.
        </Alert>
      </EntityConfirmDialogShell>

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

const Profile = (): ReactElement => {
  const { isAuthenticated } = useAuth();
  const isMobileAppLayout = useMobileAppLayout();
  const location = useLocation();

  if (isAuthenticated && isProfileAuthRoute(location.pathname)) {
    return <Navigate to={APP_SHELL_ROUTES.profile} replace />;
  }

  if (!isAuthenticated) {
    if (isMobileAppLayout) {
      return (
        <section className={styles.page}>
          <ProfileAuthRoutes />
        </section>
      );
    }

    return (
      <section className={styles.page}>
        <LoginRequiredState
          eyebrow="پروفایل"
          title="برای مدیریت حساب وارد شوید"
          description="پس از ورود می‌توانید اطلاعات کاربری، تصویر پروفایل و تنظیمات امنیتی حساب خود را مدیریت کنید."
          icon={<PersonRoundedIcon />}
          actionLabel="ورود به حساب"
        />
      </section>
    );
  }

  return <AuthenticatedProfile />;
};

export default Profile;
