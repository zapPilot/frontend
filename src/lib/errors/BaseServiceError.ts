/**
 * Base Service Error Class
 *
 * Core error class with standardized properties and methods for service errors.
 * @module lib/errors/BaseServiceError
 */

import type {
  ErrorContext,
  ErrorDetails,
  ErrorJSON,
  ErrorSeverity,
} from "./errorContext";

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
