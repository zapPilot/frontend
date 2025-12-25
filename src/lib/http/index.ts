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
export { httpGet, httpPost } from "./methods";

// Service clients
export { httpUtils } from "./service-clients";

// Error handling
export { handleHTTPError } from "./http-error-handler";
