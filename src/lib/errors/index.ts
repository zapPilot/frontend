/**
 * Error Handling Module
 *
 * Centralized error handling with type definitions, base classes, and factory functions.
 * @module lib/errors
 */

// ============================================================================
// NEW UNIFIED ERROR SYSTEM (Phase 7 - Error Handling Unification)
// ============================================================================

// Unified service error hierarchy (preferred for new code)
export {
  AccountServiceError,
  AnalyticsServiceError,
  BundleServiceError,
  IntentServiceError as IntentError,
  ServiceError,
} from "./ServiceError";

// Result type for explicit success/failure handling
export type { Result } from "./ServiceError";
export { Err, Ok, OkVoid } from "./ServiceError";

// ============================================================================
// EXISTING ERROR SYSTEM (backward compatibility)
// ============================================================================

// Export base error class
export { BaseServiceError } from "./BaseServiceError";

// Export service-specific error classes
export {
  createIntentServiceError,
  IntentServiceError,
} from "./IntentServiceError";

// Export factory utilities
export { resolveErrorMessage } from "./errorFactory";

// Export error handling utilities
export type { ServiceResult } from "./errorHandling";
export { wrapServiceCall } from "./errorHandling";
