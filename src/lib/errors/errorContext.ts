/**
 * Error Context Types and Interfaces
 *
 * Type definitions for error handling across the application.
 * @module lib/errors/errorContext
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Additional details for error context */
export type ErrorDetails = Record<string, unknown>;

/** Severity levels for error classification */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

// =============================================================================
// INTERFACES
// =============================================================================

/** Interface for JSON representation of errors */
export interface ErrorJSON {
  name: string;
  message: string;
  timestamp: number;
  source?: string;
  status: number;
  code?: string;
  details?: ErrorDetails;
  severity: string;
  stack?: string;
  cause?: string;
  [key: string]: unknown;
}

/** Interface for unknown error objects from external sources */
export interface UnknownErrorInput {
  message?: unknown;
  status?: number;
  code?: string;
  details?: ErrorDetails;
  response?: {
    status?: number;
    data?: unknown;
  };
  stack?: string;
  name?: string;
  [key: string]: unknown;
}

/** Context information for error creation */
export interface ErrorContext {
  /** Service or module where error occurred */
  source?: string | undefined;
  /** HTTP status code (if applicable) */
  status?: number;
  /** Error code for programmatic handling */
  code?: string | undefined;
  /** Additional error details */
  details?: ErrorDetails | undefined;
  /** Original error that caused this error */
  cause?: Error | undefined;
  /** Timestamp when error occurred */
  timestamp?: string;
}
