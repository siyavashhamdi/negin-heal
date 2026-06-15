import { useMutation } from "@apollo/client/react";
import { useTranslation } from "react-i18next";
import { USER_FORGOT_PASSWORD_MUTATION } from "../graphql/mutations/userForgotPassword.mutation";
import { USER_RESET_PASSWORD_MUTATION } from "../graphql/mutations/userResetPassword.mutation";
import { showErrorIfNotQueued } from "../utilities/graphql-error.util";
import { useSnackbar } from "./useSnackbar";

export interface ForgotPasswordInput {
  identity: string;
}

export interface ResetPasswordInput {
  resetLink: string;
  newPassword: string;
}

interface PasswordResetResponse {
  success: boolean;
  message: string;
}

interface ForgotPasswordResponse {
  userForgotPassword: PasswordResetResponse;
}

interface ResetPasswordResponse {
  userResetPassword: PasswordResetResponse;
}

const PASSWORD_RESET_REQUESTED_MESSAGE =
  "If an account matches the provided information, a password reset link will be sent.";

export const usePasswordReset = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useSnackbar();

  const [forgotPasswordMutation, { loading: requestingResetLink }] = useMutation<
    ForgotPasswordResponse,
    { input: ForgotPasswordInput }
  >(USER_FORGOT_PASSWORD_MUTATION);

  const [resetPasswordMutation, { loading: resettingPassword }] = useMutation<
    ResetPasswordResponse,
    { input: ResetPasswordInput }
  >(USER_RESET_PASSWORD_MUTATION);

  const requestResetLink = async (input: ForgotPasswordInput): Promise<boolean> => {
    try {
      const result = await forgotPasswordMutation({
        variables: {
          input: {
            identity: input.identity.trim(),
          },
        },
      });

      if (result.error) {
        showErrorIfNotQueued(showError, result.error);
        return false;
      }

      const payload = result.data?.userForgotPassword;
      if (!payload?.success) {
        showError(t("auth.login.errors.passwordResetRequestFailed"));
        return false;
      }

      const message =
        payload.message === PASSWORD_RESET_REQUESTED_MESSAGE
          ? t("auth.login.success.passwordResetLinkSent")
          : payload.message || t("auth.login.success.passwordResetLinkSent");
      showSuccess(message);
      return true;
    } catch (error) {
      showErrorIfNotQueued(showError, error);
      return false;
    }
  };

  const resetPassword = async (input: ResetPasswordInput): Promise<boolean> => {
    try {
      const result = await resetPasswordMutation({
        variables: {
          input: {
            resetLink: input.resetLink.trim(),
            newPassword: input.newPassword,
          },
        },
      });

      if (result.error) {
        showErrorIfNotQueued(showError, result.error);
        return false;
      }

      const payload = result.data?.userResetPassword;
      if (!payload?.success) {
        showError(t("auth.login.errors.passwordResetFailed"));
        return false;
      }

      showSuccess(payload.message || t("auth.login.success.passwordResetSuccessful"));
      return true;
    } catch (error) {
      showErrorIfNotQueued(showError, error);
      return false;
    }
  };

  return {
    requestResetLink,
    resetPassword,
    loading: requestingResetLink || resettingPassword,
    requestingResetLink,
    resettingPassword,
  };
};
