/**
 * Queues Apollo Client errors from the error link (non-React context)
 * for {@link ApolloErrorHandler} to drain on an interval.
 */

export interface QueuedApolloError {
  readonly message: string;
  readonly timestamp: number;
}

const errorQueue: QueuedApolloError[] = [];

export const queueApolloError = (message: string): void => {
  errorQueue.push({ message, timestamp: Date.now() });
};

export const getErrors = (): QueuedApolloError[] => [...errorQueue];

export const removeProcessedErrors = (timestamps: ReadonlySet<number>): void => {
  const remaining = errorQueue.filter((entry) => !timestamps.has(entry.timestamp));
  errorQueue.length = 0;
  errorQueue.push(...remaining);
};
