/**
 * Shared HTTP utilities for making API requests
 *
 * This module provides functional HTTP utilities extracted from APIClient
 * for direct use in service functions without the class-based wrapper.
 */

import { CACHE_WINDOW } from "@/config/cacheWindow";
import { queryClient } from "@/lib/queryClient";

// Internal types for HTTP utilities
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ResponseTransformer<T = unknown> = (data: unknown) => T;

// API endpoints configuration
export const API_ENDPOINTS = {
  analyticsEngine: process.env["NEXT_PUBLIC_ANALYTICS_ENGINE_URL"] || "",
  intentEngine: process.env["NEXT_PUBLIC_INTENT_ENGINE_URL"] || "",
  backendApi: process.env["NEXT_PUBLIC_API_URL"] || "",
  accountApi: process.env["NEXT_PUBLIC_ACCOUNT_API_URL"] || "",
  debank: process.env["NEXT_PUBLIC_DEBANK_API_URL"] || "",
} as const;

// Default configuration
// Updated for analytics endpoints: longer timeout, fewer retries to reduce cancelled request spam
export const HTTP_CONFIG = {
  timeout: 30000, // 30s for complex analytics queries (was 10s)
  retries: 1, // Only retry once to avoid request storms (was 3)
  retryDelay: 2000, // 2s delay before retry (was 1s)
} as const;

interface CacheHint {
  staleTimeMs: number;
  gcTimeMs: number;
}

interface ResponseLikeWithHeaders {
  headers?: { get?: (name: string) => string | null };
}

const DEFAULT_CACHE_HINT: CacheHint = {
  staleTimeMs: CACHE_WINDOW.staleTimeMs,
  gcTimeMs: CACHE_WINDOW.gcTimeMs,
};

let appliedCacheHint: CacheHint = DEFAULT_CACHE_HINT;

const parseDirectiveSeconds = (
  directive: string,
  key: string
): number | undefined => {
  if (!directive.startsWith(key)) {
    return undefined;
  }

  const parsed = Number(directive.slice(key.length));
  return Number.isFinite(parsed) ? parsed : undefined;
};

function parseCacheControlForHint(value?: string | null): CacheHint | null {
  if (!value) {
    return null;
  }

  const directives = value
    .toLowerCase()
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

  let maxAgeSeconds: number | undefined;
  let staleWhileRevalidateSeconds: number | undefined;

  for (const directive of directives) {
    if (maxAgeSeconds === undefined) {
      const parsedMaxAge =
        parseDirectiveSeconds(directive, "max-age=") ??
        parseDirectiveSeconds(directive, "s-maxage=");
      if (parsedMaxAge !== undefined) {
        maxAgeSeconds = parsedMaxAge;
        continue;
      }
    }

    if (staleWhileRevalidateSeconds === undefined) {
      const parsedStale = parseDirectiveSeconds(
        directive,
        "stale-while-revalidate="
      );
      if (parsedStale !== undefined) {
        staleWhileRevalidateSeconds = parsedStale;
      }
    }
  }

  if (maxAgeSeconds === undefined) {
    return null;
  }

  const staleTimeMs = maxAgeSeconds * 1000;
  const totalSeconds = maxAgeSeconds + (staleWhileRevalidateSeconds ?? 0);
  const gcTimeMs = totalSeconds > 0 ? totalSeconds * 1000 : staleTimeMs;

  return {
    staleTimeMs,
    gcTimeMs,
  };
}

function syncQueryCacheDefaultsFromHint(hint: CacheHint): void {
  if (
    appliedCacheHint.staleTimeMs === hint.staleTimeMs &&
    appliedCacheHint.gcTimeMs === hint.gcTimeMs
  ) {
    return;
  }

  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaults,
    queries: {
      ...(defaults.queries ?? {}),
      staleTime: hint.staleTimeMs,
      gcTime: hint.gcTimeMs,
    },
  });

  appliedCacheHint = hint;
}

// Error classes
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Network connection failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

// HTTP request configuration interface
interface HttpRequestConfig {
  method?: HTTPMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
  baseURL?: string;
}

// Error response parsing utility
async function parseErrorResponse(response: Response): Promise<{
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}> {
  try {
    const data = await response.json();
    return {
      message: data.message || data.error || `HTTP ${response.status}`,
      code: data.code,
      details: data.details || data,
    };
  } catch {
    return {
      message: `HTTP ${response.status}`,
    };
  }
}

// Retry logic helper
function shouldRetry(error: unknown): boolean {
  // Don't retry client errors (4xx) or specific API errors
  if (error instanceof APIError && error.status >= 400 && error.status < 500) {
    return false;
  }

  // Retry on network errors, timeouts, and 5xx errors
  return true;
}

// Delay helper for exponential backoff
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoffDelay(baseDelay: number, attempt: number): number {
  return baseDelay * Math.pow(2, attempt);
}

function createTimeoutController(
  timeout: number,
  externalSignal?: AbortSignal
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const cleanup = () => {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", handleExternalAbort);
    }
  };

  const handleExternalAbort = () => {
    controller.abort((externalSignal as AbortSignal).reason);
  };

  if (externalSignal) {
    externalSignal.addEventListener("abort", handleExternalAbort);
  }

  return { signal: controller.signal, cleanup };
}

function hasHeaders(value: unknown): value is ResponseLikeWithHeaders {
  return (
    typeof value === "object" &&
    value !== null &&
    "headers" in (value as Record<string, unknown>)
  );
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === "AbortError") ||
    (error instanceof DOMException && error.name === "AbortError")
  );
}

