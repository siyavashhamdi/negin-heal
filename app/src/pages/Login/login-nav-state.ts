/**
 * Identity carried from the first step to the credential step (in-memory only).
 * Refreshing `/login` clears the flow and starts again on the identity form.
 */
export interface LoginNavState {
  readonly identity: string;
  readonly identityKind: "email" | "mobile" | "username";
}

/**
 * Type guard for opaque values (e.g. router `location.state`) when they may
 * carry login identity.
 */
export const isLoginNavState = (value: unknown): value is LoginNavState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<LoginNavState>;
  return (
    typeof candidate.identity === "string" &&
    (candidate.identityKind === "email" ||
      candidate.identityKind === "mobile" ||
      candidate.identityKind === "username") &&
    candidate.identity.length > 0
  );
};
