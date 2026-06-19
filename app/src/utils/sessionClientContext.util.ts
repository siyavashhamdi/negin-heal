export type SessionClientContextInput = {
  readonly clientType?: string;
  readonly deviceName?: string;
  readonly deviceModel?: string;
  readonly deviceCategory?: string;
  readonly osName?: string;
  readonly osVersion?: string;
  readonly browserName?: string;
  readonly browserVersion?: string;
  readonly engineName?: string;
  readonly architecture?: string;
  readonly bitness?: string;
  readonly platform?: string;
  readonly screenResolution?: string;
  readonly viewportSize?: string;
  readonly devicePixelRatio?: number;
  readonly language?: string;
  readonly languages?: string;
  readonly timezone?: string;
  readonly timezoneOffset?: string;
  readonly colorScheme?: string;
  readonly touchInput?: boolean;
  readonly maxTouchPoints?: number;
  readonly connectionType?: string;
  readonly downlinkMbps?: number;
  readonly rttMs?: number;
  readonly saveData?: boolean;
  readonly cpuCores?: number;
  readonly deviceMemoryGb?: number;
  readonly cookiesEnabled?: boolean;
  readonly pdfViewerEnabled?: boolean;
  readonly appVersion?: string;
  readonly pageUrl?: string;
  readonly referrer?: string;
};

type NavigatorConnection = {
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
};

type NavigatorWithHints = Navigator & {
  readonly userAgentData?: {
    readonly mobile?: boolean;
    readonly platform?: string;
    readonly brands?: ReadonlyArray<{ readonly brand: string; readonly version: string }>;
    getHighEntropyValues?: (
      hints: readonly string[]
    ) => Promise<Record<string, string | number | boolean>>;
  };
  readonly deviceMemory?: number;
  readonly pdfViewerEnabled?: boolean;
  readonly connection?: NavigatorConnection;
  readonly standalone?: boolean;
};

type WindowWithNativeBridge = Window & {
  readonly Capacitor?: { readonly getPlatform?: () => string };
  readonly ReactNativeWebView?: unknown;
};

type DeviceHints = {
  readonly deviceModel?: string;
  readonly architecture?: string;
  readonly bitness?: string;
  readonly osName?: string;
  readonly osVersion?: string;
};

