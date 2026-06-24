import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { env } from "../../config";
import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { SecurityConfig } from "../../config/security.config";
import { UserLoginCaptchaGqlResponse } from "./graphql/responses/user-login-captcha.gql.response";

const CAPTCHA_LENGTH = 5;
const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface CaptchaChallengeRecord {
  readonly expectedAnswerHash: string;
  readonly expiresAtMs: number;
  attempts: number;
}

export enum CaptchaVerificationStatus {
  VALID = "VALID",
  EXPIRED = "EXPIRED",
  INVALID = "INVALID",
}

/** Persian (۰–۹) and Arabic-Indic (٠–٩) digits → ASCII. */
const NON_ASCII_DIGIT_TO_ASCII: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

@Injectable()
export class UserCaptchaService {
  private readonly defaultTtlSeconds = 120;
  private readonly defaultMaxAttempts = 5;
  private readonly captchaStore = new Map<string, CaptchaChallengeRecord>();
  private readonly signingSecret = SecurityConfig.validateJwtSecret();
  private readonly ttlSeconds = Number.isFinite(env.CAPTCHA_TTL_SECONDS)
    ? Math.max(30, env.CAPTCHA_TTL_SECONDS)
    : this.defaultTtlSeconds;
  private readonly maxAttempts = Number.isFinite(env.CAPTCHA_MAX_ATTEMPTS)
    ? Math.max(1, env.CAPTCHA_MAX_ATTEMPTS)
    : this.defaultMaxAttempts;

  issueCaptcha(): UserLoginCaptchaGqlResponse {
    this.pruneExpiredCaptchas();

    const challenge = this.createChallengeText();
    const captchaId = randomBytes(16).toString("hex");
    const expiresAtMs = Date.now() + this.ttlSeconds * 1000;

    this.captchaStore.set(captchaId, {
      expectedAnswerHash: this.signExpectedAnswer(captchaId, challenge),
      expiresAtMs,
      attempts: 0,
    });

    return {
      captchaId,
      imageBase64: this.buildSvgCaptchaBase64(challenge),
      imageMimeType: "image/svg+xml",
      expiresAtIso: new Date(expiresAtMs).toISOString(),
    };
  }

  verifyCaptcha(captchaId: string, answer: string): CaptchaVerificationStatus {
    this.pruneExpiredCaptchas();

    const normalizedCaptchaId = captchaId.trim();
    if (!normalizedCaptchaId) {
      return CaptchaVerificationStatus.EXPIRED;
    }

    const challengeRecord = this.captchaStore.get(normalizedCaptchaId);
    if (!challengeRecord || challengeRecord.expiresAtMs <= Date.now()) {
      this.captchaStore.delete(normalizedCaptchaId);
      return CaptchaVerificationStatus.EXPIRED;
    }

    const normalizedAnswer = this.normalizeCaptchaAnswer(answer);
    if (!normalizedAnswer) {
      challengeRecord.attempts += 1;
      if (challengeRecord.attempts >= this.maxAttempts) {
        this.captchaStore.delete(normalizedCaptchaId);
      }
      return CaptchaVerificationStatus.INVALID;
    }

    const providedHash = this.signExpectedAnswer(
      normalizedCaptchaId,
      normalizedAnswer,
    );
    const isMatch = this.timingSafeEqualsHex(
      challengeRecord.expectedAnswerHash,
      providedHash,
    );

    if (isMatch) {
      // Single-use captcha token.
      this.captchaStore.delete(normalizedCaptchaId);
      return CaptchaVerificationStatus.VALID;
    }

    challengeRecord.attempts += 1;
    if (challengeRecord.attempts >= this.maxAttempts) {
      this.captchaStore.delete(normalizedCaptchaId);
    }

    return CaptchaVerificationStatus.INVALID;
  }

  private createChallengeText(): string {
    return Array.from({ length: CAPTCHA_LENGTH }, () => {
      const index = Math.floor(Math.random() * CAPTCHA_CHARS.length);
      return CAPTCHA_CHARS[index] ?? "A";
    }).join("");
  }

