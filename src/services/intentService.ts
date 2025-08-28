/**
 * Intent Service
 * Service functions for transaction execution and intent processing (port 3002)
 * Replaces IntentEngineClient with simpler service function approach
 */

import { httpUtils } from "../lib/http-utils";

/**
 * Intent Engine interfaces
 */
export interface ExecutionIntent {
  type: "swap" | "zapIn" | "zapOut" | "rebalance" | "optimize";
  fromToken?: string;
  toToken?: string;
  amount: string;
  slippage: number;
  walletAddress: string;
  chainId: number;
  priority?: "fast" | "normal" | "slow";
}

export interface ExecutionResult {
  intentId: string;
  status: "pending" | "processing" | "completed" | "failed";
  transactions: Array<{
    hash: string;
    status: "pending" | "confirmed" | "failed";
    gasUsed?: string;
    effectiveGasPrice?: string;
  }>;
  executionTime?: number;
  error?: string;
}

export interface IntentStatus {
  intentId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: number;
  transactions: Array<{
    hash: string;
    status: "pending" | "confirmed" | "failed";
    blockNumber?: number;
  }>;
}

/**
 * Intent Service Error
 */
export class IntentServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "IntentServiceError";
  }
}

/**
 * Create enhanced error messages for common intent engine errors
 */
const createIntentServiceError = (error: any): IntentServiceError => {
  const status = error.status || error.response?.status || 500;
  let message = error.message || "Intent service error";

  switch (status) {
    case 400:
      if (message?.includes("slippage")) {
        message = "Invalid slippage tolerance. Must be between 0.1% and 50%.";
      } else if (message?.includes("amount")) {
        message = "Invalid transaction amount. Please check your balance.";
      }
      break;
    case 429:
      message =
        "Too many transactions in progress. Please wait before submitting another.";
      break;
    case 503:
      message =
        "Intent engine is temporarily overloaded. Please try again in a moment.";
      break;
  }

  return new IntentServiceError(message, status, error.code, error.details);
};

// Get configured client
const getIntentEngineClient = () => {
  return httpUtils.intentEngine;
};

// Intent Execution Operations

/**
 * Execute a swap intent
 */
export const executeSwap = async (
  intent: Omit<ExecutionIntent, "type">
): Promise<ExecutionResult> => {
  try {
    const client = getIntentEngineClient();
    return await client.post<ExecutionResult>("/intents/swap", {
      ...intent,
      type: "swap",
    });
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

/**
 * Execute a zapIn intent
 */
export const executeZapIn = async (
  intent: Omit<ExecutionIntent, "type">
): Promise<ExecutionResult> => {
  try {
    const client = getIntentEngineClient();
    return await client.post<ExecutionResult>(`/intents/zapIn`, {
      ...intent,
      type: "zapIn",
    });
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

/**
 * Execute a zapOut intent
 */
export const executeZapOut = async (
  intent: Omit<ExecutionIntent, "type">
): Promise<ExecutionResult> => {
  try {
    const client = getIntentEngineClient();
    return await client.post<ExecutionResult>(`/intents/zapOut`, {
      ...intent,
      type: "zapOut",
    });
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

/**
 * Execute a rebalance intent
 */
export const executeRebalance = async (
  intent: Omit<ExecutionIntent, "type" | "fromToken" | "toToken">
): Promise<ExecutionResult> => {
  try {
    const client = getIntentEngineClient();
    return await client.post<ExecutionResult>(`/intents/rebalance`, {
      ...intent,
      type: "rebalance",
    });
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

/**
 * Execute portfolio optimization
 */
export const executeOptimization = async (
  intent: Omit<ExecutionIntent, "type" | "fromToken" | "toToken">
): Promise<ExecutionResult> => {
  try {
    const client = getIntentEngineClient();
    return await client.post<ExecutionResult>(`/intents/optimize`, {
      ...intent,
      type: "optimize",
    });
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

// Intent Monitoring Operations

/**
 * Get intent execution status
 */
export const getIntentStatus = async (
  intentId: string
): Promise<IntentStatus> => {
  try {
    const client = getIntentEngineClient();
    return await client.get<IntentStatus>(`/intents/${intentId}/status`);
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

/**
 * Cancel pending intent
 */
export const cancelIntent = async (
  intentId: string
): Promise<{ message: string; refunded?: boolean }> => {
  try {
    const client = getIntentEngineClient();
    return await client.delete<{ message: string; refunded?: boolean }>(
      `/intents/${intentId}`
    );
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

/**
 * Get user's intent history
 */
export const getUserIntentHistory = async (
  walletAddress: string,
  limit = 50,
  offset = 0
): Promise<{
  intents: ExecutionResult[];
  total: number;
  hasMore: boolean;
}> => {
  try {
    const client = getIntentEngineClient();
    const params = new URLSearchParams({
      wallet: walletAddress,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return await client.get<{
      intents: ExecutionResult[];
      total: number;
      hasMore: boolean;
    }>(`/intents/history?${params}`);
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

// Utility Operations

/**
 * Get execution quote/estimate
 */
export const getExecutionQuote = async (
  intent: Omit<ExecutionIntent, "walletAddress">
): Promise<{
  estimatedGas: string;
  estimatedTime: number;
  priceImpact: number;
  route?: Array<{ protocol: string; percentage: number }>;
}> => {
  try {
    const client = getIntentEngineClient();
    return await client.post<{
      estimatedGas: string;
      estimatedTime: number;
      priceImpact: number;
      route?: Array<{ protocol: string; percentage: number }>;
    }>(`/intents/quote`, intent);
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

/**
 * Get supported tokens for the chain
 */
export const getSupportedTokens = async (
  chainId: number
): Promise<
  Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  }>
> => {
  try {
    const client = getIntentEngineClient();
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    });

    return await client.get<
      Array<{
        address: string;
        symbol: string;
        name: string;
        decimals: number;
        logoURI?: string;
      }>
    >(`/tokens?${params}`);
  } catch (error) {
    throw createIntentServiceError(error);
  }
};

/**
 * Health check
 */
export const checkIntentServiceHealth = async (): Promise<{
  status: string;
  timestamp: string;
  processingQueue: number;
}> => {
  try {
    const client = getIntentEngineClient();
    return await client.get<{
      status: string;
      timestamp: string;
      processingQueue: number;
    }>(`/health`);
  } catch (error) {
    throw createIntentServiceError(error);
  }
};
