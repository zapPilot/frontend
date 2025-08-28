/**
 * Base API Client
 * Foundation class for all service-specific clients
 */

// Re-export common types for convenience
export { APIError, NetworkError, TimeoutError } from "../api-client";

// Define RequestConfig locally since it's not exported from api-client
interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

export type { RequestConfig };

export interface ServiceConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ServiceErrorConfig {
  retryable: boolean;
  statusCodes: number[];
  errorTransform?: (error: Error) => string;
}

/**
 * Base client with service-specific configurations
 */
export abstract class BaseApiClient {
  protected config: Required<ServiceConfig>;

  constructor(config: ServiceConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      headers: {},
      ...config,
    };
  }

  /**
   * Make HTTP request with service-specific error handling
   */
  protected async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      body?: unknown;
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const {
      method = "GET",
      body,
      headers = {},
      timeout = this.config.timeout,
      retries = this.config.retries,
      params,
    } = options;

    // Build URL with query parameters
    const url = new URL(endpoint, this.config.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Prepare request configuration
    const requestConfig: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...this.config.headers,
        ...headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    if (body && method !== "GET") {
      requestConfig.body = JSON.stringify(body);
    }

    // Retry logic with exponential backoff
    let lastError: Error | undefined = undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url.toString(), requestConfig);

        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          const error = this.createServiceError(response.status, errorData);

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }

          lastError = error;
          if (attempt < retries) {
            await this.delay(this.config.retryDelay * Math.pow(2, attempt));
            continue;
          }
          throw error;
        }

        const data = await response.json();
        return this.transformResponse ? this.transformResponse<T>(data) : data;
      } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
          lastError = error;
          if (attempt < retries) {
            await this.delay(this.config.retryDelay * Math.pow(2, attempt));
            continue;
          }
          throw error;
        }

        // Re-throw known errors immediately
        if (error instanceof APIError) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError || new Error("Unknown error occurred");
  }

  /**
   * Service-specific error parsing (can be overridden)
   */
  protected async parseErrorResponse(response: Response): Promise<{
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  }> {
    try {
      const data = await response.json();
      return {
        message: data.message || data.error || `HTTP ${response.status}`,
        code: data.code || data.error_code,
        details: data.details || data,
      };
    } catch {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }

  /**
   * Create service-specific error (can be overridden)
   */
  protected createServiceError(
    status: number,
    errorData: Record<string, unknown>
  ): Error {
    return new APIError(
      (errorData["message"] as string) || "Unknown error",
      status,
      errorData["code"] as string,
      errorData["details"] as Record<string, unknown>
    );
  }

  /**
   * Transform response data (can be overridden by services)
   */
  protected transformResponse?<T>(data: unknown): T;

  /**
   * Delay helper for retries
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  protected async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    options: Omit<Parameters<typeof this.request>[1], "method" | "params"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
      params: params || {},
    });
  }

  protected async post<T>(
    endpoint: string,
    body?: unknown,
    options: Omit<Parameters<typeof this.request>[1], "method" | "body"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  protected async put<T>(
    endpoint: string,
    body?: unknown,
    options: Omit<Parameters<typeof this.request>[1], "method" | "body"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  protected async delete<T>(
    endpoint: string,
    options: Omit<Parameters<typeof this.request>[1], "method"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  protected async patch<T>(
    endpoint: string,
    body?: unknown,
    options: Omit<Parameters<typeof this.request>[1], "method" | "body"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }
}

// Import the APIError from the original client to maintain compatibility
import { APIError } from "../api-client";
