export function generateRandomString(
  length: number,
  opts: {
    letters?: boolean; // a-zA-Z
    digits?: boolean; // 0-9
    specials?: boolean; // specialsSet
    specialsSet?: string; // override set
  } = {},
): string {
  const {
    letters = true,
    digits = true,
    specials = false,
    specialsSet = "!@#$%^&*()-_=+[]{};:,.<>/?~|",
  } = opts;

  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("length must be a positive integer");
  }

  const pool =
    (letters ? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" : "") +
    (digits ? "0123456789" : "") +
    (specials ? specialsSet : "");

  if (!pool) {
    throw new Error("Enable at least one character set.");
  }

  // Get cryptographically-strong random bytes (browser → Web Crypto; Node → crypto.randomBytes)
  let bytes: Uint8Array;
  const g: any = globalThis as any;

  if (g.crypto?.getRandomValues) {
    bytes = new Uint8Array(length);
    g.crypto.getRandomValues(bytes); // cryptographically strong RNG
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomBytes } = require("node:crypto");
    bytes = randomBytes(length);
  }

  let res = "";
  for (let i = 0; i < length; i++) {
    res += pool[bytes[i] % pool.length];
  }

  return res;
}
