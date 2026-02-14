/**
 * Combined factory for creating API service callers with error mapping.
 *
 * Eliminates the repeated boilerplate of wiring `createErrorMapper` → `createServiceCaller`
 * with the identical `APIError` factory lambda used across all service files.
 *
 * @param statusMessages - Map of HTTP status codes to user-friendly error messages
 * @param defaultMessage - Fallback message when no status-specific message matches
 * @returns A service caller function that wraps async calls with error handling
 *
 * @example
 * ```typescript
 * const callMyApi = createApiServiceCaller(
 *   { 400: "Invalid request", 404: "Not found" },
 *   "Service request failed"
 * );
 *
 * export async function fetchData(): Promise<Data> {
 *   return callMyApi(() => httpUtils.analyticsEngine.get("/api/data"));
 * }
 * ```
 */
import { APIError } from "@/lib/http";
import { createErrorMapper } from "@/lib/http/createErrorMapper";
import { createServiceCaller } from "@/lib/http/createServiceCaller";

export function createApiServiceCaller(
  statusMessages: Record<number, string>,
  defaultMessage: string
) {
  return createServiceCaller(
    createErrorMapper(
      (message, status, code, details) =>
        new APIError(message, status, code, details),
      statusMessages,
      defaultMessage
    )
  );
}
