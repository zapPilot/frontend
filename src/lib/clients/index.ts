/**
 * Service-Specific API Clients
 * Centralized exports for all API clients
 */

// Base client and common types
export { BaseApiClient } from "./base-client";
export type { ServiceConfig, ServiceErrorConfig } from "./base-client";
export { APIError, NetworkError, TimeoutError } from "./base-client";

// Account API Client (User & Wallet Management - Port 3004)
export { AccountApiClient, AccountApiError } from "./account-api-client";
export { accountApiClient } from "./account-api-client";

// Intent Engine Client (Transaction Execution - Port 3002)
export { IntentEngineClient, IntentEngineError } from "./intent-engine-client";
export { intentEngineClient } from "./intent-engine-client";
export type {
  ExecutionIntent,
  ExecutionResult,
  IntentStatus,
} from "./intent-engine-client";

// Analytics Engine Client (Portfolio Analysis - Port 8001)
export {
  AnalyticsEngineClient,
  AnalyticsEngineError,
} from "./analytics-engine-client";
export { analyticsEngineClient } from "./analytics-engine-client";
export type {
  PortfolioSummary,
  RebalanceRecommendations,
  PoolPerformance,
} from "./analytics-engine-client";

// Backend API Client (Notifications & Reporting - Port 3001)
export { BackendApiClient, BackendApiError } from "./backend-api-client";
export { backendApiClient } from "./backend-api-client";
export type {
  NotificationSettings,
  DiscordAlert,
  EmailReport,
} from "./backend-api-client";

// DeBank API Client (External DeFi Data)
export { DebankApiClient, DebankApiError } from "./debank-api-client";
export { debankApiClient } from "./debank-api-client";
export type {
  DebankPortfolioItem,
  DebankTokenBalance,
  DebankProtocolPosition,
} from "./debank-api-client";

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
  // Import clients dynamically to avoid circular dependencies
  const { accountApiClient } = require("./account-api-client");
  const { intentEngineClient } = require("./intent-engine-client");
  const { analyticsEngineClient } = require("./analytics-engine-client");
  const { backendApiClient } = require("./backend-api-client");
  const { debankApiClient } = require("./debank-api-client");

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
 * Migration helpers for backward compatibility
 * @deprecated Use service-specific clients instead
 */
export const legacyApiClient = {
  /**
   * @deprecated Use accountApiClient instead
   */
  get connectWallet() {
    const { accountApiClient } = require("./account-api-client");
    return accountApiClient.connectWallet.bind(accountApiClient);
  },
  get getUserProfile() {
    const { accountApiClient } = require("./account-api-client");
    return accountApiClient.getUserProfile.bind(accountApiClient);
  },
  get getUserWallets() {
    const { accountApiClient } = require("./account-api-client");
    return accountApiClient.getUserWallets.bind(accountApiClient);
  },
  get addWalletToBundle() {
    const { accountApiClient } = require("./account-api-client");
    return accountApiClient.addWalletToBundle.bind(accountApiClient);
  },
  get removeWalletFromBundle() {
    const { accountApiClient } = require("./account-api-client");
    return accountApiClient.removeWalletFromBundle.bind(accountApiClient);
  },

  /**
   * @deprecated Use analyticsEngineClient instead
   */
  get getPortfolioSummary() {
    const { analyticsEngineClient } = require("./analytics-engine-client");
    return analyticsEngineClient.getPortfolioSummary.bind(
      analyticsEngineClient
    );
  },
  get getPortfolioAPR() {
    const { analyticsEngineClient } = require("./analytics-engine-client");
    return analyticsEngineClient.getPortfolioAPR.bind(analyticsEngineClient);
  },

  /**
   * @deprecated Use intentEngineClient instead
   */
  get executeSwap() {
    const { intentEngineClient } = require("./intent-engine-client");
    return intentEngineClient.executeSwap.bind(intentEngineClient);
  },
  get getIntentStatus() {
    const { intentEngineClient } = require("./intent-engine-client");
    return intentEngineClient.getIntentStatus.bind(intentEngineClient);
  },

  /**
   * @deprecated Use backendApiClient instead
   */
  get sendDiscordAlert() {
    const { backendApiClient } = require("./backend-api-client");
    return backendApiClient.sendDiscordAlert.bind(backendApiClient);
  },
  get generatePortfolioReport() {
    const { backendApiClient } = require("./backend-api-client");
    return backendApiClient.generatePortfolioReport.bind(backendApiClient);
  },
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
  const { AccountApiError } = require("./account-api-client");
  return error instanceof AccountApiError;
};

export const isIntentEngineError = (error: unknown) => {
  const { IntentEngineError } = require("./intent-engine-client");
  return error instanceof IntentEngineError;
};

export const isAnalyticsEngineError = (error: unknown) => {
  const { AnalyticsEngineError } = require("./analytics-engine-client");
  return error instanceof AnalyticsEngineError;
};

export const isBackendApiError = (error: unknown) => {
  const { BackendApiError } = require("./backend-api-client");
  return error instanceof BackendApiError;
};

export const isDebankApiError = (error: unknown) => {
  const { DebankApiError } = require("./debank-api-client");
  return error instanceof DebankApiError;
};
