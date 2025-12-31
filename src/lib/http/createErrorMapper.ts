/**
 * Creates a reusable error mapping function that transforms API errors
 * into typed service errors with enhanced status code messages.
 *
 * @template TError - The error type to create (must extend Error)
 * @param errorFactory - Function that creates the error instance
 * @param statusMessages - Map of HTTP status codes to custom error messages
 * @param defaultMessage - Default message when status code doesn't have a custom message
 * @returns Error mapper function that transforms unknown errors into typed errors
 *
 * @example
 * ```typescript
 * const createServiceError = createErrorMapper(
 *   (message, status, code, details) => new APIError(message, status, code, details),
 *   {
 *     400: "Invalid request parameters",
 *     404: "Resource not found",
 *     500: "Internal server error"
 *   },
 *   "Service request failed"
 * );
 *
 * const callServiceApi = createServiceCaller(createServiceError);
 * ```
 */
export function createErrorMapper<TError extends Error>(
  errorFactory: (
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>
  ) => TError,
  statusMessages: Record<number, string>,
  defaultMessage: string
): (error: unknown) => TError {
  return (error: unknown): TError => {
    // Parse error object safely
    const apiError =
      error && typeof error === "object"
        ? (error as Record<string, unknown>)
        : {};

    // Extract status code from various possible locations
    const status =
      (apiError["status"] as number | undefined) ||
      ((apiError["response"] as Record<string, unknown> | undefined)?.[
        "status"
      ] as number | undefined) ||
      500;

    // Use custom message for status code or fall back to default
    const baseMessage =
      statusMessages[status] ||
      (apiError["message"] as string | undefined) ||
      defaultMessage;

    // Extract error code if available
    const code = apiError["code"] as string | undefined;

    // Extract details if available (pass entire error object as details)
    const details = apiError["details"] as Record<string, unknown> | undefined;

    // Create and return typed error
    return errorFactory(baseMessage, status, code, details);
  };
}
