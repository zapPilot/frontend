"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { GradientButton } from "@/components/ui";
import { AmountInput } from "@/components/wallet/variations/v22/modals/components/AmountInput";
import { ChainSelector } from "@/components/wallet/variations/v22/modals/components/ChainSelector";
import { TokenSelector } from "@/components/wallet/variations/v22/modals/components/TokenSelector";
import { TransactionSummary } from "@/components/wallet/variations/v22/modals/components/TransactionSummary";
import { TransactionModal } from "@/components/wallet/variations/v22/modals/TransactionModal";
import { useChainQuery } from "@/hooks/queries/useChainQuery";
import { useTokenBalanceQuery } from "@/hooks/queries/useTokenBalanceQuery";
import { transactionService } from "@/services";
import { useWalletProvider } from "@/providers/WalletProvider";
import type {
  TransactionResult,
  TransactionToken,
} from "@/types/domain/transaction";

import { useTransactionForm } from "./hooks/useTransactionForm";

type WithdrawMode = "partial" | "full";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

export function WithdrawModal({
  isOpen,
  onClose,
  currentBalance = 0,
}: WithdrawModalProps) {
  const { isConnected } = useWalletProvider();
  const [mode, setMode] = useState<WithdrawMode>("partial");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );
  const [result, setResult] = useState<TransactionResult | null>(null);

  const form = useTransactionForm({
    slippage: 0.5,
    amount: mode === "full" ? currentBalance.toString() : "",
  });

  const chainId = form.watch("chainId");
  const tokenAddress = form.watch("tokenAddress");
  const amount = form.watch("amount");
  const slippage = form.watch("slippage");

  const { data: chains } = useChainQuery();
  const chainList = Array.isArray(chains)
    ? chains
    : chains
      ? [chains]
      : [];

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

  useEffect(() => {
    if (mode === "full") {
      form.setValue("amount", currentBalance.toString());
    }
  }, [currentBalance, form, mode]);

  const balanceQuery = useTokenBalanceQuery(chainId, selectedToken?.address, {
    enabled: isOpen,
  });

  const balances = useMemo(() => {
    if (!selectedToken || !balanceQuery.data) return {};
    return { [selectedToken.address]: balanceQuery.data };
  }, [balanceQuery.data, selectedToken]);

  const usdAmount = useMemo(() => {
    const numeric = parseFloat(amount || "0");
    if (!selectedToken?.usdPrice || Number.isNaN(numeric)) return 0;
    return numeric * selectedToken.usdPrice;
  }, [amount, selectedToken?.usdPrice]);

  const handleSubmit = form.handleSubmit(async values => {
    setStatus("submitting");
    try {
      const response = await transactionService.simulateWithdraw(values);
      setResult(response);
      setStatus("success");
    } catch (error) {
      setStatus("idle");
      throw error;
    }
  });

  const selectedChain = chainList.find(chain => chain.chainId === chainId);
  const isSubmitDisabled =
    status === "submitting" ||
    !form.formState.isValid ||
    !isConnected ||
    !selectedToken;

  const resetState = () => {
    setResult(null);
    setStatus("idle");
    onClose();
  };

  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={resetState}
      title="Withdraw Funds"
      subtitle="Switch between partial and full exit. Slippage is configurable."
      accent="danger"
      testId="withdraw-modal"
    >
      <div className="grid grid-cols-2 gap-2">
        {(["partial", "full"] as WithdrawMode[]).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
              mode === option
                ? "border-red-500/50 bg-red-500/10 text-white"
                : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-red-500/30 hover:text-white"
            }`}
          >
            {option === "partial" ? "Partial Withdrawal" : "Full Exit"}
          </button>
        ))}
      </div>

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
        max={balanceQuery.data?.balance ?? currentBalance.toString()}
        token={selectedToken ?? null}
        readOnly={mode === "full"}
        error={form.formState.errors.amount?.message as string | undefined}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Slippage
          </span>
          <span className="text-xs text-gray-400">
            Adjust for volatile markets
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[0.5, 1, 2].map(value => (
            <button
              key={value}
              type="button"
              onClick={() => form.setValue("slippage", value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                slippage === value
                  ? "border-red-500/60 bg-red-500/10 text-white"
                  : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-red-500/40 hover:text-white"
              }`}
            >
              {value}%
            </button>
          ))}
          <input
            type="number"
            value={slippage ?? ""}
            onChange={event =>
              form.setValue("slippage", Number(event.target.value))
            }
            className="w-24 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs text-white focus:border-red-500/40 focus:outline-none"
            step="0.1"
            min="0.1"
            max="50"
            aria-label="Custom slippage"
          />
        </div>
      </div>

      <TransactionSummary
        chain={selectedChain ?? null}
        token={selectedToken ?? null}
        amount={amount}
        usdAmount={usdAmount}
        actionLabel="Withdraw"
        gasEstimateUsd={3.1}
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
          gradient="from-red-500 to-pink-500"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
          className="min-w-[180px]"
        >
          {status === "submitting"
            ? "Submitting…"
            : !isConnected
              ? "Connect Wallet"
              : "Confirm Withdraw"}
        </GradientButton>
      </div>

      {result ? (
        <div
          data-testid="success-message"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100"
        >
          Withdraw simulated. Tx: {result.txHash.slice(0, 12)}…
        </div>
      ) : null}
    </TransactionModal>
  );
}
