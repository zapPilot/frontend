import { getIntentErrorMessage } from "@/lib/errors/errorMessages";

import { resolveErrorMessage } from "./errorFactory";
import { IntentServiceError, type ServiceError } from "./ServiceError";

interface ErrorWithStatus {
  status?: number;
}

interface ErrorWithCode {
  code?: string;
}

interface ErrorContextSource {
  message?: string;
  response?: { data?: unknown; status?: unknown };
  details?: Record<string, unknown>;
}

interface ErrorContext {
  status: number;
  code: string | undefined;
  errorObj: ErrorContextSource;
  message: string;
}

/**
 * Check if error is a client error (4xx status code)
 *
 * @param error - Error object to check
 * @returns True if error has 4xx status code
 */
export function isClientError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return typeof status === "number" && status >= 400 && status < 500;
}

/**
 * Check if error is a server error (5xx status code)
 *
 * @param error - Error object to check
 * @returns True if error has 5xx status code
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return typeof status === "number" && status >= 500;
}

/**
 * Check if error is retryable based on status code
 *
 * @param error - Error object to check
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return (
    typeof status === "number" &&
    (status >= 500 || status === 429 || status === 408)
  );
}

/**
 * Type guard to check if error is a ServiceError instance
 *
 * @param error - Error to check
 * @returns True if error is ServiceError
 */
function isServiceError(error: unknown): error is ServiceError {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof (error as ServiceError).status === "number"
  );
}

function getErrorStatus(error: unknown): number | undefined {
  if (isServiceError(error)) {
    return error.status;
  }

  if (error && typeof error === "object" && "status" in error) {
    const status = (error as ErrorWithStatus).status;
    if (typeof status === "number") return status;
  }

  return undefined;
}

function getResponseStatus(error: unknown): number | undefined {
  const responseStatus = (error as ErrorContextSource)?.response?.status;
  return typeof responseStatus === "number" ? responseStatus : undefined;
}

/**
 * Extract status code from any error type
 *
 * @param error - Error object
 * @returns Status code or 500 as default
 */
export function extractStatusCode(error: unknown): number {
  const directStatus = getErrorStatus(error);
  if (typeof directStatus === "number") return directStatus;

  const responseStatus = getResponseStatus(error);
  if (typeof responseStatus === "number") return responseStatus;

  return 500;
}

/**
 * Extract error code from any error type
 *
 * @param error - Error object
 * @returns Error code or undefined
 */
export function extractErrorCode(error: unknown): string | undefined {
  if (isServiceError(error)) {
    return error.code;
  }

  if (error && typeof error === "object" && "code" in error) {
    const code = (error as ErrorWithCode).code;
    if (typeof code === "string") return code;
  }

  return undefined;
}

function buildErrorContext(
  error: unknown,
  fallbackMessage: string
): ErrorContext {
  const status = extractStatusCode(error);
  const code = extractErrorCode(error);
  const errorObj = error as ErrorContextSource;

  const message = resolveErrorMessage(
    fallbackMessage,
    errorObj.message,
    errorObj.response?.data,
    errorObj.details,
    errorObj
  );

  return { status, code, errorObj, message };
}

function resolveIntentMessage(status: number, message: string): string {
  if (status === 400) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("slippage")) {
      return "Invalid slippage tolerance. Must be between 0.1% and 50%.";
    }
    if (lowerMessage.includes("amount")) {
      return "Invalid transaction amount. Please check your balance.";
    }

    return message;
  }

  if (status === 429) {
    return "Too many transactions in progress. Please wait before submitting another.";
  }

  if (status === 503) {
    return "Intent engine is temporarily overloaded. Please try again in a moment.";
  }

  return message;
}

/**
 * Enhanced error messages for common intent engine errors
 *
 * @param error - Raw error from intent service
 * @returns Formatted IntentServiceError
 */
export function createIntentServiceError(error: unknown): IntentServiceError {
  const {
    status,
    code,
    errorObj,
    message: fallbackMessage,
  } = buildErrorContext(error, "Intent service error");
  const message = resolveIntentMessage(status, fallbackMessage);
  const userMessage = getIntentErrorMessage(status, message);

  return new IntentServiceError(
    userMessage,
    status,
    code,
    errorObj.details as Record<string, unknown> | undefined
  );
}
