/**
 * Error utility functions for standardizing error handling across the application.
 */

/**
 * Extracts a human-readable message from an unknown error object.
 *
 * @param error - The error object to extract the message from
 * @param fallbackMessage - The message to return if the error object doesn't have a message
 * @returns A string containing the error message
 */
export function getErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof Error) {
    return error.message;
  }

  // Handle case where error might be a string or have a message property
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallbackMessage;
}
