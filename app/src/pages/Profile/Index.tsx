import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PasswordRoundedIcon from "@mui/icons-material/PasswordRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { shouldUseProfileAuthShell } from "../../hooks/useMobileAppLayout";
import { useMe, type UserMeGqlResponse } from "../../hooks/useMe";
import { subscribeGeneralUpdates } from "../../lib/general-updates-listeners";
import { GENERAL_SUBSCRIPTION_UPDATE_TYPES } from "../../constants";
import { isUserEmailVerified } from "../../constants/verification-status-subscription.constants";
import { parseVerificationStatusSubscriptionPayload } from "../../utilities/verification-status-update.util";
import {
  resolveAvatarInitial,
  resolveMeUserDisplayName,
  resolveStoredUserDisplayName,
} from "../../utils/storedUser.util";
import { getProfileDisplayRoles, getUserRoleLabel } from "../../utils/userRoleLabels.util";
import {
  sanitizeMobilePhoneInput,
  normalizeAuthIdentityMobileForSubmit,
} from "../../utilities/mobile-phone.util";
import {
  isLatinEmailValue,
  isLatinIdentityUsername,
  isValidMobilePhone,
  sanitizeAuthIdentityInput,
  sanitizeLatinEmailInput,
} from "../../utilities/contact-validation.util";
import { isValidUsernameLength } from "../../utils/usernamePolicy.util";
import { LoginRequiredState } from "../../shared/auth/LoginRequiredState";
import { PasswordPolicyChecklist } from "../../shared/auth/PasswordPolicyChecklist";
import { USER_PROFILE_UPDATE_MUTATION } from "../../graphql/mutations/userProfileUpdate.mutation";
import { USER_REQUEST_EMAIL_VERIFICATION_MUTATION } from "../../graphql/mutations/userRequestEmailVerification.mutation";
import EntityConfirmDialogShell from "../../shared/crud/EntityConfirmDialogShell";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import { getFileIdFromAccessUrl, type FileAccessUrl } from "../../utils/fileAccessUrl.util";
import { uploadFile } from "../../utils/fileUpload.util";
import {
  getUploadValidationErrorMessage,
  validateSelectedUploadFile,
} from "../../utils/fileUploadValidation.util";
import {
  FILE_UPLOAD_POLICY,
  FILE_UPLOAD_POLICY_MAX_SIZE_BYTES,
} from "../../constants/fileUploadPolicies";
import { hasFormChanges } from "../../utils/formChange.util";
import {
  MULTILINE_TEXTAREA_MIN_ROWS,
  MULTILINE_TEXTAREA_MAX_ROWS,
} from "../../constants/multilineTextarea.constants";
import { arePasswordRulesPassed } from "../../utils/passwordPolicy.util";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { resolveSuccessMessage } from "../../utilities/success-message.util";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import { APP_SHELL_ROUTES, isProfileAuthRoute } from "../../routing/app-shell-routes";
import { peekPostLoginRedirect } from "../../routing/post-login-redirect";
import { opaqueShellProps } from "../../shared/opaqueShell";
import { ProfileAuthRoutes } from "./ProfileAuthRoutes";
import { LoginAdornedTextField } from "../Login/components/LoginAdornedTextField";
import loginFormStyles from "../Login/styles/LoginFormShared.module.scss";
import styles from "./styles/profile.module.scss";
import AppTooltip from "../../shared/AppTooltip";
import { AvatarInitial } from "../../shared/display/AvatarInitial";

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

