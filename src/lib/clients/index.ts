/**
 * Service-Specific API Clients
 * Centralized exports for all API clients
 */
// Base client and common types
export {
  APIError,
  BaseApiClient,
  NetworkError,
  TimeoutError,
} from "./base-client";
export type { ServiceConfig, ServiceErrorConfig } from "./base-client";

// Account API Client (User & Wallet Management - Port 3004)
export {
  AccountApiClient,
  accountApiClient,
  AccountApiError,
} from "./account-api-client";

// Intent Engine Client (Transaction Execution - Port 3002)
export {
  IntentEngineClient,
  intentEngineClient,
  IntentEngineError,
} from "./intent-engine-client";
export type {
  ExecutionIntent,
  ExecutionResult,
  IntentStatus,
} from "./intent-engine-client";

// Analytics Engine Client (Portfolio Analysis - Port 8001)
export {
  AnalyticsEngineClient,
  analyticsEngineClient,
  AnalyticsEngineError,
} from "./analytics-engine-client";
export type {
  PoolPerformance,
  PortfolioSummary,
  RebalanceRecommendations,
} from "./analytics-engine-client";

// Backend API Client (Notifications & Reporting - Port 3001)
export {
  BackendApiClient,
  backendApiClient,
  BackendApiError,
} from "./backend-api-client";
export type {
  DiscordAlert,
  EmailReport,
  NotificationSettings,
} from "./backend-api-client";

// DeBank API Client (External DeFi Data)
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

// Import client instances and error classes for internal use
import { accountApiClient, AccountApiError } from "./account-api-client";
import {
  analyticsEngineClient,
  AnalyticsEngineError,
} from "./analytics-engine-client";
import { backendApiClient, BackendApiError } from "./backend-api-client";
import { debankApiClient, DebankApiError } from "./debank-api-client";
import { intentEngineClient, IntentEngineError } from "./intent-engine-client";

/**
 * Client Configuration
 * Environment-based client configurations
 */
export const CLIENT_CONFIG = {
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
 * Utility functions for client management
 */
export const createClientInstances = () => {
  return {
    account: accountApiClient,
    intent: intentEngineClient,
    analytics: analyticsEngineClient,
    backend: backendApiClient,
    debank: debankApiClient,
  };
};

/**
 * Health check all services
 */
export const checkAllServicesHealth = async () => {
  const clients = createClientInstances();
  const results: Record<string, { status: string; error?: string }> = {};

  await Promise.allSettled([
    clients.account.healthCheck().then(
      (result: any) => (results["account"] = { status: result.status }),
      (error: any) =>
        (results["account"] = { status: "error", error: error.message })
    ),
    clients.intent.healthCheck().then(
      (result: any) => (results["intent"] = { status: result.status }),
      (error: any) =>
        (results["intent"] = { status: "error", error: error.message })
    ),
    clients.analytics.healthCheck().then(
      (result: any) => (results["analytics"] = { status: result.status }),
      (error: any) =>
        (results["analytics"] = { status: "error", error: error.message })
    ),
    clients.backend.healthCheck().then(
      (result: any) => (results["backend"] = { status: result.status }),
      (error: any) =>
        (results["backend"] = { status: "error", error: error.message })
    ),
  ]);

  return results;
};

/**
 * Type-safe client selector
 */
export type ClientType =
  | "account"
  | "intent"
  | "analytics"
  | "backend"
  | "debank";

export const getClient = (type: ClientType) => {
  const clients = createClientInstances();
  return clients[type];
};

/**
 * Error type guards for better error handling
 */
export const isAccountApiError = (error: unknown) => {
  return error instanceof AccountApiError;
};

export const isIntentEngineError = (error: unknown) => {
  return error instanceof IntentEngineError;
};

export const isAnalyticsEngineError = (error: unknown) => {
  return error instanceof AnalyticsEngineError;
};

export const isBackendApiError = (error: unknown) => {
  return error instanceof BackendApiError;
};

export const isDebankApiError = (error: unknown) => {
  return error instanceof DebankApiError;
};
