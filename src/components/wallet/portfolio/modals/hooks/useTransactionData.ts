/**
 * Transaction Data Hook
 *
 * Fetches and manages transaction-related data including:
 * - Available chains
 * - Supported tokens for selected chain
 * - Token balances
 * - USD amount calculation
 *
 * Simplified consolidation of useTransactionTokenData and useTransactionViewModel.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useChainQuery } from "@/hooks/queries/useChainQuery";
import { useTokenBalanceQuery } from "@/hooks/queries/wallet/useTokenBalanceQuery";
import { transactionService } from "@/services";
import type {
  ChainData,
  TokenBalance,
  TransactionToken,
} from "@/types/domain/transaction";

interface UseTransactionDataParams {
  /**
   * Whether the modal is open (enables queries)
   */
  isOpen: boolean;

  /**
   * Selected chain ID
   */
  chainId: number | undefined;

  /**
   * Selected token address
   */
  tokenAddress: string | undefined;

  /**
   * Transaction amount as string
   */
  amount: string;
}

export function useTransactionData({
  isOpen,
  chainId,
  tokenAddress,
  amount,
}: UseTransactionDataParams) {
  // Fetch available chains
  const { data: chains } = useChainQuery();
  const chainList = useMemo(
    () => (Array.isArray(chains) ? chains : chains ? [chains] : []),
    [chains]
  );

  // Fetch supported tokens for selected chain
  const tokenQuery = useQuery({
    queryKey: ["transaction-tokens", chainId],
    queryFn: () => {
      if (chainId === undefined) {
        throw new Error("Chain ID is required to load tokens");
      }
      return transactionService.getSupportedTokens(chainId);
    },
    enabled: isOpen && Boolean(chainId),
  });

  // Find selected token or default to first token
  const selectedToken: TransactionToken | null = useMemo(() => {
    if (!tokenQuery.data?.length) return null;
    return (
      tokenQuery.data.find(token => token.address === tokenAddress) ??
      tokenQuery.data[0] ??
      null
    );
  }, [tokenAddress, tokenQuery.data]);

  // Fetch balance for selected token
  const balanceQuery = useTokenBalanceQuery(chainId, selectedToken?.address, {
    enabled: isOpen && Boolean(selectedToken),
  });

  // Map balances by token address
  const balances: Record<string, TokenBalance> = useMemo(() => {
    if (!selectedToken || !balanceQuery.data) return {};
    return {
      [selectedToken.address]: balanceQuery.data,
    };
  }, [balanceQuery.data, selectedToken]);

  // Calculate USD amount
  const usdAmount = useMemo(() => {
    const numeric = parseFloat(amount || "0");
    if (!selectedToken?.usdPrice || Number.isNaN(numeric)) return 0;
    return numeric * selectedToken.usdPrice;
  }, [amount, selectedToken?.usdPrice]);

  // Find selected chain data
  const selectedChain: ChainData | null = useMemo(
    () => chainList.find(chain => chain.chainId === chainId) ?? null,
    [chainId, chainList]
  );

  return {
    // Chain data
    chainList,
    selectedChain,

    // Token data
    availableTokens: tokenQuery.data ?? [],
    selectedToken,
    tokenQuery,

    // Balance data
    balances,
    balanceQuery,

    // Calculated values
    usdAmount,

    // Loading states
    isLoadingTokens: tokenQuery.isLoading,
    isLoadingBalance: balanceQuery.isLoading,
    isLoading: tokenQuery.isLoading || balanceQuery.isLoading,
  } as const;
}
