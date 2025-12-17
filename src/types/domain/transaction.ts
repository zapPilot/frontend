import type { SwapToken } from "@/types/ui/swap";

export type TransactionType = "deposit" | "withdraw" | "rebalance";

export interface ChainData {
  chainId: number;
  name: string;
  symbol: string;
  iconUrl?: string;
  isActive: boolean;
  isTestnet?: boolean;
}

export interface TokenBalance {
  balance: string;
  usdValue: number;
}

export interface TransactionFormData {
  chainId: number;
  tokenAddress: string;
  amount: string;
  slippage?: number | undefined;
  intensity?: number | undefined;
}

export interface TransactionResult {
  type: TransactionType;
  status: "success" | "error";
  txHash: string;
  amount: string;
  token: string;
  timestamp: number;
  message?: string;
}

export interface TransactionToken extends SwapToken {
  usdPrice?: number | undefined;
  category?: "stable" | "crypto";
  popular?: boolean;
}

export interface AllocationBreakdown {
  crypto: number;
  stable: number;
  simplifiedCrypto?: {
    symbol: string;
    name: string;
    value: number;
    color?: string;
  }[] | undefined;
}

export interface RebalancePreview {
  projectedAllocation: AllocationBreakdown;
  aprDelta: number;
  gasEstimateUsd: number;
}
