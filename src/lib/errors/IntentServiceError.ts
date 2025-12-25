/**
 * Intent Service Error Class
 *
 * Specialized error class for intent execution and transaction processing.
 * @module lib/errors/IntentServiceError
 */

import { getIntentErrorMessage } from "@/lib/errors/errorMessages";

import { BaseServiceError } from "./BaseServiceError";
import type {
  ErrorContext,
  ErrorDetails,
  UnknownErrorInput,
} from "./errorContext";
import { resolveErrorMessage } from "./errorFactory";

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

/**
 * Enhanced error messages for common intent engine errors
 */
export function createIntentServiceError(error: unknown): IntentServiceError {
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
}
