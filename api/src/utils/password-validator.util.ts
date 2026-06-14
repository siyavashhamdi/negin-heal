/**
 * Password validation utility
 * Enforces strong password requirements
 */
export class PasswordValidator {
  /**
   * Minimum password requirements:
   * - At least 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (password.length > 128) {
      errors.push("Password must not exceed 128 characters");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    // Check for common weak passwords
    const commonPasswords = [
      "password",
      "12345678",
      "password123",
      "admin123",
      "qwerty123",
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("Password is too common and easily guessable");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get password strength score (0-4)
   * 0 = Very weak
   * 1 = Weak
   * 2 = Fair
   * 3 = Good
   * 4 = Strong
   */
  static getStrength(password: string): number {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    if (password.length >= 16) score++;

    // Cap at 4
    return Math.min(score, 4);
  }
}
