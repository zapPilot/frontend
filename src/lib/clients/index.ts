/**
 * Service-Specific API Clients
 * DEPRECATED: Client classes have been migrated to service functions in src/services/
 *
 * This file maintains only the base client and DeBank client (external service)
 * All other API operations should use service functions instead
 */

// Base client and common types
export {
  APIError,
  BaseApiClient,
  NetworkError,
  TimeoutError,
} from "./base-client";
export type { ServiceConfig, ServiceErrorConfig } from "./base-client";

// DeBank API Client (External DeFi Data) - Keeping this as it's an external service
export {
  DebankApiClient,
  debankApiClient,
  DebankApiError,
} from "./debank-api-client";
export type {
  DebankPortfolioItem,
  DebankProtocolPosition,
  DebankTokenBalance,
} from "./debank-api-client";

// Import client instances for backward compatibility
import { debankApiClient, DebankApiError } from "./debank-api-client";

/**
 * Configuration for service functions (moved from client configs)
 */
export const SERVICE_CONFIG = {
  ACCOUNT_API: {
    baseURL:
      process.env["NEXT_PUBLIC_ACCOUNT_API_URL"] || "http://127.0.0.1:3004",
    timeout: 8000,
    retries: 2,
  },
  INTENT_ENGINE: {
    baseURL:
      process.env["NEXT_PUBLIC_INTENT_ENGINE_URL"] || "http://127.0.0.1:3002",
    timeout: 30000,
    retries: 1,
  },
  ANALYTICS_ENGINE: {
    baseURL:
      process.env["NEXT_PUBLIC_QUANT_ENGINE_URL"] || "http://localhost:8001",
    timeout: 15000,
    retries: 2,
  },
  BACKEND_API: {
    baseURL: process.env["NEXT_PUBLIC_API_URL"] || "http://127.0.0.1:3001",
    timeout: 12000,
    retries: 3,
  },
  DEBANK_API: {
    baseURL:
      process.env["NEXT_PUBLIC_DEBANK_API_URL"] ||
      "https://pro-openapi.debank.com",
    timeout: 10000,
    retries: 3,
  },
} as const;

/**
 * Remaining client instances (only external services)
 */
export const createClientInstances = () => {
  return {
    debank: debankApiClient,
  };
};

/**
 * Health check for remaining client services
 */
export const checkAllServicesHealth = async () => {
  const results: Record<string, { status: string; error?: string }> = {};

  // DeBank API doesn't have a health check endpoint, so we'll just mark it as available
  results["debank"] = { status: "available" };

  return results;
};

/**
 * Type-safe client selector (only for remaining clients)
 */
export type ClientType = "debank";

export const getClient = (type: ClientType) => {
  const clients = createClientInstances();
  return clients[type];
};

/**
 * Error type guards for remaining clients
 */
export const isDebankApiError = (error: unknown) => {
  return error instanceof DebankApiError;
};
