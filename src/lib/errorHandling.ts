/**
 * Error Handling Utilities
 *
 * Centralized error handling patterns to reduce code duplication.
 * Provides consistent error handling across service functions.
 */

/**
 * Standard service response type with success flag and optional error
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Wraps an async operation with try-catch and returns standardized result
 *
 * @param operation - Async function to execute
 * @returns ServiceResult with success flag and optional error message
 *
 * @example
 * ```ts
 * export async function addWallet(userId: string, address: string) {
 *   return wrapServiceCall(async () => {
 *     await addWalletToBundle(userId, address);
 *   });
 * }
 * ```
 */
export async function wrapServiceCall<T = void>(
  operation: () => Promise<T>
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Wraps an async operation that doesn't return data
 *
 * @param operation - Async function to execute
 * @returns ServiceResult with success flag and optional error message
 *
 * @example
 * ```ts
 * export async function removeWallet(userId: string, walletId: string) {
 *   return wrapServiceCallVoid(async () => {
 *     await removeWalletFromBundle(userId, walletId);
 *   });
 * }
 * ```
 */
export async function wrapServiceCallVoid(
  operation: () => Promise<void>
): Promise<ServiceResult> {
  try {
    await operation();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Extracts error message from unknown error type
 *
 * @param error - Error of unknown type
 * @returns Error message string
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error occurred";
}

/**
 * Creates a standardized error response
 *
 * @param message - Error message
 * @returns ServiceResult with error
 */
export function createErrorResult(message: string): ServiceResult {
  return {
    success: false,
    error: message,
  };
}

/**
 * Creates a standardized success response
 *
 * @param data - Optional data to include
 * @returns ServiceResult with success
 */
export function createSuccessResult<T>(data: T): ServiceResult<T>;
export function createSuccessResult(): ServiceResult<void>;
export function createSuccessResult<T>(data?: T): ServiceResult<T | void> {
  if (data === undefined) {
    return { success: true };
  }
  return {
    success: true,
    data,
  };
}
