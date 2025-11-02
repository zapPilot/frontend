/**
 * Base Error Classes and Utilities
 *
 * Provides standardized error handling patterns for the application.
 * Consolidates error creation patterns from BackendServiceError, IntentServiceError,
 * and other service-specific error classes.
 *
 * @module lib/base-error
 */

import { getBackendErrorMessage, getIntentErrorMessage } from "./errorMessages";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

type ErrorDetails = Record<string, unknown>;

/** Interface for JSON representation of errors */
interface ErrorJSON {
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
interface UnknownErrorInput {
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

interface ErrorContext {
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

type ErrorSeverity = "low" | "medium" | "high" | "critical";

// =============================================================================
// BASE ERROR CLASS
// =============================================================================

/**
 * Base error class with standardized properties and methods
 * Provides consistent error handling across all services
 */
export class BaseServiceError extends Error {
  public readonly timestamp: string;
  public readonly source?: string | undefined;
  public readonly status: number;
  public readonly code?: string | undefined;
  public readonly details?: ErrorDetails | undefined;
  public override readonly cause?: Error | undefined;
  public readonly severity: ErrorSeverity;

  public override name = "BaseServiceError";

  constructor(
    message: string,
    context: ErrorContext = {},
    severity: ErrorSeverity = "medium"
  ) {
    super(message);

    this.timestamp = context.timestamp || new Date().toISOString();
    this.source = context.source;
    this.status = context.status || 500;
    this.code = context.code;
    this.details = context.details;
    this.cause = context.cause;
    this.severity = severity;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BaseServiceError);
    }
  }

  /**
   * Convert error to JSON format for logging or API responses
   */
  toJSON(): ErrorJSON {
    const result: ErrorJSON = {
      name: this.name,
      message: this.message,
      timestamp: new Date(this.timestamp).getTime(),
      status: this.status,
      severity: this.severity,
    };

    if (this.source) result.source = this.source;
    if (this.code) result.code = this.code;
    if (this.details) result.details = this.details;
    if (this.stack) result.stack = this.stack;
    if (this.cause?.message) result.cause = this.cause.message;

    return result;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    // Override in subclasses for service-specific messages
    return this.message;
  }

  /**
   * Check if error is retryable based on status code
   */
  isRetryable(): boolean {
    // Network errors and server errors are typically retryable
    return this.status >= 500 || this.status === 429 || this.status === 408;
  }

  /**
   * Check if error is a client error
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}

// =============================================================================
// HELPER UTILITIES
// =============================================================================

const MESSAGE_CANDIDATE_KEYS = [
  "message",
  "error",
  "error_description",
  "detail",
  "title",
  "description",
  "reason",
] as const;

interface NormalizedMessageResult {
  value: string;
  found: boolean;
}

function normalizeErrorMessage(
  value: unknown,
  fallback: string,
  seen = new WeakSet<object>()
): NormalizedMessageResult {
  if (value === undefined || value === null) {
    return { value: fallback, found: false };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[object Object]") {
      return { value: fallback, found: false };
    }
    return { value: trimmed, found: true };
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return { value: String(value), found: true };
  }

  if (value instanceof Error) {
    const fromMessage = normalizeErrorMessage(value.message, fallback, seen);
    if (fromMessage.found) {
      return fromMessage;
    }

    if ("cause" in value && value.cause !== undefined) {
      const fromCause = normalizeErrorMessage(
        (value as { cause?: unknown }).cause,
        fallback,
        seen
      );
      if (fromCause.found) {
        return fromCause;
      }
    }

    return { value: fallback, found: false };
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return { value: fallback, found: false };
    }
    seen.add(value);

    for (const key of MESSAGE_CANDIDATE_KEYS) {
      if (
        Object.prototype.hasOwnProperty.call(value, key) &&
        (value as Record<string, unknown>)[key] !== undefined
      ) {
        const result = normalizeErrorMessage(
          (value as Record<string, unknown>)[key],
          fallback,
          seen
        );
        if (result.found) {
          return result;
        }
      }
    }

    try {
      return {
        value: JSON.stringify(value),
        found: true,
      };
    } catch {
      return { value: fallback, found: false };
    }
  }

  return { value: String(value), found: true };
}

function resolveErrorMessage(fallback: string, ...sources: unknown[]): string {
  for (const source of sources) {
    const { value, found } = normalizeErrorMessage(source, fallback);
    if (found) {
      return value;
    }
  }
  return fallback;
}

// =============================================================================
// SERVICE-SPECIFIC ERROR CLASSES
// =============================================================================

/**
 * Backend Service Error
 * Handles errors from backend operations like notifications and reports
 */
export class BackendServiceError extends BaseServiceError {
  constructor(
    message: string,
    status: number,
    code?: string,
    details?: ErrorDetails
  ) {
    const context: ErrorContext = {
      source: "backend-service",
      status,
    };
    if (code !== undefined) context.code = code;
    if (details !== undefined) context.details = details;

    super(message, context);
    this.name = "BackendServiceError";
  }

  override getUserMessage(): string {
    return getBackendErrorMessage(this.status, this.message);
  }
}

/**
 * Intent Service Error
 * Handles errors from intent execution and transaction processing
 */
export class IntentServiceError extends BaseServiceError {
  constructor(
    message: string,
    status: number,
    code?: string,
    details?: ErrorDetails
  ) {
    const context: ErrorContext = {
      source: "intent-service",
      status,
    };
    if (code !== undefined) context.code = code;
    if (details !== undefined) context.details = details;

    super(message, context);
    this.name = "IntentServiceError";
  }

  override getUserMessage(): string {
    return getIntentErrorMessage(this.status, this.message);
  }
}

// =============================================================================
// ERROR FACTORY FUNCTIONS
// =============================================================================

/**
 * Enhanced error messages for common intent engine errors
 */
export const createIntentServiceError = (
  error: unknown
): IntentServiceError => {
  const errorObj = error as UnknownErrorInput;
  const status = errorObj.status || errorObj.response?.status || 500;
  let message = resolveErrorMessage(
    "Intent service error",
    errorObj.message,
    errorObj.response?.data,
    errorObj.details,
    errorObj
  );
  const lowerMessage = message.toLowerCase();

  switch (status) {
    case 400:
      if (lowerMessage.includes("slippage")) {
        message = "Invalid slippage tolerance. Must be between 0.1% and 50%.";
      } else if (lowerMessage.includes("amount")) {
        message = "Invalid transaction amount. Please check your balance.";
      }
      break;
    case 429:
      message =
        "Too many transactions in progress. Please wait before submitting another.";
      break;
    case 503:
      message =
        "Intent engine is temporarily overloaded. Please try again in a moment.";
      break;
  }

  return new IntentServiceError(
    message,
    status,
    errorObj.code,
    errorObj.details
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

// All exports are already declared above with their definitions
