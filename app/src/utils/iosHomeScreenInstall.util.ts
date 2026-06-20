type NavigatorWithStandalone = Navigator & {
  readonly standalone?: boolean;
};

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isIosSafariBrowser(): boolean {
  if (!isIosDevice()) {
    return false;
  }

  const userAgent = navigator.userAgent;
  return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
}

export function isInstalledPwa(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = navigator as NavigatorWithStandalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function shouldShowIosHomeScreenInstallPrompt(): boolean {
  return isIosSafariBrowser() && !isInstalledPwa();
}