function isTouchPrimaryDevice(): boolean {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function isInstalledPwa(): boolean {
  const navigatorWithStandalone = navigator as NavigatorWithHints;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function detectClientType(userAgent: string): string {
  const windowWithBridge = window as WindowWithNativeBridge;
  const capacitorPlatform = windowWithBridge.Capacitor?.getPlatform?.().toLowerCase();

  if (capacitorPlatform === "ios") {
    return "ios_app";
  }

  if (capacitorPlatform === "android") {
    return "android_app";
  }

  if (windowWithBridge.ReactNativeWebView) {
    return /iPhone|iPod|iPad/i.test(userAgent) ? "ios_app" : "android_app";
  }

  if (isInstalledPwa()) {
    return "installed_pwa";
  }

  if (/; wv\)/i.test(userAgent) || /\bWebView\b/i.test(userAgent)) {
    return "android_app";
  }

  if (
    /iPhone|iPod|iPad/i.test(userAgent) &&
    /AppleWebKit/i.test(userAgent) &&
    !/Safari/i.test(userAgent)
  ) {
    return "ios_app";
  }

  return "browser";
}

function parseBrowser(userAgent: string): {
  name: string;
  version: string | null;
  engine: string | null;
} {
  const edgeMatch = userAgent.match(/\bEdg(?:A|iOS)?\/([\d.]+)/i);
  if (edgeMatch) {
    return { name: "Edge", version: edgeMatch[1], engine: "Blink" };
  }

  const operaMatch = userAgent.match(/\bOPR\/([\d.]+)/i);
  if (operaMatch) {
    return { name: "Opera", version: operaMatch[1], engine: "Blink" };
  }

  const firefoxMatch = userAgent.match(/\bFirefox\/([\d.]+)/i);
  if (firefoxMatch) {
    return { name: "Firefox", version: firefoxMatch[1], engine: "Gecko" };
  }

  const chromeMatch = userAgent.match(/\bChrome\/([\d.]+)/i);
  if (chromeMatch && !/Edg|OPR/i.test(userAgent)) {
    return { name: "Chrome", version: chromeMatch[1], engine: "Blink" };
  }

  const safariMatch = userAgent.match(/\bVersion\/([\d.]+).+\bSafari\b/i);
  if (safariMatch) {
    return { name: "Safari", version: safariMatch[1], engine: "WebKit" };
  }

  return { name: "Unknown", version: null, engine: null };
}

function parseOs(
  userAgent: string,
  platformHint?: string
): { name: string; version: string | null } {
  const windowsMatch = userAgent.match(/\bWindows NT ([\d.]+)/i);
  if (windowsMatch) {
    return { name: "Windows", version: windowsMatch[1] };
  }

  if (/iPhone|iPod/i.test(userAgent)) {
    const iosMatch = userAgent.match(/\bOS ([\d_]+) like Mac OS X/i);
    return { name: "iOS", version: iosMatch?.[1]?.replace(/_/g, ".") ?? null };
  }

  if (/iPad/i.test(userAgent)) {
    const ipadMatch = userAgent.match(/\bOS ([\d_]+) like Mac OS X/i);
    return { name: "iPadOS", version: ipadMatch?.[1]?.replace(/_/g, ".") ?? null };
  }

  if (/Android/i.test(userAgent)) {
    const androidMatch = userAgent.match(/\bAndroid ([\d.]+)/i);
    return { name: "Android", version: androidMatch?.[1] ?? null };
  }

  const macMatch = userAgent.match(/\bMac OS X ([\d_]+)/i);
  if (macMatch || /Macintosh/i.test(userAgent) || platformHint === "macOS") {
    return { name: "macOS", version: macMatch?.[1]?.replace(/_/g, ".") ?? null };
  }

  if (/CrOS/i.test(userAgent)) {
    return { name: "Chrome OS", version: null };
  }

  if (/Linux/i.test(userAgent) || platformHint === "Linux") {
    return { name: "Linux", version: null };
  }

  return { name: platformHint || navigator.platform || "Unknown", version: null };
}

function parseAndroidModel(userAgent: string): string | null {
  const match = userAgent.match(/Android [^;]+;\s*([^;)]+)\s*(?:Build|\))/i);
  const model = match?.[1]?.trim();
  return model && model.toLowerCase() !== "linux" ? model : null;
}

function detectDeviceCategory(userAgent: string, mobileHint?: boolean): string {
  if (typeof mobileHint === "boolean") {
    return mobileHint ? (/iPad|Tablet|SM-T|Tab/i.test(userAgent) ? "tablet" : "mobile") : "desktop";
  }

  if (/iPad|Tablet|SM-T|Tab/i.test(userAgent)) {
    return "tablet";
  }

  if (/Mobi|iPhone|iPod|Android/i.test(userAgent)) {
    return "mobile";
  }

  return isTouchPrimaryDevice() ? "mobile" : "desktop";
}

function buildDeviceName(osName: string, category: string, model: string | null): string {
  if (model) {
    return model;
  }

  if (osName === "iOS") {
    return "iPhone";
  }

  if (osName === "iPadOS") {
    return "iPad";
  }

  if (osName === "Android") {
    return category === "tablet" ? "Android Tablet" : "Android";
  }

  if (osName === "macOS") {
    return "Mac";
  }

  if (osName === "Windows") {
    return "Windows PC";
  }

  if (osName === "Linux") {
    return "Linux";
  }

  if (osName === "Chrome OS") {
    return "Chromebook";
  }

  return osName;
}

