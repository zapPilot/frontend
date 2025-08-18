/**
 * Unified API client with consistent error handling, retries, and caching
 */

import { QueryClient } from "@tanstack/react-query";

// Base API configuration
const API_CONFIG = {
  baseURL: process.env["NEXT_PUBLIC_QUANT_ENGINE_URL"] || "",
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
} as const;

// Standard API error types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Network connection failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

// Request configuration interface
interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

// Response transformer type
type ResponseTransformer<T = any> = (data: any) => T;

/**
 * Core API client class
 */
class APIClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;

  constructor(config: typeof API_CONFIG) {
    this.baseURL = config.baseURL;
    this.defaultTimeout = config.timeout;
    this.defaultRetries = config.retries;
    this.defaultRetryDelay = config.retryDelay;
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async makeRequest<T = any>(
    endpoint: string,
    config: RequestConfig = {},
    transformer?: ResponseTransformer<T>
  ): Promise<T> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      signal,
    } = config;

    const url = `${this.baseURL}${endpoint}`;

    // Create abort controller for timeout if no signal provided
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestSignal = signal || controller.signal;

    const requestConfig: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: requestSignal,
    };

    if (body && method !== "GET") {
      requestConfig.body = JSON.stringify(body);
    }

    let lastError: Error | undefined = undefined;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw new APIError(
            errorData.message || `HTTP ${response.status}`,
            response.status,
            errorData.code,
            errorData.details
          );
        }

        // Parse and transform response
        const data = await response.json();
        return transformer ? transformer(data) : data;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof APIError) {
          throw error; // Don't retry API errors
        }

        if (error instanceof Error && error.name === "AbortError") {
          throw new TimeoutError();
        }

        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on network errors and timeouts
        if (attempt < retries && this.shouldRetry(error)) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }

        break;
      }
    }

    // If we get here, all retries failed
    throw new NetworkError(
      lastError ? lastError.message : "Network request failed"
    );
  }

  /**
   * Parse error response body
   */
  private async parseErrorResponse(response: Response): Promise<{
    message: string;
    code?: string;
    details?: any;
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

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    // Don't retry client errors (4xx) or specific API errors
    if (
      error instanceof APIError &&
      error.status >= 400 &&
      error.status < 500
    ) {
      return false;
    }

    // Retry on network errors, timeouts, and 5xx errors
    return true;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  async get<T = any>(
    endpoint: string,
    config?: Omit<RequestConfig, "method" | "body">,
    transformer?: ResponseTransformer<T>
  ): Promise<T> {
    return this.makeRequest(
      endpoint,
      { ...config, method: "GET" },
      transformer
    );
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, "method">,
    transformer?: ResponseTransformer<T>
  ): Promise<T> {
    return this.makeRequest(
      endpoint,
      { ...config, method: "POST", body },
      transformer
    );
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, "method">,
    transformer?: ResponseTransformer<T>
  ): Promise<T> {
    return this.makeRequest(
      endpoint,
      { ...config, method: "PUT", body },
      transformer
    );
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, "method">,
    transformer?: ResponseTransformer<T>
  ): Promise<T> {
    return this.makeRequest(
      endpoint,
      { ...config, method: "PATCH", body },
      transformer
    );
  }

  async delete<T = any>(
    endpoint: string,
    config?: Omit<RequestConfig, "method" | "body">,
    transformer?: ResponseTransformer<T>
  ): Promise<T> {
    return this.makeRequest(
      endpoint,
      { ...config, method: "DELETE" },
      transformer
    );
  }
}

// Create singleton instance
export const apiClient = new APIClient(API_CONFIG);

// Query client configuration with error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry API errors (they're usually permanent)
        if (error instanceof APIError) {
          return false;
        }
        // Retry network errors up to 3 times
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Generally don't retry mutations
        if (error instanceof APIError) {
          return false;
        }
        // Only retry network errors once
        return failureCount < 1;
      },
    },
  },
});

// Helper function to create query keys with standardized structure
export const createQueryKey = (
  domain: string,
  params?: Record<string, any>
) => {
  const key: (string | Record<string, any>)[] = [domain];
  if (params) {
    key.push(params);
  }
  return key;
};

// Helper to handle common error scenarios
export const handleAPIError = (error: unknown): string => {
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
};
