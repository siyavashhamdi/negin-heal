const VITE_HMR_PREFIX = "[vite]";

function shouldSuppressDevConsoleMessage(args: unknown[]): boolean {
  const first = args[0];
  return typeof first === "string" && first.startsWith(VITE_HMR_PREFIX);
}

export function suppressDevConsoleNoise(): void {
  if (!import.meta.env.DEV) {
    return;
  }

  for (const method of ["log", "debug", "info"] as const) {
    const original = console[method].bind(console);

    console[method] = (...args: unknown[]) => {
      if (shouldSuppressDevConsoleMessage(args)) {
        return;
      }

      original(...args);
    };
  }
}

suppressDevConsoleNoise();
