/**
 * Error Handling Module
 *
 * Centralized error handling with unified error hierarchy and helper utilities.
 * @module lib/errors
 */

// ============================================================================
// UNIFIED ERROR SYSTEM
// ============================================================================

// Service error classes
export {
    AccountServiceError,
    AnalyticsServiceError,
    BundleServiceError,
    IntentServiceError,
    ServiceError
} from "./ServiceError";

// Result type for explicit success/failure handling
export type { Result } from "./ServiceError";

// ============================================================================
// ERROR UTILITIES
// ============================================================================

// Error helper functions (classification and factory)
export {
    createAccountServiceError,
    createAnalyticsServiceError,
    createBundleServiceError,
    createIntentServiceError,
    extractErrorCode,
    extractStatusCode,
    isClientError,
    isRetryableError,
    isServerError
} from "./errorHelpers";

// Legacy factory utilities (still used in some places)
export { resolveErrorMessage } from "./errorFactory";

// Error handling utilities
export { wrapServiceCall } from "./errorHandling";
export type { ServiceResult } from "./errorHandling";

