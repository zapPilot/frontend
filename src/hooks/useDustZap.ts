"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletConnection } from "./useWalletConnection";
import { portfolioStateUtils } from "@/utils/portfolio.utils";
import { DustToken } from "../types/optimize";

export interface DustConversionMessage {
  fromToken: string;
  toToken: string;
  amount: number;
  outputAmount: number;
  tradingLoss: number;
  dexAggregator: string;
  totalSteps?: number;
}

export interface DustZapOptions {
  slippage: number;
  enableConversion: boolean;
}

export interface DustZapData {
  tokens: DustToken[];
  totalValue: number;
  tokenCount: number;
  isLoading: boolean;
  error: string | null;
  isConverting: boolean;
  conversionMessages: DustConversionMessage[];
  progress: {
    completed: number;
    total: number;
    batchCompleted: number;
    batchTotal: number;
  };
  convertDustToETH?: () => Promise<void>;
}

// API configuration - would be moved to env vars (for future use)
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
// const DEBANK_API_URL = process.env.NEXT_PUBLIC_DEBANK_API_URL || "https://pro-openapi.debank.com/v1";

// Chain name mapping for DeBank API
const CHAIN_NAME_MAPPING = {
  arbitrum: "arb",
  base: "base",
  optimism: "op",
} as const;

/**
 * Utility functions ported from dustZap implementation
 */
const transformToDebankChainName = (chainName: string): string => {
  const normalized = chainName.toLowerCase();
  return (
    CHAIN_NAME_MAPPING[normalized as keyof typeof CHAIN_NAME_MAPPING] ||
    normalized
  );
};

// Utility function for future use
// const formatSmallNumber = (num: number): string => {
//   if (isNaN(num)) return "-";
//   if (num < 0.000001 && num > 0) return "< 0.000001";
//   return Number(num.toFixed(6)).toString();
// };

/**
 * Fetch dust tokens from DeBank-like API
 * This is a simplified version of the original getTokens function
 */
const fetchDustTokens = async (chainName: string): Promise<DustToken[]> => {
  try {
    // Mock data for development - replace with actual API calls
    // In production, this would call DeBank API or similar service
    const mockTokens: DustToken[] = [
      {
        id: "arb_0x1234",
        chain: chainName || "ethereum",
        name: "Dust Token 1",
        symbol: "DUST1",
        decimals: 18,
        logo_url: "/token-logos/generic.png",
        price: 1200,
        is_verified: false,
        is_core: false,
        is_wallet: false,
        time_at: Date.now(),
        amount: 0.0001,
        isSelected: false,
      },
      {
        id: "arb_0x5678",
        chain: chainName || "ethereum",
        name: "Dust Token 2",
        symbol: "DUST2",
        decimals: 18,
        logo_url: "/token-logos/generic.png",
        price: 2.4,
        is_verified: false,
        is_core: false,
        is_wallet: false,
        time_at: Date.now(),
        amount: 0.05,
        isSelected: false,
      },
      // Add more mock tokens...
    ];

    // Filter dust tokens (small value tokens)
    return mockTokens.filter(token => {
      const totalValue = token.amount * token.price;
      return totalValue > 0.005 && totalValue < 50; // Dust threshold
    });
  } catch {
    // Silently handle error and throw user-friendly message
    throw new Error("Failed to load dust tokens");
  }
};

/**
 * useDustZap - Main hook for dust conversion functionality
 */
export function useDustZap(
  options: DustZapOptions = { slippage: 30, enableConversion: true }
): DustZapData {
  const { account, chain } = useWalletConnection();

  // State management
  const [tokens, setTokens] = useState<DustToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionMessages, setConversionMessages] = useState<
    DustConversionMessage[]
  >([]);
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    batchCompleted: 0,
    batchTotal: 0,
  });

  // Fetch dust tokens when wallet connects or chain changes
  useEffect(() => {
    if (!account?.address || !chain?.name || !options.enableConversion) {
      setTokens([]);
      return;
    }

    const fetchTokens = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const chainName = transformToDebankChainName(chain.name);
        const dustTokens = await fetchDustTokens(chainName);
        setTokens(dustTokens);
      } catch (err) {
        console.log("err", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load tokens";
        setError(errorMessage);
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [account?.address, chain?.name, options.enableConversion]);

  // Calculate total value
  const totalValue = tokens.reduce(
    (sum, token) => sum + token.amount * token.price,
    0
  );
  const tokenCount = tokens.length;

  // Convert dust tokens to ETH
  const convertDustToETH = useCallback(async (): Promise<void> => {
    if (
      !account?.address ||
      !chain ||
      portfolioStateUtils.isEmptyArray(tokens)
    ) {
      throw new Error("No wallet connected or no tokens to convert");
    }

    setIsConverting(true);
    setConversionMessages([]);
    setError(null);

    const totalSteps = tokens.length;
    setProgress({
      completed: 0,
      total: totalSteps,
      batchCompleted: 0,
      batchTotal: Math.ceil(totalSteps / 10), // 10 tokens per batch
    });

    try {
      // Simulate conversion process
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token) continue;

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const conversionMessage: DustConversionMessage = {
          fromToken: token.symbol,
          toToken: "ETH",
          amount: token.amount,
          outputAmount: (token.amount * token.price) / 2500, // Mock ETH price
          tradingLoss: token.amount * token.price * 0.01, // 1% trading loss
          dexAggregator: "1inch",
          ...(i === 0 && { totalSteps }),
        };

        setConversionMessages(prev => [...prev, conversionMessage]);
        setProgress(prev => ({
          ...prev,
          completed: i + 1,
          batchCompleted: Math.floor((i + 1) / 10) + 1,
        }));
      }

      // Reset tokens after successful conversion
      setTokens([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Conversion failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsConverting(false);
    }
  }, [account?.address, chain, tokens]);

  return {
    tokens,
    totalValue,
    tokenCount,
    isLoading,
    error,
    isConverting,
    conversionMessages,
    progress,
    // Additional methods that could be exposed
    convertDustToETH,
  };
}

/**
 * Standalone conversion function for use in OptimizeTab
 */
export const useDustConversion = () => {
  const dustZapData = useDustZap({ slippage: 30, enableConversion: true });

  return {
    ...dustZapData,
    convert: dustZapData.convertDustToETH,
  };
};
