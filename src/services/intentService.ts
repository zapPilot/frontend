/**
 * Intent Service
 * Service functions for transaction execution and intent processing (port 3002)
 * Replaces IntentEngineClient with simpler service function approach
 */

import { httpUtils } from "@/lib/http";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import { StrategiesApiResponse } from "@/types/domain/strategies";

import { createIntentServiceError } from "../lib/errors";

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
  transactions: {
    hash: string;
    status: "pending" | "confirmed" | "failed";
    gasUsed?: string;
    effectiveGasPrice?: string;
  }[];
  executionTime?: number;
  error?: string;
}

export interface IntentStatus {
  intentId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: number;
  transactions: {
    hash: string;
    status: "pending" | "confirmed" | "failed";
    blockNumber?: number;
  }[];
}

const callIntentService = createServiceCaller(createIntentServiceError);

// Intent Execution Operations

/**
 * Execute a swap intent
 */
export const executeSwap = (
  intent: Omit<ExecutionIntent, "type">
): Promise<ExecutionResult> =>
  callIntentService(() =>
    httpUtils.intentEngine.post<ExecutionResult>("/intents/swap", {
      ...intent,
      type: "swap",
    })
  );

/**
 * Execute a zapIn intent
 */
export const executeZapIn = (
  intent: Omit<ExecutionIntent, "type">
): Promise<ExecutionResult> =>
  callIntentService(() =>
    httpUtils.intentEngine.post<ExecutionResult>(`/intents/zapIn`, {
      ...intent,
      type: "zapIn",
    })
  );

/**
 * Execute a zapOut intent
 */
export const executeZapOut = (
  intent: Omit<ExecutionIntent, "type">
): Promise<ExecutionResult> =>
  callIntentService(() =>
    httpUtils.intentEngine.post<ExecutionResult>(`/intents/zapOut`, {
      ...intent,
      type: "zapOut",
    })
  );

/**
 * Execute a rebalance intent
 */
export const executeRebalance = (
  intent: Omit<ExecutionIntent, "type" | "fromToken" | "toToken">
): Promise<ExecutionResult> =>
  callIntentService(() =>
    httpUtils.intentEngine.post<ExecutionResult>(`/intents/rebalance`, {
      ...intent,
      type: "rebalance",
    })
  );

/**
 * Dust token conversion interface for intent service
 */
export interface DustTokenParams {
  address: string;
  symbol: string;
  amount: number;
  price: number;
  decimals: number;
  raw_amount_hex_str: string;
}

/**
 * UnifiedZap interfaces for multi-strategy allocation
 */
interface UnifiedZapParams {
  strategyAllocations: {
    strategyId: string;
    percentage: number;
  }[];
  inputToken: string;
  inputAmount: string;
  slippage: number;
}

export interface UnifiedZapRequest {
  userAddress: string;
  chainId: number;
  params: UnifiedZapParams;
}

export interface UnifiedZapResponse {
  success: boolean;
  intentType: "unifiedZap";
  mode: "streaming";
  intentId: string;
  streamUrl: string;
  metadata: {
    totalStrategies: number;
    totalProtocols: number;
    estimatedDuration: string;
    streamingEnabled: boolean;
  };
}

/**
 * Execute dust token conversion to ETH
 */
export const executeDustZap = (
  userAddress: string,
  chainId: number,
  params: {
    slippage: number;
    dustTokens: DustTokenParams[];
    toTokenAddress: string;
    toTokenDecimals: number;
  }
): Promise<{ intentId: string }> =>
  callIntentService(() =>
    httpUtils.intentEngine.post<{ intentId: string }>(
      "/api/v1/intents/dustZap",
      {
        userAddress,
        chainId,
        params,
      }
    )
  );

/**
 * Execute UnifiedZap intent for multi-strategy allocation
 */
export const executeUnifiedZap = (
  request: UnifiedZapRequest
): Promise<UnifiedZapResponse> =>
  callIntentService(() =>
    httpUtils.intentEngine.post<UnifiedZapResponse>(
      "/api/v1/intents/unifiedZap",
      request
    )
  );

// Intent Monitoring Operations

/**
 * Get intent execution status
 */
export const getIntentStatus = (intentId: string): Promise<IntentStatus> =>
  callIntentService(() =>
    httpUtils.intentEngine.get<IntentStatus>(`/intents/${intentId}/status`)
  );

/**
 * Get user's intent history
 */
export const getUserIntentHistory = (
  walletAddress: string,
  offset = 0
): Promise<{
  intents: ExecutionResult[];
  total: number;
  hasMore: boolean;
}> =>
  callIntentService(() => {
    const params = new URLSearchParams({
      wallet: walletAddress,
      offset: offset.toString(),
    });

    return httpUtils.intentEngine.get<{
      intents: ExecutionResult[];
      total: number;
      hasMore: boolean;
    }>(`/intents/history?${params}`);
  });

// Strategy Operations

/**
 * Get available strategies for portfolio optimization
 */
export const getStrategies = (): Promise<StrategiesApiResponse> =>
  callIntentService(() =>
    httpUtils.intentEngine.get<StrategiesApiResponse>(`/api/v1/strategies`)
  );

// Utility Operations

/**
 * Health check
 */
export const checkIntentServiceHealth = (): Promise<{
  status: string;
  timestamp: string;
  processingQueue: number;
}> =>
  callIntentService(() =>
    httpUtils.intentEngine.get<{
      status: string;
      timestamp: string;
      processingQueue: number;
    }>(`/health`)
  );
