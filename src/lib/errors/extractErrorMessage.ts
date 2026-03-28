/**
 * Extract a human-readable message from an unknown error object.
 *
 * @param error - Error-like value to inspect
 * @param fallbackMessage - Message to return when no usable message exists
 * @returns Resolved error message string
 */
export function extractErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof Error) {
    return error.message;
  }

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
