/**
 * HTTP Utilities - Barrel Export
 * Maintains backward compatibility with original http-utils.ts API
 */

// Configuration
export type {
  HTTPMethod,
  HttpRequestConfig,
  ResponseTransformer,
} from "./config";
export { API_ENDPOINTS, HTTP_CONFIG } from "./config";

// Errors
export {
  APIError,
  NetworkError,
  parseErrorResponse,
  TimeoutError,
  toError,
} from "./errors";

// Core request
export { httpRequest } from "./request";

// HTTP methods
export { httpDelete,httpGet, httpPatch, httpPost, httpPut } from "./methods";

// Service clients
export { httpUtils } from "./service-clients";

// Error handling
export { handleHTTPError } from "./http-error-handler";

// Cache control (internal utilities - exposed for testing)
export type { CacheHint, ResponseLikeWithHeaders } from "./cache-control";
export {
  hasHeaders,
  parseCacheControlForHint,
  syncQueryCacheDefaultsFromHint,
} from "./cache-control";

// Abort control (internal utilities - exposed for testing)
export { createTimeoutController, isAbortError } from "./abort-control";

// Retry logic (internal utilities - exposed for testing)
export {
  calculateBackoffDelay,
  delay,
  shouldAttemptRetry,
  shouldRetry,
} from "./retry";
