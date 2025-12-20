import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useChainQuery } from "@/hooks/queries/useChainQuery";
import { useTokenBalanceQuery } from "@/hooks/queries/useTokenBalanceQuery";
import { transactionService } from "@/services";
import type { ChainData, TokenBalance } from "@/types/domain/transaction";

interface UseTransactionTokenDataParams {
  isOpen: boolean;
  chainId: number | undefined;
  tokenAddress: string | undefined;
  setTokenAddress: (address: string) => void;
  amount: string;
}

export function useTransactionTokenData({
  isOpen,
  chainId,
  tokenAddress,
  setTokenAddress,
  amount,
}: UseTransactionTokenDataParams) {
  const { data: chains } = useChainQuery();
  const chainList = Array.isArray(chains) ? chains : chains ? [chains] : [];

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

  const selectedToken = useMemo(() => {
    if (!tokenQuery.data?.length) return;
    return (
      tokenQuery.data.find(token => token.address === tokenAddress) ??
      tokenQuery.data[0]
    );
  }, [tokenAddress, tokenQuery.data]);

  useEffect(() => {
    if (!tokenQuery.data?.length) return;
    if (!tokenAddress && tokenQuery.data[0]?.address) {
      setTokenAddress(tokenQuery.data[0].address);
    }
  }, [setTokenAddress, tokenAddress, tokenQuery.data]);

  const balanceQuery = useTokenBalanceQuery(chainId, selectedToken?.address, {
    enabled: isOpen,
  });

  const balances: Record<string, TokenBalance> = useMemo(() => {
    if (!selectedToken || !balanceQuery.data) return {};
    return {
      [selectedToken.address]: balanceQuery.data,
    };
  }, [balanceQuery.data, selectedToken]);

  const usdAmount = useMemo(() => {
    const numeric = parseFloat(amount || "0");
    if (!selectedToken?.usdPrice || Number.isNaN(numeric)) return 0;
    return numeric * selectedToken.usdPrice;
  }, [amount, selectedToken?.usdPrice]);

  const selectedChain: ChainData | undefined = chainList.find(
    chain => chain.chainId === chainId
  );

  return {
    chainList,
    selectedChain: selectedChain ?? null,
    selectedToken: selectedToken ?? null,
    tokenQuery,
    balanceQuery,
    balances,
    usdAmount,
  };
}
