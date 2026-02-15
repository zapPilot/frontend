import { ServiceError } from "../errors/ServiceError";

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  message?: string;
  status?: number;
  response?: {
    status?: number;
  };
}

/**
 * Type guard for API error responses
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return error !== null && typeof error === "object";
}

/**
 * Function type for enhancing error messages based on status codes
 */
export type MessageEnhancer = (status: number, message: string) => string;

function resolveStatus(apiError: ApiErrorResponse | undefined): number {
  return apiError?.status || apiError?.response?.status || 500;
}

function resolveBaseMessage(
  apiError: ApiErrorResponse | undefined,
  defaultMessage: string
): string {
  return apiError?.message || defaultMessage;
}

function resolveMessage(
  status: number,
  baseMessage: string,
  enhanceMessage: MessageEnhancer | undefined
): string {
  if (!enhanceMessage) {
    return baseMessage;
  }

  return enhanceMessage(status, baseMessage);
}

function getErrorData(error: unknown): Record<string, unknown> {
  if (error && typeof error === "object") {
    return error as Record<string, unknown>;
  }

  return {};
}

/**
 * Creates a service-specific error from an unknown error, handling standard API error extraction
 * and message enhancement.
 *
 * @param error - The raw error to process
 * @param ErrorClass - The ServiceError class to instantiate
 * @param defaultMessage - The message to use if no message is found in the error
 * @param enhanceMessage - Optional function to provide service-specific message enhancements
 */
export function createServiceError<T extends typeof ServiceError>(
  error: unknown,
  ErrorClass: T,
  defaultMessage: string,
  enhanceMessage?: MessageEnhancer
): InstanceType<T> {
  const apiError = isApiErrorResponse(error) ? error : undefined;
  const status = resolveStatus(apiError);
  const baseMessage = resolveBaseMessage(apiError, defaultMessage);
  const message = resolveMessage(status, baseMessage, enhanceMessage);
  const errorData = getErrorData(error);

  return new ErrorClass(
    message,
    status,
    errorData["code"] as string,
    errorData["details"] as Record<string, unknown>
  ) as InstanceType<T>;
}
