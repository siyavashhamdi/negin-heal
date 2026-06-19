const POST_LOGIN_REDIRECT_STORAGE_KEY = "post-login-redirect";

export type PostLoginRedirect = {
  readonly pathname: string;
  readonly openCoursePurchase?: boolean;
};

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

export function setPostLoginRedirect(redirect: PostLoginRedirect): void {
  sessionStorage.setItem(POST_LOGIN_REDIRECT_STORAGE_KEY, JSON.stringify(redirect));
}

export function consumePostLoginRedirect(): PostLoginRedirect | null {
  const raw = sessionStorage.getItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  sessionStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPostLoginRedirect(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
