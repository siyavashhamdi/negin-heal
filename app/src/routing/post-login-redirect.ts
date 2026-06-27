import { APP_SHELL_ROUTES } from "./app-shell-routes";

const POST_LOGIN_REDIRECT_STORAGE_KEY = "post-login-redirect";

export type PostLoginRedirect = {
  readonly pathname: string;
  readonly openCoursePurchase?: boolean;
};

export type LoginReturnState = {
  readonly returnTo: string;
  readonly openCoursePurchase?: boolean;
};

export function buildCoursePostLoginRedirect(courseId: string): PostLoginRedirect {
  return {
    pathname: `${APP_SHELL_ROUTES.courses}/${courseId}`,
    openCoursePurchase: true,
  };
}

export function buildCourseLoginReturnState(courseId: string): LoginReturnState {
  return {
    returnTo: `${APP_SHELL_ROUTES.courses}/${courseId}`,
    openCoursePurchase: true,
  };
}

function isPostLoginRedirect(value: unknown): value is PostLoginRedirect {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PostLoginRedirect>;
  return (
    typeof candidate.pathname === "string" &&
    candidate.pathname.startsWith("/") &&
    (candidate.openCoursePurchase === undefined ||
      typeof candidate.openCoursePurchase === "boolean")
  );
}

export function extractLoginReturnState(value: unknown): LoginReturnState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<LoginReturnState>;
  if (typeof candidate.returnTo !== "string" || !candidate.returnTo.startsWith("/")) {
    return null;
  }

  return {
    returnTo: candidate.returnTo,
    openCoursePurchase: candidate.openCoursePurchase === true ? true : undefined,
  };
}

export function postLoginRedirectFromReturnState(value: unknown): PostLoginRedirect | null {
  const returnState = extractLoginReturnState(value);
  if (!returnState) {
    return null;
  }

  return {
    pathname: returnState.returnTo,
    openCoursePurchase: returnState.openCoursePurchase,
  };
}

export function mergeWithLoginReturnState<T extends object>(
  base: T,
  returnState: LoginReturnState | null
): T & Partial<LoginReturnState> {
  if (!returnState) {
    return base;
  }

  return {
    ...base,
    returnTo: returnState.returnTo,
    ...(returnState.openCoursePurchase ? { openCoursePurchase: true } : {}),
  };
}

function readPostLoginRedirect(): PostLoginRedirect | null {
  const raw = localStorage.getItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPostLoginRedirect(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setPostLoginRedirect(redirect: PostLoginRedirect): void {
  localStorage.setItem(POST_LOGIN_REDIRECT_STORAGE_KEY, JSON.stringify(redirect));
}

export function peekPostLoginRedirect(): PostLoginRedirect | null {
  return readPostLoginRedirect();
}

export function consumePostLoginRedirect(): PostLoginRedirect | null {
  const redirect = readPostLoginRedirect();
  if (!redirect) {
    return null;
  }

  localStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
  return redirect;
}

export function clearPostLoginRedirect(): void {
  localStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
}

export function resolvePendingPostLoginRedirect(
  locationState: unknown
): PostLoginRedirect | null {
  return peekPostLoginRedirect() ?? postLoginRedirectFromReturnState(locationState);
}
