import { useMutation } from "@apollo/client/react";
import { useTranslation } from "react-i18next";
import { USER_LOGIN_MUTATION } from "../graphql/mutations/userLogin.mutation";
import { USER_REQUEST_LOGIN_CODE_MUTATION } from "../graphql/mutations/userRequestLoginCode.mutation";
import { USER_REQUEST_SIGNUP_CODE_MUTATION } from "../graphql/mutations/userRequestSignupCode.mutation";
import { RESOLVE_AUTH_IDENTITY_MUTATION } from "../graphql/mutations/resolveAuthIdentity.mutation";
import { USER_SIGNUP_MUTATION } from "../graphql/mutations/userSignup.mutation";
import { USER_VERIFY_LOGIN_CODE_MUTATION } from "../graphql/mutations/userVerifyLoginCode.mutation";
import { USER_ME_QUERY } from "../graphql/queries/userMe.query";
import { apolloClient } from "../lib/apollo-client";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { showErrorIfNotQueued } from "../utilities/graphql-error.util";
import { resolveSuccessMessage } from "../utilities/success-message.util";
import { useAuth, type User } from "../contexts/AuthContext";
import { useSnackbar } from "./useSnackbar";
import { collectSessionClientContextInput } from "../utils/sessionClientContext.util";
import { applyUserPreferences } from "../utils/userPreferences.util";
import { mapMeToUser } from "../utils/storedUser.util";
import {
  normalizeAuthIdentityForSubmit,
  normalizeAuthIdentityMobileForSubmit,
  sanitizeLatinEmailInput,
  sanitizeLatinUsernameInput,
} from "../utilities/contact-validation.util";
import type { UserMeGqlResponse } from "../lib/graphql/generated/graphql";

export interface RequestLoginCodeInput {
  identity: string;
}

export interface VerifyLoginCodeInput {
  identity: string;
  code: string;
  rememberMe?: boolean;
}

export interface PasswordLoginInput {
  identity: string;
  password: string;
  captchaId?: string;
  captchaValue?: string;
  rememberMe?: boolean;
}

export interface PasswordLoginResult {
  success: boolean;
  errorCode?: string;
}

export interface SignupInput {
  username?: string;
  email?: string;
  mobile?: string;
  profile: {
    firstName: string;
    lastName?: string;
  };
  password?: string;
  signupCode?: string;
  captchaId?: string;
  captchaValue?: string;
  rememberMe?: boolean;
}

interface UserRequestLoginCodeResponse {
  requestLoginCode: {
    success: boolean;
    message: string;
  };
}

interface UserRequestSignupCodeResponse {
  requestSignupCode: {
    success: boolean;
    message: string;
  };
}

interface ResolveAuthIdentityResponse {
  resolveAuthIdentity: {
    exists: boolean;
  };
}

interface UserVerifyLoginCodeResponse {
  verifyLoginCode: {
    success: boolean;
    message: string;
    userId?: string | null;
    accessToken?: string | null;
  };
}

interface UserLoginResponse {
  userLogin: {
    accessToken: string;
    user: {
      id: string;
      username: string;
      roles: string[];
    };
  };
}

interface UserSignupResponse {
  userSignup: {
    accessToken: string;
    user: {
      id: string;
      username: string;
      roles: string[];
    };
  };
}

interface UserMeResponse {
  me: UserMeGqlResponse;
}

function extractGraphQLErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const graphQLErrors =
    (
      error as {
        errors?: Array<{ code?: string; extensions?: { code?: string } }>;
        graphQLErrors?: Array<{ code?: string; extensions?: { code?: string } }>;
      }
    ).errors ??
    (
      error as {
        graphQLErrors?: Array<{ code?: string; extensions?: { code?: string } }>;
      }
    ).graphQLErrors;
  const firstGraphQLError = graphQLErrors?.[0];

  return firstGraphQLError?.code || firstGraphQLError?.extensions?.code;
}

