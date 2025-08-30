/**
 * Base Error Classes and Utilities
 *
 * Provides standardized error handling patterns for the application.
 * Consolidates error creation patterns from BackendServiceError, IntentServiceError,
 * and other service-specific error classes.
 *
 * @module lib/base-error
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ErrorDetails {
  /** Additional error context data */
  [key: string]: any;
}

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

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

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
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp,
      source: this.source,
      status: this.status,
      code: this.code,
      details: this.details,
      severity: this.severity,
      stack: this.stack,
      cause: this.cause?.message,
    };
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
    switch (this.status) {
      case 400:
        if (this.message?.includes("email")) {
          return "Invalid email address format.";
        }
        if (this.message?.includes("webhook")) {
          return "Invalid Discord webhook configuration.";
        }
        return "Invalid request. Please check your input.";

      case 429:
        return "Too many notification requests. Please wait before sending more.";

      case 502:
        return "External notification service is temporarily unavailable.";

      case 503:
        return "Notification service is temporarily unavailable.";

      default:
        return this.message;
    }
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
    switch (this.status) {
      case 400:
        if (this.message?.includes("slippage")) {
          return "Invalid slippage tolerance. Must be between 0.1% and 50%.";
        }
        if (this.message?.includes("amount")) {
          return "Invalid transaction amount. Please check your balance.";
        }
        return "Invalid transaction parameters.";

      case 429:
        return "Too many transactions in progress. Please wait before submitting another.";

      case 503:
        return "Intent engine is temporarily overloaded. Please try again in a moment.";

      default:
        return this.message;
    }
  }
}

/**
 * Account Service Error
 * Handles errors from user account and wallet management operations
 */
export class AccountServiceError extends BaseServiceError {
  constructor(
    message: string,
    status: number,
    code?: string,
    details?: ErrorDetails
  ) {
    const context: ErrorContext = {
      source: "account-service",
      status,
    };
    if (code !== undefined) context.code = code;
    if (details !== undefined) context.details = details;

    super(message, context);
    this.name = "AccountServiceError";
  }

  override getUserMessage(): string {
    switch (this.status) {
      case 400:
        if (this.message?.includes("address")) {
          return "Invalid wallet address format. Address must be 42 characters long.";
        }
        if (this.message?.includes("main wallet")) {
          return "Cannot remove the main wallet from your bundle.";
        }
        return "Invalid request parameters.";

      case 404:
        return "User or wallet not found.";

      case 409:
        if (this.message?.includes("wallet")) {
          return "This wallet is already in your bundle.";
        }
        if (this.message?.includes("email")) {
          return "This email address is already in use.";
        }
        return "Resource already exists.";

      default:
        return this.message;
    }
  }
}

// =============================================================================
// ERROR FACTORY FUNCTIONS
// =============================================================================

/**
 * Create standardized error from unknown error type
 */
export function createServiceError(
  error: unknown,
  source: string,
  defaultMessage = "An unexpected error occurred"
): BaseServiceError {
  if (error instanceof BaseServiceError) {
    return error;
  }

  if (error instanceof Error) {
    return new BaseServiceError(error.message || defaultMessage, {
      source,
      cause: error,
      details: { originalError: error.constructor.name },
    });
  }

  // Handle string errors
  if (typeof error === "string") {
    return new BaseServiceError(error, { source });
  }

  // Handle objects with status/message properties
  if (typeof error === "object" && error !== null) {
    const errorObj = error as any;
    return new BaseServiceError(errorObj.message || defaultMessage, {
      source,
      status: errorObj.status || errorObj.response?.status || 500,
      code: errorObj.code,
      details: errorObj.details,
    });
  }

  // Fallback for completely unknown error types
  return new BaseServiceError(defaultMessage, {
    source,
    details: { originalError: String(error) },
  });
}

/**
 * Enhanced error messages for common backend errors
 */
export const createBackendServiceError = (error: any): BackendServiceError => {
  const status = error.status || error.response?.status || 500;
  let message = error.message || "Backend service error";

  switch (status) {
    case 400:
      if (message?.includes("email")) {
        message = "Invalid email address format.";
      } else if (message?.includes("webhook")) {
        message = "Invalid Discord webhook configuration.";
      }
      break;
    case 429:
      message =
        "Too many notification requests. Please wait before sending more.";
      break;
    case 502:
      message = "External notification service is temporarily unavailable.";
      break;
  }

  return new BackendServiceError(message, status, error.code, error.details);
};

/**
 * Enhanced error messages for common intent engine errors
 */
export const createIntentServiceError = (error: any): IntentServiceError => {
  const status = error.status || error.response?.status || 500;
  let message = error.message || "Intent service error";

  switch (status) {
    case 400:
      if (message?.includes("slippage")) {
        message = "Invalid slippage tolerance. Must be between 0.1% and 50%.";
      } else if (message?.includes("amount")) {
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

  return new IntentServiceError(message, status, error.code, error.details);
};

// =============================================================================
// HTTP ERROR UTILITIES
// =============================================================================

/**
 * Handle HTTP errors with consistent error creation
 */
export function handleHTTPError(
  error: unknown,
  source = "http-client"
): BaseServiceError {
  return createServiceError(error, source, "Network request failed");
}

/**
 * Check if error is a network/connectivity issue
 */
export function isNetworkError(error: BaseServiceError): boolean {
  return (
    error.status === 0 || // Network unreachable
    error.status === 408 || // Request timeout
    error.status === 429 || // Rate limited
    error.status >= 500 || // Server errors
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("connection") ||
    error.message.toLowerCase().includes("timeout")
  );
}

/**
 * Get retry delay for error (exponential backoff)
 */
export function getRetryDelay(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

// =============================================================================
// EXPORTS
// =============================================================================

// All exports are already declared above with their definitions
