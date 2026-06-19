/** Longest edge cap — kept in sync with client-side upload compression. */
export const MAX_IMAGE_DIMENSION_PX = 2048;

/** Target max output size in bytes (~1.25 MB). */
export const MAX_IMAGE_SIZE_BYTES = Math.floor(1.25 * 1024 * 1024);

/** Starting JPEG/WebP quality before iterative reduction. */
export const INITIAL_IMAGE_QUALITY = 85;

/** Skip re-encoding tiny images that are already efficiently compressed. */
export const SKIP_BELOW_BYTES = 180 * 1024;

/** Max quality-reduction iterations when output is still above target size. */
export const MAX_COMPRESSION_ITERATIONS = 10;

export const SKIP_IMAGE_MIME_TYPES = new Set([
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

export const LOSSY_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
]);

export const COMPRESSIBLE_IMAGE_EXTENSION = /\.(jpe?g|png|webp|bmp|avif)$/i;
