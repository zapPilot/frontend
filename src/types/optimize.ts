/**
 * Types for the optimization tab and dust zap functionality
 */

import { DeBankToken } from "./api";

export interface DustToken extends DeBankToken {
  isSelected: boolean;
  dustValue?: number;
  optimizationScore?: number;
  raw_amount_hex_str?: string;
  optimized_symbol?: string;
}

export interface OptimizationOptions {
  convertDust: boolean;
  rebalancePortfolio: boolean;
  slippage: number;
}

export interface OptimizationData {
  // Dust token calculations
  dustValue: number;
  dustTokenCount: number;

  // Optimization metrics
  rebalanceActions: number;
  chainCount: number;
  totalSavings: number;
  estimatedGasSavings: number;

  // UI helpers
  selectedCount: number;
  hasValidTokens: boolean;
  canOptimize: boolean;
}

export interface OptimizationConfig {
  slippage: number;
  maxGasPrice?: number;
  deadline?: number;
  enablePartialFill?: boolean;
}

export interface OptimizationResult {
  success: boolean;
  transactionHash?: string;
  estimatedGasUsed?: number;
  actualGasUsed?: number;
  outputAmount?: number;
  priceImpact?: number;
  errorMessage?: string;
}

export interface WalletConnectionState {
  activeAccount: {
    address: string;
    status: "connected" | "disconnected" | "connecting";
  } | null;
  activeChain: {
    id: number;
    name: string;
    nativeCurrency: {
      symbol: string;
      name: string;
      decimals: number;
    };
    rpcUrls: {
      default: { http: string[] };
    };
    blockExplorers?: {
      default: { name: string; url: string };
    };
  } | null;
  sendCalls: (calls: TransactionCall[]) => Promise<TransactionResult>;
  userAddress: string | undefined;
  chainId: number | undefined;
  chainName: string | undefined;
  isWalletConnected: boolean;
  getExplorerUrl: (txnHash: string) => string | null;
}

export interface TransactionCall {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
}

export interface TransactionResult {
  transactionHash: string;
  status: "success" | "failed" | "pending";
  blockNumber?: number;
  gasUsed?: string;
}

export interface PreparedTransaction {
  to: string;
  data: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
}

export interface BatchProgress {
  batchIndex: number;
  totalBatches: number;
  transactionCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  transactions: PreparedTransaction[];
  error?: string;
  processedTokens: number;
  totalTokens: number;
  transactionHash?: string;
}

export interface WalletTransactionState {
  transactions: PreparedTransaction[];
  status: "idle" | "sending" | "success" | "error";
  error: string | null;
  batchProgress: BatchProgress[];
  currentBatch: number;
}

export interface ToastMessage {
  type: "success" | "error" | "info";
  title: string;
  message: string;
  duration?: number;
  link?: { text: string; url: string };
}

export interface IntentCreationParams {
  userAddress: string;
  chainId: number;
  filteredDustTokens: DustToken[];
  slippage: number;
}

export interface OptimizationWorkflowState {
  isOptimizing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
}

export interface StreamingState {
  isStreaming: boolean;
  events: StreamEvent[];
  progress: {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    message: string;
  };
  estimatedTimeRemaining?: number;
}

export interface CompleteEventData {
  transactions?: PreparedTransaction[];
}

export interface TokenSelectionState {
  allTokens: DustToken[];
  selectedTokens: DustToken[];
  dustThreshold: number;
  totalDustValue: number;
  totalSelectedValue: number;
}

export interface UIState {
  isOptimizing: boolean;
  showAdvancedSettings: boolean;
  activeTab: "overview" | "details" | "settings";
  selectedTokenCount: number;
  estimatedOutput?: {
    amount: number;
    token: DeBankToken;
  };
}

export type OptimizationStrategy =
  | "maximize_value"
  | "minimize_gas"
  | "balanced"
  | "custom";

export interface OptimizationPreferences {
  strategy: OptimizationStrategy;
  maxSlippage: number;
  maxGasPrice: number;
  prioritizeSpeed: boolean;
  enablePartialFills: boolean;
  customTargetToken?: DeBankToken;
}

export interface GasEstimate {
  slow: {
    gasPrice: number;
    estimatedTime: number;
    cost: number;
  };
  standard: {
    gasPrice: number;
    estimatedTime: number;
    cost: number;
  };
  fast: {
    gasPrice: number;
    estimatedTime: number;
    cost: number;
  };
}

export interface OptimizationReport {
  totalDustValue: number;
  optimizedValue: number;
  gasCost: number;
  netGain: number;
  priceImpact: number;
  transactionCount: number;
  estimatedTime: number;
  successRate: number;
  tokensSaved: number;
  recommendedStrategy: OptimizationStrategy;
}

// ThirdWeb types - simplified to match actual usage
export interface ThirdWebTransactionResult {
  transactionHash?: string;
}

// Stream event types from useDustZapStream
export interface BaseStreamEvent {
  type: string;
  timestamp?: number;
  processedTokens?: number;
  totalTokens?: number;
}

export interface ConnectedStreamEvent extends BaseStreamEvent {
  type: "connected";
  totalTokens: number;
}

export interface TokenReadyStreamEvent extends BaseStreamEvent {
  type: "token_ready";
  processedTokens: number;
}

export interface TokenFailedStreamEvent extends BaseStreamEvent {
  type: "token_failed";
  processedTokens: number;
  error?: string;
}

export interface CompleteStreamEvent extends BaseStreamEvent {
  type: "complete";
  data?: {
    transactions?: PreparedTransaction[];
    summary?: OptimizationResult;
  };
}

export type StreamEvent =
  | ConnectedStreamEvent
  | TokenReadyStreamEvent
  | TokenFailedStreamEvent
  | CompleteStreamEvent
  | BaseStreamEvent;
