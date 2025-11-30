/**
 * Base Error Classes and Utilities
 *
 * Provides standardized error handling patterns for the application.
 * This file now re-exports from the modular error handling system.
 *
 * @deprecated Import from @/lib/errors instead
 * @module lib/base-error
 */

// Re-export everything from the new modular structure
export { BaseServiceError } from "./errors/BaseServiceError";
export type {
  ErrorContext,
  ErrorDetails,
  ErrorJSON,
  ErrorSeverity,
  UnknownErrorInput,
} from "./errors/errorContext";
export {
  extractErrorCode,
  extractErrorDetails,
  extractStatusCode,
  resolveErrorMessage,
} from "./errors/errorFactory";
export { createIntentServiceError,IntentServiceError } from "./errors/IntentServiceError";
