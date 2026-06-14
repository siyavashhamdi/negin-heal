export class MongodbErrorUtil {
  private static readonly DUPLICATE_KEY_ERROR_CODE = 11000;

  static isDuplicateKeyError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === this.DUPLICATE_KEY_ERROR_CODE
    );
  }
}
