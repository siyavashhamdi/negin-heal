export type BrowserNotificationInput = {
  readonly title: string;
  readonly body: string;
  readonly tag?: string;
};

export function isSecureBrowserContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function isBrowserNotificationSupported(): boolean {
  return isSecureBrowserContext() && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

export function canRequestBrowserNotificationPrompt(
  permission: NotificationPermission | "unsupported",
): boolean {
  return permission === "default" || permission === "denied";
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  return await Notification.requestPermission();
}

export async function ensureBrowserNotificationPermission(): Promise<boolean> {
  const permission = await requestBrowserNotificationPermission();
  return permission === "granted";
}

export function showBrowserNotification(input: BrowserNotificationInput): void {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  new Notification(input.title, {
    body: input.body,
    tag: input.tag,
    icon: "/logo.svg",
    dir: "rtl",
    lang: "fa",
  });
}
