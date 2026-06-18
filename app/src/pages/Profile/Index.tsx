import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PasswordRoundedIcon from "@mui/icons-material/PasswordRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { USER_PROFILE_UPDATE_MUTATION } from "../../graphql/mutations/userProfileUpdate.mutation";
import { useMe } from "../../hooks/useMe";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { getFileIdFromAccessUrl, type FileAccessUrl } from "../../utils/fileAccessUrl.util";
import { uploadFile } from "../../utils/fileUpload.util";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { crudModalFooterSx } from "../../shared/crud/modalThemeSx";
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

const Profile = (): ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { dialogProps, getPaperProps, getContentProps } = useMobileDialogProps({
    breakpoint: "sm",
  });
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
  const isAvatarUpdating = isAvatarUploading || updateProfileResult.loading;
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
  };

  const closeEditDialog = (): void => {
    if (isSavingProfile) {
      return;
    }

    setIsEditDialogOpen(false);
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
  };

  const closePasswordDialog = (): void => {
    if (isChangingPassword) {
      return;
    }

    setIsPasswordDialogOpen(false);
  };

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
      setIsEditDialogOpen(false);
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
      setIsPasswordDialogOpen(false);
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
          <Tooltip title="ویرایش تصویر پروفایل">
            <span className={styles.avatarEditTooltipAnchor}>
              <IconButton
                className={styles.avatarEditButton}
                aria-label="ویرایش تصویر پروفایل"
                size="small"
                disabled={isAvatarUpdating}
                onClick={handleAvatarButtonClick}
              >
                {isAvatarUpdating ? <CircularProgress size={16} /> : <EditRoundedIcon fontSize="small" />}
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

      <Dialog
        open={isEditDialogOpen}
        onClose={closeEditDialog}
        maxWidth="sm"
        {...dialogProps}
        PaperProps={getPaperProps()}
      >
        <form className={styles.editForm} onSubmit={handleSubmitEdit}>
          <DialogTitle>ویرایش اطلاعات کاربری</DialogTitle>
          <DialogContent dividers {...getContentProps({ className: styles.editDialogContent })}>
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
          </DialogContent>
          <DialogActions
            sx={crudModalFooterSx(theme, {
              pinFooterToBottomOnMobile: true,
            })}
          >
            <Stack
              direction={isMobile ? "column-reverse" : "row"}
              spacing={1.5}
              sx={{
                width: "100%",
                justifyContent: isMobile ? "stretch" : "flex-end",
                "& .MuiButton-root": {
                  width: isMobile ? "100%" : "auto",
                  minWidth: isMobile ? undefined : "8rem",
                },
              }}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={closeEditDialog}
                disabled={isSavingProfile}
              >
                انصراف
              </Button>
              <Button type="submit" variant="contained" disabled={isSavingProfile}>
                {isSavingProfile ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </Stack>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={isPasswordDialogOpen}
        onClose={closePasswordDialog}
        maxWidth="sm"
        {...dialogProps}
        PaperProps={getPaperProps()}
      >
        <form className={styles.editForm} onSubmit={handleSubmitPassword}>
          <DialogTitle>تغییر رمز عبور</DialogTitle>
          <DialogContent dividers {...getContentProps({ className: styles.editDialogContent })}>
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
          </DialogContent>
          <DialogActions
            sx={crudModalFooterSx(theme, {
              pinFooterToBottomOnMobile: true,
            })}
          >
            <Stack
              direction={isMobile ? "column-reverse" : "row"}
              spacing={1.5}
              sx={{
                width: "100%",
                justifyContent: isMobile ? "stretch" : "flex-end",
                "& .MuiButton-root": {
                  width: isMobile ? "100%" : "auto",
                  minWidth: isMobile ? undefined : "8rem",
                },
              }}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={closePasswordDialog}
                disabled={isChangingPassword}
              >
                انصراف
              </Button>
              <Button type="submit" variant="contained" disabled={isChangingPassword}>
                {isChangingPassword ? "در حال ذخیره..." : "ذخیره رمز عبور"}
              </Button>
            </Stack>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={logoutCountdown !== null} fullWidth maxWidth="xs">
        <DialogTitle>رمز عبور تغییر کرد</DialogTitle>
        <DialogContent dividers>
          <Alert severity="success">
            رمز عبور با موفقیت به‌روزرسانی شد. برای ادامه، باید دوباره وارد حساب شوید.
            خروج خودکار تا {logoutCountdown ?? 0} ثانیه دیگر انجام می‌شود.
          </Alert>
        </DialogContent>
        <DialogActions
          sx={crudModalFooterSx(theme, {
            pinFooterToBottomOnMobile: true,
          })}
        >
          <Button fullWidth={isMobile} variant="contained" color="primary" onClick={logout}>
            خروج و ورود دوباره
          </Button>
        </DialogActions>
      </Dialog>

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
