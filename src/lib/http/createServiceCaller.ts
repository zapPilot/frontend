/**
 * Service Caller Factory
 *
 * Creates a reusable service call wrapper that handles error mapping.
 * Consolidates duplicated service wrapper pattern across all service files.
 *
 * @example
 * ```typescript
 * import { createServiceCaller } from '@/lib/createServiceCaller';
 * import { createAccountServiceError } from '@/lib/base-error';
 *
 * const callAccountApi = createServiceCaller(createAccountServiceError);
 *
 * // Usage in service function
 * export const getUserProfile = (userId: string) =>
 *   callAccountApi(() => accountApiClient.get(`/users/${userId}`));
 * ```
 *
 * @module lib/createServiceCaller
 */

/**
 * Creates a service caller with consistent error mapping
 *
 * @param errorMapper - Function to transform errors into service-specific error types
 * @returns A function that wraps service calls with error handling
 */
export function createServiceCaller<TError extends Error>(
  errorMapper: (error: unknown) => TError
): <T>(call: () => Promise<T>) => Promise<T> {
  return async function callService<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      throw errorMapper(error);
    }
  };
}