async function establishSession(
  accessToken: string,
  login: (token: string, user: User) => void,
  showSuccess: (message: string) => void,
  showError: (message: string) => void,
  successMessage: string,
  failureMessage: string
): Promise<boolean> {
  localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);

  const meResult = await apolloClient.query<UserMeResponse>({
    query: USER_ME_QUERY,
    fetchPolicy: "network-only",
  });

  if (meResult.error || !meResult.data?.me) {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (meResult.error) {
      showErrorIfNotQueued(showError, meResult.error);
    } else {
      showError(failureMessage);
    }
    return false;
  }

  applyUserPreferences(meResult.data.me.preferences);
  login(accessToken, mapMeToUser(meResult.data.me));
  showSuccess(successMessage);
  return true;
}

/**
 * Identity-first login with username, email, or phone number.
 */
export const useLogin = () => {
  const [resolveAuthIdentityMutation, { loading: resolvingIdentity }] = useMutation<
    ResolveAuthIdentityResponse,
    { input: RequestLoginCodeInput }
  >(RESOLVE_AUTH_IDENTITY_MUTATION);

  const [requestLoginCodeMutation, { loading: requestingCode }] = useMutation<
    UserRequestLoginCodeResponse,
    { input: RequestLoginCodeInput }
  >(USER_REQUEST_LOGIN_CODE_MUTATION);

  const [requestSignupCodeMutation, { loading: requestingSignupCode }] = useMutation<
    UserRequestSignupCodeResponse,
    { input: { mobile: string } }
  >(USER_REQUEST_SIGNUP_CODE_MUTATION);

  const [verifyLoginCodeMutation, { loading: verifyingCode }] = useMutation<
    UserVerifyLoginCodeResponse,
    { input: VerifyLoginCodeInput }
  >(USER_VERIFY_LOGIN_CODE_MUTATION);

  const [loginMutation, { loading: loggingInWithPassword }] = useMutation<
    UserLoginResponse,
    { input: PasswordLoginInput }
  >(USER_LOGIN_MUTATION);

  const [signupMutation, { loading: signingUp }] = useMutation<
    UserSignupResponse,
    { input: SignupInput }
  >(USER_SIGNUP_MUTATION);

  const { login } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { t } = useTranslation();

  const buildClientContext = () => collectSessionClientContextInput();

  const normalizeIdentity = (identity: string): string => normalizeAuthIdentityForSubmit(identity);

  const resolveAuthIdentity = async (input: RequestLoginCodeInput): Promise<boolean | null> => {
    try {
      const result = await resolveAuthIdentityMutation({
        variables: { input: { identity: normalizeIdentity(input.identity) } },
      });

      if (result.error) {
        showErrorIfNotQueued(showError, result.error);
        return null;
      }

      return result.data?.resolveAuthIdentity?.exists === true;
    } catch (err) {
      showErrorIfNotQueued(showError, err);
      return null;
    }
  };

  const requestLoginCode = async (input: RequestLoginCodeInput): Promise<boolean> => {
    try {
      const result = await requestLoginCodeMutation({
        variables: { input: { identity: normalizeIdentity(input.identity) } },
      });

      if (result.error) {
        showErrorIfNotQueued(showError, result.error);
        return false;
      }

      if (result.data?.requestLoginCode?.success) {
        const message = result.data.requestLoginCode.message?.trim();
        showSuccess(resolveSuccessMessage(message, "auth.login.success.codeSent"));
        return true;
      }

      showError(t("auth.login.errors.requestCodeFailed"));
      return false;
    } catch (err) {
      showErrorIfNotQueued(showError, err);
      return false;
    }
  };

  const verifyLoginCode = async (input: VerifyLoginCodeInput): Promise<boolean> => {
    try {
      const result = await verifyLoginCodeMutation({
        variables: {
          input: {
            identity: normalizeIdentity(input.identity),
            code: input.code.trim(),
            rememberMe: input.rememberMe === true,
            clientContext: await buildClientContext(),
          },
        },
      });

      if (result.error) {
        showErrorIfNotQueued(showError, result.error);
        return false;
      }

      const payload = result.data?.verifyLoginCode;
      const accessToken = payload?.accessToken?.trim();

      if (!payload?.success || !accessToken) {
        showError(t("auth.login.errors.failed"));
        return false;
      }

      return establishSession(
        accessToken,
        login,
        showSuccess,
        showError,
        t("auth.login.success.loginSuccessful"),
        t("auth.login.errors.failed")
      );
    } catch (err) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      showErrorIfNotQueued(showError, err);
      return false;
    }
  };

  const requestSignupCode = async (mobile: string): Promise<boolean> => {
    try {
      const result = await requestSignupCodeMutation({
        variables: {
          input: {
            mobile: normalizeAuthIdentityMobileForSubmit(mobile.trim()) ?? mobile.trim(),
          },
        },
      });

      if (result.error) {
        showErrorIfNotQueued(showError, result.error);
        return false;
      }

      if (result.data?.requestSignupCode?.success) {
        const message = result.data.requestSignupCode.message?.trim();
        showSuccess(resolveSuccessMessage(message, "auth.login.success.codeSent"));
        return true;
      }

      showError(t("auth.login.errors.requestCodeFailed"));
      return false;
    } catch (err) {
      showErrorIfNotQueued(showError, err);
      return false;
    }
  };

  const loginWithPassword = async (input: PasswordLoginInput): Promise<PasswordLoginResult> => {
    try {
      const result = await loginMutation({
        variables: {
          input: {
            identity: normalizeIdentity(input.identity),
            password: input.password,
            captchaId: input.captchaId,
            captchaValue: input.captchaValue,
            rememberMe: input.rememberMe === true,
            clientContext: await buildClientContext(),
          },
        },
      });

      if (result.error) {
        showErrorIfNotQueued(showError, result.error);
        return {
          success: false,
          errorCode: extractGraphQLErrorCode(result.error),
        };
      }

      const accessToken = result.data?.userLogin?.accessToken?.trim();

      if (!accessToken) {
        showError(t("auth.login.errors.failed"));
        return { success: false };
      }

      const success = await establishSession(
        accessToken,
        login,
        showSuccess,
        showError,
        t("auth.login.success.loginSuccessful"),
        t("auth.login.errors.failed")
      );
      return { success };
    } catch (err) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      showErrorIfNotQueued(showError, err);
      return {
        success: false,
        errorCode: extractGraphQLErrorCode(err),
      };
    }
  };

  const signup = async (input: SignupInput): Promise<boolean> => {
    try {
      const result = await signupMutation({
        variables: {
          input: {
            username: input.username?.trim()
              ? sanitizeLatinUsernameInput(input.username).toLowerCase()
              : undefined,
            email: input.email?.trim()
              ? sanitizeLatinEmailInput(input.email).toLowerCase()
              : undefined,
            mobile: input.mobile?.trim()
              ? (normalizeAuthIdentityMobileForSubmit(input.mobile) ?? undefined)
              : undefined,
            profile: {
              firstName: input.profile.firstName.trim(),
              ...(input.profile.lastName?.trim()
                ? { lastName: input.profile.lastName.trim() }
                : {}),
            },
            password: input.password?.trim() || undefined,
            signupCode: input.signupCode?.trim() || undefined,
            captchaId: input.captchaId,
            captchaValue: input.captchaValue,
            rememberMe: input.rememberMe === true,
            clientContext: await buildClientContext(),
          },
        },
      });

      if (result.error) {
        showErrorIfNotQueued(showError, result.error);
        return false;
      }

      const accessToken = result.data?.userSignup?.accessToken?.trim();
      if (!accessToken) {
        showError(t("auth.login.errors.failed"));
        return false;
      }

      return establishSession(
        accessToken,
        login,
        showSuccess,
        showError,
        t("auth.login.success.signupSuccessful"),
        t("auth.login.errors.failed")
      );
    } catch (err) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      showErrorIfNotQueued(showError, err);
      return false;
    }
  };

  return {
    resolveAuthIdentity,
    requestLoginCode,
    requestSignupCode,
    verifyLoginCode,
    loginWithPassword,
    signup,
    loading:
      resolvingIdentity ||
      requestingCode ||
      requestingSignupCode ||
      verifyingCode ||
      loggingInWithPassword ||
      signingUp,
  };
};
