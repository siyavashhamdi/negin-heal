/**
 * Queues Apollo Client errors and auth redirects from the error link (non-React context)
 * for {@link ApolloErrorHandler} to drain on an interval.
 */

export interface QueuedApolloError {
  readonly message: string;
  readonly timestamp: number;
}

export interface QueuedLoginRedirect {
  readonly timestamp: number;
}

const errorQueue: QueuedApolloError[] = [];
const redirectQueue: QueuedLoginRedirect[] = [];

export const queueApolloError = (message: string): void => {
  errorQueue.push({ message, timestamp: Date.now() });
};

export const queueRedirectToLogin = (): void => {
  redirectQueue.push({ timestamp: Date.now() });
};

export const getErrors = (): QueuedApolloError[] => [...errorQueue];

export const removeProcessedErrors = (timestamps: ReadonlySet<number>): void => {
  const remaining = errorQueue.filter((entry) => !timestamps.has(entry.timestamp));
  errorQueue.length = 0;
  errorQueue.push(...remaining);
};

export const getRedirects = (): QueuedLoginRedirect[] => [...redirectQueue];

export const removeProcessedRedirects = (timestamps: ReadonlySet<number>): void => {
  const remaining = redirectQueue.filter((entry) => !timestamps.has(entry.timestamp));
  redirectQueue.length = 0;
  redirectQueue.push(...remaining);
};
