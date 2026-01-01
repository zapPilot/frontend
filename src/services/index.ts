/**
 * Service Exports
 * @see Phase 9 - Mock Service Clarity
 */

// ============================================================================
// MOCK SERVICES (Development/Testing Only)
// ============================================================================

// New explicit mock exports (preferred)
export * as chainServiceMock from "./chainService.mock";
export * as transactionServiceMock from "./transactionService.mock";

// ============================================================================
// BACKWARD COMPATIBILITY (Deprecated)
// ============================================================================

/**
 * @deprecated Use transactionServiceMock instead
 * ⚠️ WARNING: This is a MOCK service - simulated data only
 * This re-export will be removed in v2.0.0
 */
export * as transactionService from "./transactionService.mock";

/**
 * @deprecated Use chainServiceMock instead
 * ⚠️ WARNING: This is a MOCK service - simulated data only
 * This re-export will be removed in v2.0.0
 */
export * as chainService from "./chainService.mock";
