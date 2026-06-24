export const MIN_USERNAME_LENGTH = 5;

export const isValidUsernameLength = (username: string): boolean =>
  username.trim().length >= MIN_USERNAME_LENGTH;

export class UsernameValidator {
  static validate(username: string): { valid: boolean; errors: string[] } {
    const trimmed = username.trim();

    if (trimmed.length < MIN_USERNAME_LENGTH) {
      return {
        valid: false,
        errors: [
          `Username must be at least ${MIN_USERNAME_LENGTH} characters long`,
        ],
      };
    }

    return { valid: true, errors: [] };
  }
}