type UserRequestEmailVerificationMutationResult = {
  readonly userRequestEmailVerification: {
    readonly success: boolean;
    readonly message: string;
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

function isProfileEditFormValid(
  form: ProfileEditForm,
  options: { isEmailLocked: boolean; isPhoneNumberLocked: boolean }
): boolean {
  const username = form.username.trim();

  if (!username || !isValidUsernameLength(username) || !isLatinIdentityUsername(username)) {
    return false;
  }

  if (!form.firstName.trim()) {
    return false;
  }

  const email = form.email.trim();
  if (!options.isEmailLocked && email && !isLatinEmailValue(email)) {
    return false;
  }

  const phone = form.phoneNumber.trim();
  if (!options.isPhoneNumberLocked && phone && !isValidMobilePhone(phone)) {
    return false;
  }

  return true;
}

const latinFieldInputProps = {
  className: styles.latinInput,
  dir: "ltr",
  lang: "en",
  spellCheck: false,
  autoCapitalize: "off",
  autoCorrect: "off",
} as const;

const AuthenticatedProfile = (): ReactElement => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const { user: profileUser, avatarUrl, loading: isProfileLoading, refetch } = useMe();
  const { showError, showSuccess } = useSnackbar();
  const isEditRoute = location.pathname === `${APP_SHELL_ROUTES.profile}/edit`;
  const isPasswordRoute = location.pathname === `${APP_SHELL_ROUTES.profile}/password`;
  const [editProfileUser, setEditProfileUser] = useState<UserMeGqlResponse | null>(null);
  const [isEditMeLoading, setIsEditMeLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [editForm, setEditForm] = useState<ProfileEditForm>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });
  const [initialEditForm, setInitialEditForm] = useState<ProfileEditForm | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isAvatarDeleting, setIsAvatarDeleting] = useState(false);
  const [updateProfile, updateProfileResult] = useMutationWithSnackbar<
    UserProfileUpdateMutationResult,
    UserProfileUpdateMutationVariables
  >(USER_PROFILE_UPDATE_MUTATION);
  const [requestEmailVerification, requestEmailVerificationResult] =
    useMutationWithSnackbar<UserRequestEmailVerificationMutationResult>(
      USER_REQUEST_EMAIL_VERIFICATION_MUTATION
    );

  const displayName =
    isProfileLoading || !profileUser
      ? resolveStoredUserDisplayName(authUser, "کاربر")
      : resolveMeUserDisplayName(profileUser, "کاربر");
  const userInitial = resolveAvatarInitial(displayName, "؟");
  const displayRoles = getProfileDisplayRoles(profileUser?.roles);
  const isAvatarUpdating = isAvatarUploading || isAvatarDeleting || updateProfileResult.loading;
  const hasAvatar = Boolean(avatarUrl);
  const isSavingProfile = updateProfileResult.loading;
  const isChangingPassword = updateProfileResult.loading;
  const isEmailLocked = Boolean(editProfileUser?.profile?.email?.trim());
  const isPhoneNumberLocked = Boolean(editProfileUser?.profile?.phoneNumber?.trim());
  const hasProfileEmail = Boolean(editProfileUser?.profile?.email?.trim());
  const isEmailVerified = isUserEmailVerified(editProfileUser?.verification);
  const isRequestingEmailVerification = requestEmailVerificationResult.loading;
  const hasLockedContactField = isEmailLocked || isPhoneNumberLocked;
  const passwordRulesPassed = arePasswordRulesPassed(passwordForm.newPassword);
  const passwordsMatch =
    passwordForm.confirmPassword.trim().length > 0 &&
    passwordForm.newPassword === passwordForm.confirmPassword;
  const canSubmitPasswordChange =
    passwordForm.currentPassword.trim().length > 0 &&
    passwordForm.newPassword.trim().length > 0 &&
    passwordForm.confirmPassword.trim().length > 0 &&
    passwordRulesPassed &&
    passwordsMatch;

  const hasProfileEditChanges =
    initialEditForm != null && hasFormChanges(initialEditForm, editForm);

  const phoneNumberInvalid =
    !isPhoneNumberLocked &&
    Boolean(editForm.phoneNumber.trim()) &&
    !isValidMobilePhone(editForm.phoneNumber);

  const canSubmitProfileEdit =
    isProfileEditFormValid(editForm, { isEmailLocked, isPhoneNumberLocked }) &&
    hasProfileEditChanges;

  const handleLiveVerificationStatus = useCallback(
    (verification: {
      readonly emailVerifiedAt?: string | null;
      readonly mobileVerifiedAt?: string | null;
    }) => {
      setEditProfileUser((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          verification,
        };
      });

      if (isUserEmailVerified(verification)) {
        showSuccess("ایمیل شما با موفقیت تأیید شد.");
      }
    },
    [showSuccess]
  );

  useEffect(() => {
    if (!isEditRoute || !editProfileUser) {
      return undefined;
    }

    return subscribeGeneralUpdates((update) => {
      if (update.updateType !== GENERAL_SUBSCRIPTION_UPDATE_TYPES.VERIFICATION_STATUS) {
        return;
      }

      const verification = parseVerificationStatusSubscriptionPayload(update.payload);
      if (!verification) {
        return;
      }

      handleLiveVerificationStatus(verification);
    });
  }, [editProfileUser, handleLiveVerificationStatus, isEditRoute]);

  useEffect(() => {
    if (!isEditRoute) {
      return;
    }

    setIsEditMeLoading(true);
    void refetch()
      .then((result) => {
        if (result.data?.me) {
          const nextForm = buildEditFormFromUser(result.data.me);
          setEditProfileUser(result.data.me);
          setInitialEditForm(nextForm);
          setEditForm(nextForm);
        }
      })
      .finally(() => {
        setIsEditMeLoading(false);
      });
  }, [isEditRoute, refetch]);

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

  const buildEditFormFromUser = (meUser: UserMeGqlResponse | null): ProfileEditForm => ({
    username: meUser?.username ?? "",
    firstName: meUser?.profile?.firstName ?? "",
    lastName: meUser?.profile?.lastName ?? "",
    email: meUser?.profile?.email ?? "",
    phoneNumber: meUser?.profile?.phoneNumber ?? "",
    bio: meUser?.profile?.bio ?? "",
  });

  const openEditDialog = (): void => {
    navigate(`${APP_SHELL_ROUTES.profile}/edit`);
  };

  const closeEditDialog = (): void => {
    if (isSavingProfile) {
      return;
    }

    setEditProfileUser(null);
    setInitialEditForm(null);
    navigate(APP_SHELL_ROUTES.profile);
  };

  const setEditField = <TField extends keyof ProfileEditForm>(
    field: TField,
    value: ProfileEditForm[TField]
  ): void => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const openPasswordDialog = (): void => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    navigate(`${APP_SHELL_ROUTES.profile}/password`);
  };

  const closePasswordDialog = (): void => {
    if (isChangingPassword) {
      return;
    }

    navigate(APP_SHELL_ROUTES.profile);
  };

  useEffect(() => {
    if (!isPasswordRoute) {
      return;
    }

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPassword(false);
  }, [isPasswordRoute]);

  const setPasswordField = <TField extends keyof PasswordChangeForm>(
    field: TField,
    value: PasswordChangeForm[TField]
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

    const validation = validateSelectedUploadFile(file, {
      accept: "image/*",
      maxSizeBytes: FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.AVATAR,
    });
    if (!validation.valid) {
      showError(getUploadValidationErrorMessage(validation, "فایل تصویر معتبر نیست."));
      return;
    }

    setIsAvatarUploading(true);
    let avatarFileId: string | null = null;
    try {
      const uploadResult = await uploadFile(file, {
        policy: FILE_UPLOAD_POLICY.AVATAR,
        accept: "image/*",
        maxSizeBytes: FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.AVATAR,
      });
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

  const handleRequestEmailVerification = async (): Promise<void> => {
    if (!hasProfileEmail || isEmailVerified || isRequestingEmailVerification) {
      return;
    }

    const result = await requestEmailVerification().catch(() => null);
    if (result?.data?.userRequestEmailVerification?.success) {
      showSuccess(
        resolveSuccessMessage(
          result.data.userRequestEmailVerification.message,
          "success.VERIFICATION_EMAIL_SENT"
        )
      );
    }
  };

  const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const username = editForm.username.trim();
    const firstName = editForm.firstName.trim();

    if (!username) {
      showError("نام کاربری الزامی است.");
      return;
    }

    if (!isLatinIdentityUsername(username)) {
      showError("نام کاربری وارد شده معتبر نیست.");
      return;
    }

    if (!isValidUsernameLength(username)) {
      showError("نام کاربری باید حداقل ۵ کاراکتر باشد.");
      return;
    }

    if (!firstName) {
      showError("نام الزامی است.");
      return;
    }

    const profileInput: ProfileUpdateInput = {
      firstName,
      lastName: optionalTextInput(editForm.lastName),
      bio: optionalTextInput(editForm.bio),
    };
    if (!isEmailLocked) {
      const emailValue = editForm.email.trim();
      if (emailValue && !isLatinEmailValue(emailValue)) {
        showError("ایمیل وارد شده معتبر نیست.");
        return;
      }
      profileInput.email = optionalTextInput(editForm.email);
    }
    if (!isPhoneNumberLocked) {
      const phoneValue = editForm.phoneNumber.trim();
      if (phoneValue && !isValidMobilePhone(phoneValue)) {
        showError("شماره موبایل وارد شده معتبر نیست.");
        return;
      }
      profileInput.phoneNumber = phoneValue
        ? (normalizeAuthIdentityMobileForSubmit(phoneValue) ?? null)
        : null;
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
      showError("لطفا همه فیلدهای گذرواژه را تکمیل کنید.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("گذرواژه جدید و تکرار آن یکسان نیستند.");
      return;
    }

    if (!arePasswordRulesPassed(newPassword)) {
      showError("گذرواژه جدید باید شرایط امنیتی نمایش‌داده‌شده را داشته باشد.");
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
      setShowPassword(false);
      setLogoutCountdown(PASSWORD_CHANGE_LOGOUT_COUNTDOWN_SECONDS);
    }
  };

  return (
    <>
      <section className={styles.page}>
        <div className={styles.pageStack}>
          <div className={styles.hero} {...opaqueShellProps}>
            <div className={styles.avatarWrap}>
              <Avatar className={styles.avatar} src={avatarUrl ?? undefined} alt={displayName}>
                <AvatarInitial initial={userInitial} />
              </Avatar>
              <input
                ref={avatarInputRef}
                className={styles.avatarInput}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              {hasAvatar ? (
                <AppTooltip title="حذف تصویر پروفایل">
                  <span className={styles.avatarActionTooltipAnchor}>
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
                </AppTooltip>
              ) : (
                <AppTooltip title="افزودن تصویر جدید">
                  <span className={styles.avatarActionTooltipAnchor}>
                    <IconButton
                      className={styles.avatarAddNewButton}
                      aria-label="افزودن تصویر جدید"
                      size="small"
                      disabled={isAvatarUpdating}
                      onClick={handleAvatarButtonClick}
                    >
                      {isAvatarUploading ? (
                        <CircularProgress size={12} />
                      ) : (
                        <AddRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </AppTooltip>
              )}
            </div>
            <div>
              <p className={styles.eyebrow}>پروفایل</p>
              <h2>{displayName}</h2>
              {displayRoles.length > 0 ? (
                <div className={styles.roleBadges}>
                  {displayRoles.map((role) => (
                    <span key={role} className={styles.roleBadge}>
                      {getUserRoleLabel(role)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.cardGrid}>
            <button
              type="button"
              className={styles.actionCard}
              {...opaqueShellProps}
              onClick={openEditDialog}
            >
              <PersonRoundedIcon />
              <span>
                <strong>ویرایش اطلاعات کاربری</strong>
                <small>نام، اطلاعات تماس و مشخصات پروفایل</small>
              </span>
            </button>
            <button
              type="button"
              className={styles.actionCard}
              {...opaqueShellProps}
              onClick={openPasswordDialog}
            >
              <PasswordRoundedIcon />
              <span>
                <strong>تغییر گذرواژه</strong>
                <small>به‌روزرسانی گذرواژه حساب کاربری</small>
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
        </div>
      </section>

      <EntityModalShell
        open={isEditRoute}
        onClose={closeEditDialog}
        disableClose={isSavingProfile}
        hasUnsavedChanges={canSubmitProfileEdit}
        title="ویرایش اطلاعات کاربری"
        subtitle="نام، تصویر و اطلاعات عمومی حساب را به‌روز کنید."
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
                disabled:
                  isSavingProfile || isEditMeLoading || !editProfileUser || !canSubmitProfileEdit,
              },
            ]}
          />
        }
      >
        {isEditMeLoading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            className={styles.editProfileModalBody}
            sx={{ minHeight: 240 }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              در حال دریافت اطلاعات کاربر...
            </Typography>
          </Stack>
        ) : editProfileUser ? (
          <Stack spacing={2} className={styles.editProfileModalBody}>
            <LoginAdornedTextField
              label="نام کاربری"
              value={editForm.username}
              onChange={(event) =>
                setEditField("username", sanitizeAuthIdentityInput(event.target.value))
              }
              required
              fullWidth
              size="small"
              autoComplete="username"
              inputProps={latinFieldInputProps}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon className={loginFormStyles.inputIcon} />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="نام"
                value={editForm.firstName}
                onChange={(event) => setEditField("firstName", event.target.value)}
                required
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
            <LoginAdornedTextField
              label="ایمیل"
              value={editForm.email}
              onChange={(event) =>
                setEditField("email", sanitizeLatinEmailInput(event.target.value))
              }
              fullWidth
              size="small"
              type="email"
              autoComplete="email"
              disabled={isEmailLocked}
              inputProps={{ ...latinFieldInputProps, inputMode: "email" }}
              helperText={
                hasProfileEmail && isEmailVerified ? (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "success.main",
                      fontSize: "0.75rem",
                      lineHeight: 1,
                    }}
                  >
                    <CheckCircleOutlineRoundedIcon
                      sx={{ fontSize: "1em", flexShrink: 0, display: "block" }}
                    />
                    <Box component="span" sx={{ lineHeight: 1 }}>
                      ایمیل شما تأیید شده است.
                    </Box>
                  </Box>
                ) : hasProfileEmail && !isEmailVerified ? (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      flexWrap: "nowrap",
                      color: "warning.main",
                      fontSize: "0.75rem",
                      lineHeight: 1,
                    }}
                  >
                    <WarningAmberRoundedIcon
                      sx={{ fontSize: "1em", flexShrink: 0, display: "block" }}
                    />
                    <Box component="span" sx={{ lineHeight: 1 }}>
                      ایمیل تایید نشده است
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      color="warning"
                      sx={{
                        minWidth: 0,
                        minHeight: 0,
                        height: "auto",
                        py: 0.25,
                        px: 1,
                        lineHeight: 1.2,
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                        borderRadius: 1.5,
                        mr: 1,
                        boxShadow: "none",
                        "&:hover": {
                          boxShadow: "none",
                        },
                        "&.MuiButton-sizeSmall": {
                          minHeight: 0,
                        },
                      }}
                      onClick={() => void handleRequestEmailVerification()}
                      disabled={isRequestingEmailVerification}
                    >
                      {isRequestingEmailVerification ? "در حال ارسال..." : "ارسال ایمیل تأیید"}
                    </Button>
                  </Box>
                ) : isEmailLocked ? (
                  "برای تغییر ایمیل با پشتیبانی تماس بگیرید."
                ) : undefined
              }
              FormHelperTextProps={
                hasProfileEmail
                  ? {
                      sx: {
                        color: isEmailVerified ? "success.main" : "warning.main",
                        display: "flex",
                        alignItems: "center",
                        lineHeight: 1,
                      },
                    }
                  : undefined
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmailIcon className={loginFormStyles.inputIcon} />
                  </InputAdornment>
                ),
              }}
            />
            <LoginAdornedTextField
              label="شماره موبایل"
              value={editForm.phoneNumber}
              onChange={(event) =>
                setEditField("phoneNumber", sanitizeMobilePhoneInput(event.target.value))
              }
              fullWidth
              size="small"
              autoComplete="tel"
              disabled={isPhoneNumberLocked}
              inputProps={{ ...latinFieldInputProps, inputMode: "tel" }}
              error={phoneNumberInvalid}
              helperText={
                isPhoneNumberLocked
                  ? "برای تغییر شماره موبایل با پشتیبانی تماس بگیرید."
                  : phoneNumberInvalid
                    ? "شماره موبایل وارد شده معتبر نیست."
                    : undefined
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon className={loginFormStyles.inputIcon} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="بیوگرافی"
              value={editForm.bio}
              onChange={(event) => setEditField("bio", event.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={MULTILINE_TEXTAREA_MIN_ROWS}
              maxRows={MULTILINE_TEXTAREA_MAX_ROWS}
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
        ) : null}
      </EntityModalShell>

      <EntityModalShell
        open={isPasswordRoute}
        onClose={closePasswordDialog}
        disableClose={isChangingPassword}
        hasUnsavedChanges={canSubmitPasswordChange}
        title="تغییر گذرواژه"
        subtitle="گذرواژه جدید باید با سیاست امنیتی سامانه سازگار باشد."
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
                label: isChangingPassword ? "در حال ذخیره..." : "ذخیره گذرواژه",
                type: "submit",
                disabled: isChangingPassword || !canSubmitPasswordChange,
              },
            ]}
          />
        }
      >
        <Stack spacing={2} className={styles.editProfileModalBody}>
          <LoginAdornedTextField
            fullWidth
            label="گذرواژه فعلی"
            type={showPassword ? "text" : "password"}
            value={passwordForm.currentPassword}
            onChange={(event) => setPasswordField("currentPassword", event.target.value)}
            required
            autoComplete="current-password"
            endAdornmentOnlyWhenLabelShrunk
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon className={loginFormStyles.inputIcon} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="نمایش یا پنهان‌سازی گذرواژه"
                    onClick={() => setShowPassword((previous) => !previous)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={isChangingPassword}
          />
          <LoginAdornedTextField
            fullWidth
            label="گذرواژه جدید"
            type={showPassword ? "text" : "password"}
            value={passwordForm.newPassword}
            onChange={(event) => setPasswordField("newPassword", event.target.value)}
            required
            autoComplete="new-password"
            endAdornmentOnlyWhenLabelShrunk
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon className={loginFormStyles.inputIcon} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="نمایش یا پنهان‌سازی گذرواژه"
                    onClick={() => setShowPassword((previous) => !previous)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={isChangingPassword}
          />
          <PasswordPolicyChecklist password={passwordForm.newPassword} />
          <LoginAdornedTextField
            fullWidth
            label="تکرار گذرواژه جدید"
            type={showPassword ? "text" : "password"}
            value={passwordForm.confirmPassword}
            onChange={(event) => setPasswordField("confirmPassword", event.target.value)}
            required
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon className={loginFormStyles.inputIcon} />
                </InputAdornment>
              ),
            }}
            disabled={isChangingPassword}
            error={Boolean(passwordForm.confirmPassword) && !passwordsMatch}
            helperText={
              passwordForm.confirmPassword && !passwordsMatch
                ? "گذرواژه جدید و تکرار آن یکسان نیستند."
                : undefined
            }
          />
        </Stack>
      </EntityModalShell>

      <EntityConfirmDialogShell
        open={logoutCountdown !== null}
        onClose={logout}
        title="گذرواژه تغییر کرد"
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
          گذرواژه با موفقیت به‌روزرسانی شد. برای ادامه، باید دوباره وارد حساب شوید. خروج خودکار تا{" "}
          {logoutCountdown ?? 0} ثانیه دیگر انجام می‌شود.
        </Alert>
      </EntityConfirmDialogShell>
    </>
  );
};

const Profile = (): ReactElement => {
  const { isAuthenticated, isPostLoginRedirectPending } = useAuth();
  const useProfileAuthShell = shouldUseProfileAuthShell();
  const location = useLocation();

  if (isAuthenticated && (isPostLoginRedirectPending || peekPostLoginRedirect())) {
    return <></>;
  }

  if (isAuthenticated && isProfileAuthRoute(location.pathname)) {
    return <Navigate to={APP_SHELL_ROUTES.profile} replace />;
  }

  if (!isAuthenticated) {
    if (useProfileAuthShell) {
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
