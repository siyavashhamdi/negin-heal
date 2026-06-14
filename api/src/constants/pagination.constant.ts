export const PAGINATION_CONSTANT = {
  OFFSET_BASED: {
    DEFAULT_SKIP: 0,
    DEFAULT_LIMIT: 10,
  },
  CURSOR_BASED: {
    DEFAULT_LIMIT: 10,
    DEFAULT_START_CURSOR: undefined,
  },
} as const;