function formatTimezoneOffset(): string {
  const offsetMinutes = new Date().getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${minutes}`;
}

function readColorScheme(): string {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }

  return "no-preference";
}

async function collectHighEntropyHints(): Promise<DeviceHints> {
  const getHighEntropyValues = (navigator as NavigatorWithHints).userAgentData
    ?.getHighEntropyValues;

  if (!getHighEntropyValues) {
    return {};
  }

  try {
    const hints = await getHighEntropyValues([
      "platform",
      "platformVersion",
      "architecture",
      "bitness",
      "model",
    ]);

    const platform = typeof hints.platform === "string" ? hints.platform : undefined;
    const platformVersion =
      typeof hints.platformVersion === "string"
        ? hints.platformVersion.replace(/_/g, ".")
        : undefined;
    const model = typeof hints.model === "string" && hints.model.trim() ? hints.model : undefined;

    let osName: string | undefined;
    if (platform === "Windows") {
      osName = "Windows";
    } else if (platform === "macOS") {
      osName = "macOS";
    } else if (platform === "Linux") {
      osName = "Linux";
    } else if (platform === "Android") {
      osName = "Android";
    } else if (platform === "iOS") {
      osName = "iOS";
    } else if (platform) {
      osName = platform;
    }

    return {
      deviceModel: model,
      architecture: typeof hints.architecture === "string" ? hints.architecture : undefined,
      bitness: typeof hints.bitness === "string" ? hints.bitness : undefined,
      osName,
      osVersion: platformVersion,
    };
  } catch {
    return {};
  }
}

function buildSessionClientContextInput(
  hints: DeviceHints,
  appVersion?: string | null
): SessionClientContextInput {
  const navigatorWithHints = navigator as NavigatorWithHints;
  const userAgent = navigator.userAgent;
  const os = parseOs(userAgent, navigatorWithHints.userAgentData?.platform);
  const browser = parseBrowser(userAgent);
  const deviceCategory = detectDeviceCategory(userAgent, navigatorWithHints.userAgentData?.mobile);
  const deviceModel = hints.deviceModel ?? parseAndroidModel(userAgent);
  const osName = hints.osName ?? os.name;
  const connection = navigatorWithHints.connection;

  return {
    clientType: detectClientType(userAgent),
    deviceName: buildDeviceName(osName, deviceCategory, deviceModel),
    deviceModel: deviceModel ?? undefined,
    deviceCategory,
    osName,
    osVersion: hints.osVersion ?? os.version ?? undefined,
    browserName: browser.name,
    browserVersion: browser.version ?? undefined,
    engineName: browser.engine ?? undefined,
    architecture: hints.architecture,
    bitness: hints.bitness,
    platform: navigator.platform || undefined,
    screenResolution: `${window.screen.width} × ${window.screen.height}`,
    viewportSize: `${window.innerWidth} × ${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio || 1,
    language: navigator.language,
    languages: navigator.languages.join(", "),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: formatTimezoneOffset(),
    colorScheme: readColorScheme(),
    touchInput: isTouchPrimaryDevice(),
    maxTouchPoints: navigator.maxTouchPoints || 0,
    connectionType: connection?.effectiveType?.toUpperCase(),
    downlinkMbps: typeof connection?.downlink === "number" ? connection.downlink : undefined,
    rttMs: typeof connection?.rtt === "number" ? connection.rtt : undefined,
    saveData: typeof connection?.saveData === "boolean" ? connection.saveData : undefined,
    cpuCores: navigator.hardwareConcurrency ?? undefined,
    deviceMemoryGb: navigatorWithHints.deviceMemory ?? undefined,
    cookiesEnabled: navigator.cookieEnabled,
    pdfViewerEnabled:
      typeof navigatorWithHints.pdfViewerEnabled === "boolean"
        ? navigatorWithHints.pdfViewerEnabled
        : undefined,
    appVersion: appVersion?.trim() || undefined,
    pageUrl: window.location.href,
    referrer: document.referrer || undefined,
  };
}

export async function collectSessionClientContextInput(
  appVersion?: string | null
): Promise<SessionClientContextInput> {
  const hints = await collectHighEntropyHints();
  return buildSessionClientContextInput(hints, appVersion);
}
