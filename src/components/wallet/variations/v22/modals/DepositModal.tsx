"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { GradientButton } from "@/components/ui";
import { TransactionModal } from "@/components/wallet/variations/v22/modals/TransactionModal";
import { ChainSelector } from "@/components/wallet/variations/v22/modals/components/ChainSelector";
import { TokenSelector } from "@/components/wallet/variations/v22/modals/components/TokenSelector";
import { AmountInput } from "@/components/wallet/variations/v22/modals/components/AmountInput";
import { TransactionSummary } from "@/components/wallet/variations/v22/modals/components/TransactionSummary";
import { useChainQuery } from "@/hooks/queries/useChainQuery";
import { useTokenBalanceQuery } from "@/hooks/queries/useTokenBalanceQuery";
import { transactionService } from "@/services";
import { useWalletProvider } from "@/providers/WalletProvider";
import type {
  AllocationBreakdown,
  TransactionResult,
  TransactionToken,
} from "@/types/domain/transaction";

import { useTransactionForm } from "./hooks/useTransactionForm";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChainId?: number;
  regimeAllocation?: AllocationBreakdown | undefined;
}

export function DepositModal({
  isOpen,
  onClose,
  defaultChainId = 1,
  regimeAllocation,
}: DepositModalProps) {
  const { isConnected } = useWalletProvider();
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );
  const form = useTransactionForm({ chainId: defaultChainId });

  const chainId = form.watch("chainId");
  const tokenAddress = form.watch("tokenAddress");
  const amount = form.watch("amount");

  const { data: chains } = useChainQuery();
  const tokenQuery = useQuery({
    queryKey: ["transaction-tokens", chainId],
    queryFn: () => transactionService.getSupportedTokens(chainId),
    enabled: isOpen && Boolean(chainId),
  });

  const selectedToken: TransactionToken | undefined = useMemo(() => {
    if (!tokenQuery.data?.length) return undefined;
    return (
      tokenQuery.data.find(token => token.address === tokenAddress) ??
      tokenQuery.data[0]
    );
  }, [tokenAddress, tokenQuery.data]);

  useEffect(() => {
    if (!tokenQuery.data?.length) return;
    if (!tokenAddress && tokenQuery.data[0]?.address) {
      form.setValue("tokenAddress", tokenQuery.data[0].address);
    }
  }, [form, tokenAddress, tokenQuery.data]);

  const balanceQuery = useTokenBalanceQuery(chainId, selectedToken?.address, {
    enabled: isOpen,
  });

  const balances = useMemo(() => {
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

  const isSubmitDisabled =
    status === "submitting" ||
    !form.formState.isValid ||
    !isConnected ||
    !selectedToken;

  const handleSubmit = form.handleSubmit(async values => {
    setStatus("submitting");
    try {
      const response = await transactionService.simulateDeposit(values);
      setResult(response);
      setStatus("success");
    } catch (error) {
      // Reset to idle to allow retry
      setStatus("idle");
      throw error;
    }
  });

  const resetState = () => {
    setResult(null);
    setStatus("idle");
    onClose();
  };

  const chainList = Array.isArray(chains)
    ? chains
    : chains
      ? [chains]
      : [];

  const selectedChain = chainList.find(chain => chain.chainId === chainId);

  const allocationAfter: AllocationBreakdown | undefined = regimeAllocation
    ? {
        ...regimeAllocation,
      }
    : undefined;

  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={resetState}
      title="Deposit to Pilot"
      subtitle="Chain → Token → Amount → Confirm"
      accent="success"
      testId="deposit-modal"
    >
      {regimeAllocation ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          Based on current regime target: {regimeAllocation.crypto}% Crypto /
          {regimeAllocation.stable}% Stable
        </div>
      ) : null}

      <ChainSelector
        chains={chainList}
        selectedChainId={chainId ?? null}
        onSelect={id => form.setValue("chainId", id)}
      />

      <TokenSelector
        tokens={tokenQuery.data ?? []}
        selectedToken={selectedToken?.address ?? null}
        onSelect={address => form.setValue("tokenAddress", address)}
        balances={balances}
        loading={tokenQuery.isLoading}
      />

      <AmountInput
        value={amount}
        onChange={value => form.setValue("amount", value)}
        max={balanceQuery.data?.balance}
        token={selectedToken ?? null}
        error={
          form.formState.errors.amount?.message as string | undefined
        }
      />

      <TransactionSummary
        chain={selectedChain ?? null}
        token={selectedToken ?? null}
        amount={amount}
        usdAmount={usdAmount}
        allocationAfter={allocationAfter}
        actionLabel="Deposit"
      />

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={resetState}
          className="rounded-xl border border-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
        >
          Cancel
        </button>
        <GradientButton
          data-testid="confirm-button"
          gradient="from-emerald-500 to-teal-500"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
          className="min-w-[180px]"
        >
          {status === "submitting"
            ? "Submitting…"
            : !isConnected
              ? "Connect Wallet"
              : "Confirm Deposit"}
        </GradientButton>
      </div>

      {result ? (
        <div
          data-testid="success-message"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"
        >
          Deposit simulated. Tx: {result.txHash.slice(0, 12)}…
        </div>
      ) : null}
    </TransactionModal>
  );
}
