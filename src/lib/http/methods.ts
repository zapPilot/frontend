/**
 * HTTP Method Wrappers
 * Convenience functions for GET, POST, PUT, PATCH, DELETE requests
 */

import type { HttpRequestConfig, ResponseTransformer } from "./config";
import { httpRequest } from "./request";

function buildUrl(endpoint: string, baseURL?: string) {
  return baseURL ? `${baseURL}${endpoint}` : endpoint;
}

function requestWithMethod<T>(
  method: HttpRequestConfig["method"],
  endpoint: string,
  config: Partial<HttpRequestConfig>,
  transformer?: ResponseTransformer<T>,
  body?: unknown
) {
  const url = buildUrl(endpoint, config.baseURL);
  const requestConfig: HttpRequestConfig = {
    ...config,
    method,
  } as HttpRequestConfig;

  if (body !== undefined) {
    requestConfig.body = body;
  }

  return httpRequest(url, requestConfig, transformer);
}

export function httpGet<T = unknown>(
  endpoint: string,
  config: Omit<HttpRequestConfig, "method" | "body"> = {},
  transformer?: ResponseTransformer<T>
): Promise<T> {
  return requestWithMethod("GET", endpoint, config, transformer);
}

/**
 * Convenience function for POST requests
 */
export function httpPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  config: Omit<HttpRequestConfig, "method"> = {},
  transformer?: ResponseTransformer<T>
): Promise<T> {
  return requestWithMethod("POST", endpoint, config, transformer, body);
}

/**
 * Convenience function for PUT requests
 */
export function httpPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  config: Omit<HttpRequestConfig, "method"> = {},
  transformer?: ResponseTransformer<T>
): Promise<T> {
  return requestWithMethod("PUT", endpoint, config, transformer, body);
}

/**
 * Convenience function for PATCH requests
 */
export function httpPatch<T = unknown>(
  endpoint: string,
  body?: unknown,
  config: Omit<HttpRequestConfig, "method"> = {},
  transformer?: ResponseTransformer<T>
): Promise<T> {
  return requestWithMethod("PATCH", endpoint, config, transformer, body);
}

/**
 * Convenience function for DELETE requests
 */
export function httpDelete<T = unknown>(
  endpoint: string,
  config: Omit<HttpRequestConfig, "method" | "body"> = {},
  transformer?: ResponseTransformer<T>
): Promise<T> {
  return requestWithMethod("DELETE", endpoint, config, transformer);
}