async function executeRequest<T>(
  url: string,
  requestInit: RequestInit,
  transformer?: ResponseTransformer<T>
): Promise<T> {
  const response = await fetch(url, requestInit);

  // Some test doubles provide a minimal Response-like object without headers.
  const cacheControlHeader = hasHeaders(response)
    ? ((response as Response).headers?.get?.("cache-control") ?? undefined)
    : undefined;

  const cacheHint = parseCacheControlForHint(cacheControlHeader);
  if (cacheHint) {
    syncQueryCacheDefaultsFromHint(cacheHint);
  }

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new APIError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.code,
      errorData.details
    );
  }

  const data = await response.json();
  return transformer ? transformer(data) : data;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const fallbackMessage =
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message?: string }).message
        : JSON.stringify(error);
    const constructed = new Error(fallbackMessage);
    if (typeof (error as { name?: unknown }).name === "string") {
      constructed.name = (error as { name?: string }).name ?? constructed.name;
    }
    return constructed;
  }

  return new Error(String(error));
}

function shouldAttemptRetry(
  attempt: number,
  retries: number,
  error: unknown
): boolean {
  if (attempt >= retries) {
    return false;
  }

  return shouldRetry(error);
}

/**
 * Core HTTP request function with retry logic and error handling
 */
export async function httpRequest<T = unknown>(
  url: string,
  config: HttpRequestConfig = {},
  transformer?: ResponseTransformer<T>
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    timeout = HTTP_CONFIG.timeout,
    retries = HTTP_CONFIG.retries,
    retryDelay = HTTP_CONFIG.retryDelay,
    signal,
  } = config;

  const requestConfig: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    requestConfig.body = JSON.stringify(body);
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { signal: composedSignal, cleanup } = createTimeoutController(
      timeout,
      signal
    );
    requestConfig.signal = composedSignal;

    try {
      const result = await executeRequest(url, requestConfig, transformer);
      cleanup();
      return result;
    } catch (error) {
      cleanup();
      const normalizedError = toError(error);

      if (normalizedError instanceof APIError) {
        throw normalizedError;
      }

      if (isAbortError(normalizedError)) {
        throw new TimeoutError();
      }

      lastError = normalizedError;

      if (!shouldAttemptRetry(attempt, retries, normalizedError)) {
        break;
      }

      await delay(calculateBackoffDelay(retryDelay, attempt));
    }
  }

  // If we get here, all retries failed
  throw new NetworkError(
    lastError ? lastError.message : "Network request failed"
  );
}

/**
 * Convenience function for GET requests
 */
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

/**
 * Service-specific HTTP utilities for different API endpoints
 */
type GetConfig = Omit<HttpRequestConfig, "method" | "body">;
type MutateConfig = Omit<HttpRequestConfig, "method">;

function withBaseURL<Config extends Record<string, unknown> | undefined>(
  baseURL: string,
  config: Config
): Record<string, unknown> {
  return {
    ...(config ?? {}),
    baseURL,
  };
}

function createServiceHttpClient(baseURL: string) {
  return {
    get: <T = unknown>(
      endpoint: string,
      config?: GetConfig,
      transformer?: ResponseTransformer<T>
    ) =>
      httpGet(endpoint, withBaseURL(baseURL, config) as GetConfig, transformer),

    post: <T = unknown>(
      endpoint: string,
      body?: unknown,
      config?: MutateConfig,
      transformer?: ResponseTransformer<T>
    ) =>
      httpPost(
        endpoint,
        body,
        withBaseURL(baseURL, config) as MutateConfig,
        transformer
      ),

    put: <T = unknown>(
      endpoint: string,
      body?: unknown,
      config?: MutateConfig,
      transformer?: ResponseTransformer<T>
    ) =>
      httpPut(
        endpoint,
        body,
        withBaseURL(baseURL, config) as MutateConfig,
        transformer
      ),

    patch: <T = unknown>(
      endpoint: string,
      body?: unknown,
      config?: MutateConfig,
      transformer?: ResponseTransformer<T>
    ) =>
      httpPatch(
        endpoint,
        body,
        withBaseURL(baseURL, config) as MutateConfig,
        transformer
      ),

    delete: <T = unknown>(
      endpoint: string,
      config?: GetConfig,
      transformer?: ResponseTransformer<T>
    ) =>
      httpDelete(
        endpoint,
        withBaseURL(baseURL, config) as GetConfig,
        transformer
      ),
  } as const;
}

export const httpUtils = {
  /**
   * Analytics Engine API utilities
   */
  analyticsEngine: createServiceHttpClient(API_ENDPOINTS.analyticsEngine),

  /**
   * Intent Engine API utilities
   */
  intentEngine: createServiceHttpClient(API_ENDPOINTS.intentEngine),

  /**
   * Backend API utilities
   */
  backendApi: createServiceHttpClient(API_ENDPOINTS.backendApi),

  /**
   * Account API utilities
   */
  accountApi: createServiceHttpClient(API_ENDPOINTS.accountApi),

  /**
   * DeBank API utilities
   */
  debank: createServiceHttpClient(API_ENDPOINTS.debank),
} as const;

/**
 * Common error handler function
 */
export function handleHTTPError(error: unknown): string {
  if (error instanceof APIError) {
    // Handle specific error codes
    switch (error.code) {
      case "USER_NOT_FOUND":
        return "User not found. Please connect your wallet first.";
      case "INVALID_ADDRESS":
        return "Invalid wallet address provided.";
      case "RATE_LIMITED":
        return "Too many requests. Please try again later.";
      default:
        return error.message;
    }
  }

  if (error instanceof NetworkError) {
    return "Network connection failed. Please check your internet connection.";
  }

  if (error instanceof TimeoutError) {
    return "Request timed out. Please try again.";
  }

  return "An unexpected error occurred. Please try again.";
}
