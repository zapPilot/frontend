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
export type {
  ErrorContext,
  ErrorDetails,
  ErrorJSON,
  ErrorSeverity,
  UnknownErrorInput,
} from "./errors/errorContext";

export { BaseServiceError } from "./errors/BaseServiceError";
export { IntentServiceError, createIntentServiceError } from "./errors/IntentServiceError";

export {
  resolveErrorMessage,
  extractStatusCode,
  extractErrorCode,
  extractErrorDetails,
} from "./errors/errorFactory";
