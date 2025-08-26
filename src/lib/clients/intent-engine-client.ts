/**
 * Intent Engine Client
 * Handles transaction execution and intent processing (port 3002)
 */

import { BaseApiClient, APIError } from "./base-client";

export class IntentEngineError extends APIError {
  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown
  ) {
    super(message, status, code, details);
    this.name = "IntentEngineError";
  }
}

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
 * Intent Engine Client for transaction execution
 */
export class IntentEngineClient extends BaseApiClient {
  constructor(baseURL: string) {
    super({
      baseURL,
      timeout: 30000, // Longer timeout for transaction processing
      retries: 1, // Minimal retries for transactions to avoid duplicates
      retryDelay: 2000,
      headers: {
        "X-Service": "intent-engine",
      },
    });
  }

  /**
   * Create intent-specific errors
   */
  protected override createServiceError(
    status: number,
    errorData: unknown
  ): IntentEngineError {
    // Type guard for error data
    const isErrorObject = (data: unknown): data is { message?: string } => {
      return typeof data === "object" && data !== null;
    };

    const errorObj = isErrorObject(errorData) ? errorData : {};
    let message = errorObj.message || "Unknown error occurred";

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

    return new IntentEngineError(
      message,
      status,
      errorData.code,
      errorData.details
    );
  }

  // Intent Execution Operations

  /**
   * Execute a swap intent
   */
  async executeSwap(
    intent: Omit<ExecutionIntent, "type">
  ): Promise<ExecutionResult> {
    return this.post<ExecutionResult>("/intents/swap", {
      ...intent,
      type: "swap",
    });
  }

  /**
   * Execute a zapIn intent
   */
  async executeZapIn(
    intent: Omit<ExecutionIntent, "type">
  ): Promise<ExecutionResult> {
    return this.post<ExecutionResult>("/intents/zapIn", {
      ...intent,
      type: "zapIn",
    });
  }

  /**
   * Execute a zapOut intent
   */
  async executeZapOut(
    intent: Omit<ExecutionIntent, "type">
  ): Promise<ExecutionResult> {
    return this.post<ExecutionResult>("/intents/zapOut", {
      ...intent,
      type: "zapOut",
    });
  }

  /**
   * Execute a rebalance intent
   */
  async executeRebalance(
    intent: Omit<ExecutionIntent, "type" | "fromToken" | "toToken">
  ): Promise<ExecutionResult> {
    return this.post<ExecutionResult>("/intents/rebalance", {
      ...intent,
      type: "rebalance",
    });
  }

  /**
   * Execute portfolio optimization
   */
  async executeOptimization(
    intent: Omit<ExecutionIntent, "type" | "fromToken" | "toToken">
  ): Promise<ExecutionResult> {
    return this.post<ExecutionResult>("/intents/optimize", {
      ...intent,
      type: "optimize",
    });
  }

  // Intent Monitoring Operations

  /**
   * Get intent execution status
   */
  async getIntentStatus(intentId: string): Promise<IntentStatus> {
    return this.get<IntentStatus>(`/intents/${intentId}/status`);
  }

  /**
   * Cancel pending intent
   */
  async cancelIntent(
    intentId: string
  ): Promise<{ message: string; refunded?: boolean }> {
    return this.delete<{ message: string; refunded?: boolean }>(
      `/intents/${intentId}`
    );
  }

  /**
   * Get user's intent history
   */
  async getUserIntentHistory(
    walletAddress: string,
    limit = 50,
    offset = 0
  ): Promise<{
    intents: ExecutionResult[];
    total: number;
    hasMore: boolean;
  }> {
    return this.get<{
      intents: ExecutionResult[];
      total: number;
      hasMore: boolean;
    }>("/intents/history", {
      wallet: walletAddress,
      limit: limit.toString(),
      offset: offset.toString(),
    });
  }

  // Utility Operations

  /**
   * Get execution quote/estimate
   */
  async getExecutionQuote(
    intent: Omit<ExecutionIntent, "walletAddress">
  ): Promise<{
    estimatedGas: string;
    estimatedTime: number;
    priceImpact: number;
    route?: Array<{ protocol: string; percentage: number }>;
  }> {
    return this.post<{
      estimatedGas: string;
      estimatedTime: number;
      priceImpact: number;
      route?: Array<{ protocol: string; percentage: number }>;
    }>("/intents/quote", intent);
  }

  /**
   * Get supported tokens for the chain
   */
  async getSupportedTokens(chainId: number): Promise<
    Array<{
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      logoURI?: string;
    }>
  > {
    return this.get<
      Array<{
        address: string;
        symbol: string;
        name: string;
        decimals: number;
        logoURI?: string;
      }>
    >("/tokens", { chainId: chainId.toString() });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    processingQueue: number;
  }> {
    return this.get<{
      status: string;
      timestamp: string;
      processingQueue: number;
    }>("/health");
  }
}

// Singleton instance
export const intentEngineClient = new IntentEngineClient(
  process.env["NEXT_PUBLIC_INTENT_ENGINE_URL"] || "http://127.0.0.1:3002"
);
