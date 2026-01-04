/**
 * Unified Service Error Types
 * Single source of truth for service-level error handling
 *
 * @see Phase 7 - Error Handling Unification
 */

/**
 * Base service error class
 * All service errors inherit from this class
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

type ServiceErrorConstructorArgs = ConstructorParameters<typeof ServiceError>;

function createServiceErrorClass(name: string) {
  return class extends ServiceError {
    constructor(...args: ServiceErrorConstructorArgs) {
      super(...args);
      this.name = name;
    }
  };
}

/**
 * Account-specific service errors
 */
export class AccountServiceError extends createServiceErrorClass(
  "AccountServiceError"
) {}

/**
 * Analytics-specific service errors
 */
export class AnalyticsServiceError extends createServiceErrorClass(
  "AnalyticsServiceError"
) {}

/**
 * Intent-specific service errors (ZapIn, ZapOut, Optimize)
 */
export class IntentServiceError extends createServiceErrorClass(
  "IntentServiceError"
) {}

/**
 * Bundle-specific service errors
 */
export class BundleServiceError extends createServiceErrorClass(
  "BundleServiceError"
) {}

/**
 * Result type for operations requiring explicit success/failure handling
 * Inspired by Rust's Result<T, E> pattern
 *
 * @example
 * ```typescript
 * // Function returning explicit result
 * async function connectWallet(address: string): Promise<Result<UserProfile, AccountServiceError>> {
 *   try {
 *     const profile = await api.connect(address);
 *     return Ok(profile);
 *   } catch (error) {
 *     return Err(new AccountServiceError("Connection failed", 500));
 *   }
 * }
 *
 * // Usage with explicit error handling
 * const result = await connectWallet(address);
 * if (!result.success) {
 *   console.error(result.error.message, result.error.details);
 *   return;
 * }
 * // TypeScript knows result.data is UserProfile here
 * console.log(result.data.userId);
 * ```
 */
export interface Result<T = void, E = ServiceError> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Create a successful result with data
 *
 * @param data - The success value
 * @returns Result object with success=true and data
 */
export function Ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a successful result with no data (void)
 *
 * @returns Result object with success=true and no data
 */
export function OkVoid(): Result<void, never> {
  return { success: true };
}

/**
 * Create an error result
 *
 * @param error - The error that occurred
 * @returns Result object with success=false and error
 */
export function Err<E extends ServiceError>(error: E): Result<never, E> {
  return { success: false, error };
}
