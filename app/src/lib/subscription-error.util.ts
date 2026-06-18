function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }

  return String(error ?? "");
}

export function isRecoverableSubscriptionError(error: unknown): boolean {
  const normalizedMessage = readErrorMessage(error).toLowerCase();

  return (
    normalizedMessage.includes("socket closed") ||
    normalizedMessage.includes("websocket closed") ||
    normalizedMessage.includes("connection closed") ||
    normalizedMessage.includes("closed before the connection was established") ||
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("connection") ||
    normalizedMessage.includes("terminated")
  );
}
