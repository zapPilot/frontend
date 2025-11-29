/**
 * Error Handling Module
 *
 * Centralized error handling with type definitions, base classes, and factory functions.
 * @module lib/errors
 */

// Export type definitions
export type {
  ErrorContext,
  ErrorDetails,
  ErrorJSON,
  ErrorSeverity,
  UnknownErrorInput,
} from "./errorContext";

// Export base error class
export { BaseServiceError } from "./BaseServiceError";

// Export service-specific error classes
export { IntentServiceError, createIntentServiceError } from "./IntentServiceError";

// Export factory utilities
export {
  resolveErrorMessage,
  extractStatusCode,
  extractErrorCode,
  extractErrorDetails,
} from "./errorFactory";
