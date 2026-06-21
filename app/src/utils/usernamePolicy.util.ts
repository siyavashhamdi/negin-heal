export const MIN_USERNAME_LENGTH = 5;

export const isValidUsernameLength = (username: string): boolean =>
  username.trim().length >= MIN_USERNAME_LENGTH;
