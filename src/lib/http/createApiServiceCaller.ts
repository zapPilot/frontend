/**
 * Compatibility wrapper for the consolidated service-caller factory.
 *
 * @returns The shared API service caller factory.
 *
 * @example
 * ```typescript
 * const callMyApi = createApiServiceCaller(
 *   { 400: "Invalid request", 404: "Not found" },
 *   "Service request failed"
 * );
 * ```
 */
export { createApiServiceCaller } from "./createServiceCaller";