  private signExpectedAnswer(captchaId: string, answer: string): string {
    return createHmac("sha256", this.signingSecret)
      .update(`${captchaId}:${this.normalizeCaptchaAnswer(answer)}`)
      .digest("hex");
  }

  private timingSafeEqualsHex(
    expectedHex: string,
    providedHex: string,
  ): boolean {
    try {
      const expected = Buffer.from(expectedHex, "hex");
      const provided = Buffer.from(providedHex, "hex");
      if (expected.length !== provided.length) {
        return false;
      }
      return timingSafeEqual(expected, provided);
    } catch {
      return false;
    }
  }

  private normalizeCaptchaAnswer(value: string): string {
    let normalized = value.trim().toUpperCase();
    for (const [from, to] of Object.entries(NON_ASCII_DIGIT_TO_ASCII)) {
      normalized = normalized.split(from).join(to);
    }
    return normalized;
  }

  private pruneExpiredCaptchas(): void {
    const now = Date.now();
    for (const [captchaId, captcha] of this.captchaStore.entries()) {
      if (captcha.expiresAtMs <= now) {
        this.captchaStore.delete(captchaId);
      }
    }
  }

  private buildSvgCaptchaBase64(challenge: string): string {
    try {
      const width = 180;
      const height = 56;
      const chars = challenge.split("");
      const charStep = 16;
      const startX = 52;
      const baselineY = 35;
      let currentX = startX;

      const textNodes = chars
        .map((char, index) => {
          const angle = this.round1(this.randomBetween(-30, 30));
          const dx = this.round1(this.randomBetween(-7, 7));
          const dy = this.round1(this.randomBetween(-8, 8));
          const marginStart = this.round1(this.randomBetween(0, 3.2));
          const marginEnd = this.round1(this.randomBetween(0.5, 6.7));
          currentX += index === 0 ? 0 : marginStart;
          const x = currentX + dx;
          const y = baselineY + dy;
          currentX += charStep + marginEnd;
          return `<text x="${x}" y="${y}" transform="rotate(${angle} ${x} ${y})">${char}</text>`;
        })
        .join("");

      const noiseLineCount = 4 + Math.floor(Math.random() * 4);
      const noiseLines = Array.from({ length: noiseLineCount }, () => {
        const angle = this.round1(this.randomBetween(-75, 75));
        const lineWidth = this.round1(this.randomBetween(40, 162));
        const x = this.round1(this.randomBetween(14, width - 14));
        const y = this.round1(this.randomBetween(5, height - 5));
        return `<line x1="${-lineWidth / 2}" y1="0" x2="${lineWidth / 2}" y2="0" stroke="url(#noiseGradient)" stroke-width="2" stroke-linecap="round" opacity="0.85" transform="translate(${x} ${y}) rotate(${angle})" />`;
      }).join("");

      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0f2f7" />
      <stop offset="100%" stop-color="#e8ecf2" />
    </linearGradient>
    <linearGradient id="noiseGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="transparent" />
      <stop offset="18%" stop-color="rgba(198, 40, 40, 0.55)" />
      <stop offset="50%" stop-color="rgba(25, 118, 210, 0.55)" />
      <stop offset="82%" stop-color="rgba(46, 125, 50, 0.45)" />
      <stop offset="100%" stop-color="transparent" />
    </linearGradient>
    <pattern id="stripePattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <rect width="6" height="12" fill="rgba(25, 118, 210, 0.07)" />
      <rect x="6" width="6" height="12" fill="rgba(255, 255, 255, 0.35)" />
    </pattern>
  </defs>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="8" fill="url(#bgGradient)" />
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="8" fill="url(#stripePattern)" />
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="8" fill="none" stroke="rgba(25, 118, 210, 0.38)" stroke-dasharray="4 4" />
  ${noiseLines}
  <g font-family="monospace" font-size="24" font-weight="700" fill="rgba(55, 65, 81, 0.94)">
    ${textNodes}
  </g>
</svg>`.trim();

      return Buffer.from(svg, "utf8").toString("base64");
    } catch {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.CAPTCHA_GENERATION_FAILED,
      );
    }
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private round1(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
