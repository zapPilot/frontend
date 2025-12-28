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

// --- Factory Functions ---

type QueryFunction = <T = unknown>(
  endpoint: string,
  config?: Omit<HttpRequestConfig, "method" | "body">,
  transformer?: ResponseTransformer<T>
) => Promise<T>;

type MutationFunction = <T = unknown>(
  endpoint: string,
  body?: unknown,
  config?: Omit<HttpRequestConfig, "method">,
  transformer?: ResponseTransformer<T>
) => Promise<T>;

const createQuery =
  (method: "GET" | "DELETE"): QueryFunction =>
  (endpoint, config = {}, transformer) =>
    requestWithMethod(method, endpoint, config, transformer);

const createMutation =
  (method: HttpRequestConfig["method"]): MutationFunction =>
  (endpoint, body, config = {}, transformer) =>
    requestWithMethod(method, endpoint, config, transformer, body);

// --- Exported Methods ---

export const httpGet = createQuery("GET");
export const httpDelete = createQuery("DELETE");

export const httpPost = createMutation("POST");
export const httpPut = createMutation("PUT");
export const httpPatch = createMutation("PATCH");
