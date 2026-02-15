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

import { useChainQuery } from "@/hooks/queries/wallet/useChainQuery";
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

function normalizeChainList(
  chains: ChainData[] | ChainData | null | undefined
): ChainData[] {
  if (Array.isArray(chains)) {
    return chains;
  }

  if (chains) {
    return [chains];
  }

  return [];
}

function resolveSelectedToken(
  availableTokens: TransactionToken[] | undefined,
  tokenAddress: string | undefined
): TransactionToken | null {
  if (!availableTokens?.length) {
    return null;
  }

  const selectedToken = availableTokens.find(
    token => token.address === tokenAddress
  );

  return selectedToken ?? availableTokens[0] ?? null;
}

function mapTokenBalances(
  selectedToken: TransactionToken | null,
  tokenBalance: TokenBalance | undefined
): Record<string, TokenBalance> {
  if (!selectedToken || !tokenBalance) {
    return {};
  }

  return {
    [selectedToken.address]: tokenBalance,
  };
}

function calculateUsdAmount(
  amount: string,
  usdPrice: number | undefined
): number {
  const numericAmount = parseFloat(amount || "0");
  if (!usdPrice || Number.isNaN(numericAmount)) {
    return 0;
  }

  return numericAmount * usdPrice;
}

export function useTransactionData({
  isOpen,
  chainId,
  tokenAddress,
  amount,
}: UseTransactionDataParams) {
  const { data: chains } = useChainQuery();
  const chainList = useMemo(() => normalizeChainList(chains), [chains]);

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

  const selectedToken: TransactionToken | null = useMemo(() => {
    return resolveSelectedToken(tokenQuery.data, tokenAddress);
  }, [tokenAddress, tokenQuery.data]);

  const balanceQuery = useTokenBalanceQuery(chainId, selectedToken?.address, {
    enabled: isOpen && Boolean(selectedToken),
  });

  const balances: Record<string, TokenBalance> = useMemo(() => {
    return mapTokenBalances(selectedToken, balanceQuery.data);
  }, [balanceQuery.data, selectedToken]);

  const usdAmount = useMemo(() => {
    return calculateUsdAmount(amount, selectedToken?.usdPrice);
  }, [amount, selectedToken?.usdPrice]);

  const selectedChain: ChainData | null = useMemo(
    () => chainList.find(chain => chain.chainId === chainId) ?? null,
    [chainId, chainList]
  );

  return {
    chainList,
    selectedChain,
    availableTokens: tokenQuery.data ?? [],
    selectedToken,
    tokenQuery,
    balances,
    balanceQuery,
    usdAmount,
    isLoadingTokens: tokenQuery.isLoading,
    isLoadingBalance: balanceQuery.isLoading,
    isLoading: tokenQuery.isLoading || balanceQuery.isLoading,
  } as const;
}
