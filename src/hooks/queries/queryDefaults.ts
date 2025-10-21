/**
 * React Query Configuration Defaults
 *
 * Provides reusable query configuration patterns for consistent
 * retry logic, timing, and error handling across all query hooks.
 *
 * Consolidates duplicated retry/timing configuration from 6+ query hooks.
 *
 * @example
 * ```typescript
 * // Standard usage
 * const query = useQuery({
 *   ...createQueryConfig({ dataType: 'dynamic' }),
 *   queryKey: ['tokens', address],
 *   queryFn: () => fetchTokens(address),
 * });
 *
 * // With custom retry logic
 * const query = useQuery({
 *   ...createQueryConfig({
 *     dataType: 'realtime',
 *     retryConfig: {
 *       skipErrorMessages: ['USER_NOT_FOUND'],
 *     },
 *   }),
 *   queryKey: ['portfolio', userId],
 *   queryFn: () => fetchPortfolio(userId),
 * });
 * ```
 *
 * @module hooks/queries/queryDefaults
 */

import { BaseServiceError } from "@/lib/base-error";

/**
 * Data freshness profiles for different query types
 *
 * - **static**: Rarely changing data (strategies, token lists) - 10min stale, 30min cache
 * - **dynamic**: Frequently changing data (balances, user data) - 2min stale, 5min cache
 * - **realtime**: Constantly changing data (portfolio, live prices) - 30s stale, 2min cache
 */
export const QUERY_TIMINGS = {
  static: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
} as const;

/**
 * Check if error is a client error (4xx status code)
 *
 * @param error - Error object to check
 * @returns True if error has 4xx status code
 */
export const isClientError = (error: unknown): boolean => {
  // Check BaseServiceError (preferred)
  if (error instanceof BaseServiceError) {
    return error.isClientError();
  }

  // Check plain objects with status property
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: number }).status;
    return typeof status === "number" && status >= 400 && status < 500;
  }

  return false;
};

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 2) */
  maxRetries?: number;
  /** Skip retrying client errors (4xx status codes) (default: true) */
  skipClientErrors?: boolean;
  /** Skip retrying errors with specific message substrings */
  skipErrorMessages?: string[];
  /** Custom retry logic - overrides all default behavior */
  customRetry?: (failureCount: number, error: unknown) => boolean;
}

/**
 * Query configuration options
 */
export interface QueryConfigOptions {
  /** Data type determines stale/cache times */
  dataType?: keyof typeof QUERY_TIMINGS;
  /** Retry behavior configuration */
  retryConfig?: RetryConfig;
}

/**
 * Create standardized React Query configuration
 *
 * @param options - Configuration options
 * @returns Query configuration object with retry, retryDelay, staleTime, and gcTime
 */
export const createQueryConfig = (options: QueryConfigOptions = {}) => {
  const { dataType = "dynamic", retryConfig } = options;

  const {
    maxRetries = 2,
    skipClientErrors = true,
    skipErrorMessages = [],
    customRetry,
  } = retryConfig || {};

  const timings = QUERY_TIMINGS[dataType];

  return {
    ...timings,
    retry: (failureCount: number, error: unknown) => {
      // Custom retry logic takes complete precedence
      if (customRetry) {
        return customRetry(failureCount, error);
      }

      // Max retries check
      if (failureCount >= maxRetries) {
        return false;
      }

      // Skip client errors (4xx) if configured
      if (skipClientErrors && isClientError(error)) {
        return false;
      }

      // Skip errors with specific messages
      if (error instanceof Error) {
        if (skipErrorMessages.some(msg => error.message.includes(msg))) {
          return false;
        }
      }

      return true;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1500 * 2 ** attemptIndex, 30_000),
  };
};

/**
 * Preset configurations for common use cases
 */
export const QUERY_PRESETS = {
  /** Portfolio/balance data - realtime with standard retry */
  portfolio: createQueryConfig({ dataType: "realtime" }),

  /** Token prices - dynamic with standard retry */
  prices: createQueryConfig({ dataType: "dynamic" }),

  /** User profile - dynamic with standard retry */
  user: createQueryConfig({ dataType: "dynamic" }),

  /** Strategies/tokens list - static with standard retry */
  metadata: createQueryConfig({ dataType: "static" }),
} as const;
