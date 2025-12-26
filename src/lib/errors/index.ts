/**
 * Error Handling Module
 *
 * Centralized error handling with type definitions, base classes, and factory functions.
 * @module lib/errors
 */

// Export base error class
export { BaseServiceError } from "./BaseServiceError";

// Export service-specific error classes
export {
  createIntentServiceError,
  IntentServiceError,
} from "./IntentServiceError";

// Export factory utilities
export {
  resolveErrorMessage,
} from "./errorFactory";
