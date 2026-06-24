import { useMutation } from "@apollo/client/react";
import { useTranslation } from "react-i18next";
import { USER_FORGOT_PASSWORD_MUTATION } from "../graphql/mutations/userForgotPassword.mutation";
import { USER_RESET_PASSWORD_MUTATION } from "../graphql/mutations/userResetPassword.mutation";
import { showErrorIfNotQueued } from "../utilities/graphql-error.util";
import { resolveSuccessMessage } from "../utilities/success-message.util";
import { normalizeAuthIdentityForSubmit } from "../utilities/contact-validation.util";
import { useSnackbar } from "./useSnackbar";

export interface ForgotPasswordInput {
  identity: string;
  captchaId?: string;
  captchaValue?: string;
}

export interface ResetPasswordInput {
  identity: string;
  otp: string;
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

export const usePasswordReset = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useSnackbar();

  const [forgotPasswordMutation, { loading: requestingResetCode }] = useMutation<
    ForgotPasswordResponse,
    { input: ForgotPasswordInput }
  >(USER_FORGOT_PASSWORD_MUTATION);

  const [resetPasswordMutation, { loading: resettingPassword }] = useMutation<
    ResetPasswordResponse,
    { input: ResetPasswordInput }
  >(USER_RESET_PASSWORD_MUTATION);

  const requestResetCode = async (input: ForgotPasswordInput): Promise<boolean> => {
    try {
      const result = await forgotPasswordMutation({
        variables: {
          input: {
            identity: normalizeAuthIdentityForSubmit(input.identity),
            captchaId: input.captchaId,
            captchaValue: input.captchaValue,
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

      showSuccess(
        resolveSuccessMessage(payload.message, "auth.login.success.passwordResetCodeSent")
      );
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
            identity: normalizeAuthIdentityForSubmit(input.identity),
            otp: input.otp.trim(),
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

      showSuccess(
        resolveSuccessMessage(payload.message, "auth.login.success.passwordResetSuccessful")
      );
      return true;
    } catch (error) {
      showErrorIfNotQueued(showError, error);
      return false;
    }
  };

  return {
    requestResetCode,
    resetPassword,
    loading: requestingResetCode || resettingPassword,
    requestingResetCode,
    resettingPassword,
  };
};
