"use client";

import { useMemo, useState } from "react";

import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { AlertCircle } from "lucide-react";

import { useDailySuggestion } from "@/components/wallet/portfolio/views/strategy/hooks/useDailySuggestion";
import { useStrategyConfigs } from "@/components/wallet/portfolio/views/strategy/hooks/useStrategyConfigs";
import { AllocationComparison } from "@/components/wallet/portfolio/views/strategy/components/suggestion/AllocationComparison";
import { TradeSuggestionsCard } from "@/components/wallet/portfolio/views/strategy/components/suggestion/TradeSuggestionsCard";

// Imports for Transaction Logic
import { TransactionModalContent } from "@/components/wallet/portfolio/modals/components/TransactionModalSelectors";
import { useTransactionData } from "@/components/wallet/portfolio/modals/hooks/useTransactionData";
import { useTransactionDropdownState } from "@/components/wallet/portfolio/modals/hooks/useTransactionDropdownState";
import { useTransactionForm } from "@/components/wallet/portfolio/modals/hooks/useTransactionForm";
import { useTransactionSubmission } from "@/components/wallet/portfolio/modals/hooks/useTransactionSubmission";
import { buildModalFormState } from "@/components/wallet/portfolio/modals/utils/modalHelpers";
import * as modalDeps from "@/components/wallet/portfolio/modals/transactionModalDependencies";
import { transactionService } from "@/services";
import { useWalletProvider } from "@/providers/WalletProvider";

type TradingMode = "rebalance" | "deposit" | "withdraw";

interface TradingViewProps {
  userId: string | undefined;
}

// --- Rebalance View ---
function RebalanceSection({ userId }: { userId: string }) {
  const { data: configsResponse } = useStrategyConfigs(true);

  const defaultPresetId = useMemo(() => {
    const presets = configsResponse?.presets ?? [];
    const regimePreset = presets.find(p => p.strategy_id === "simple_regime");
    return regimePreset?.config_id ?? presets[0]?.config_id;
  }, [configsResponse]);

  const suggestionParams = defaultPresetId
    ? { config_id: defaultPresetId }
    : {};
  const { data, isLoading, error } = useDailySuggestion(
    userId,
    suggestionParams
  );

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading strategy analysis...
      </div>
    );
  if (error || !data)
    return (
      <div className="p-8 text-center text-rose-400">
        Failed to load strategy data
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Allocation Analysis
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            This is how we plan to rebalance your portfolio to match the target
            allocation for the current regime.
          </p>
          <AllocationComparison
            current={data.current_allocation}
            target={data.target_allocation}
            targetName={data.target_name}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-6 h-full">
          <TradeSuggestionsCard
            trades={data.trade_suggestions ?? []}
            pacing={data.pacing ?? null}
            patternReason={data.pattern_reason}
          />
        </div>
      </div>
    </div>
  );
}

// --- Transaction View (Shared for Deposit/Withdraw) ---
function TransactionSection({
  mode,
  onClose,
}: {
  mode: "deposit" | "withdraw";
  onClose?: () => void;
}) {
  const { isConnected } = useWalletProvider();

  // 1. Form & State Hooks
  const form = useTransactionForm({
    chainId: 1, // Default chain
    slippage: mode === "withdraw" ? 0.5 : undefined,
  });

  const dropdownState = useTransactionDropdownState();

  const chainId = form.watch("chainId");
  const tokenAddress = form.watch("tokenAddress");
  const amount = form.watch("amount");

  // 2. Data Fetching
  const transactionData = useTransactionData({
    isOpen: true, // Always open in this view
    chainId,
    tokenAddress,
    amount,
  });

  // 3. Submission Logic
  const submitFn =
    mode === "deposit"
      ? transactionService.simulateDeposit
      : transactionService.simulateWithdraw;

  const submission = useTransactionSubmission(
    form,
    isConnected,
    transactionData.selectedToken,
    submitFn,
    onClose || (() => {})
  );

  // 4. Helper Logic (copied from Modals)
  const { handlePercentage, isValid } = buildModalFormState(form, () =>
    parseFloat(
      mode === "deposit"
        ? transactionData.balanceQuery.data?.balance || "0"
        : transactionData.balances[tokenAddress || ""]?.balance || "0"
    )
  );

  const hasSelectedToken = Boolean(transactionData.selectedToken);
  const actionLabel = modalDeps.resolveActionLabel({
    isConnected,
    hasSelection: hasSelectedToken,
    isReady: isValid,
    selectionLabel: "Select Asset",
    notReadyLabel: "Enter Amount",
    readyLabel: mode === "deposit" ? "Review & Deposit" : "Review & Withdraw",
  });

  // 5. Construct Render State
  const modalState = {
    form,
    chainId,
    amount,
    transactionData,
    selectedChain: transactionData.selectedChain,
    isSubmitting: submission.isSubmitting,
    isSubmitDisabled: submission.isSubmitDisabled,
    handleSubmit: submission.handleSubmit,
  };

  // 6. Asset Content Render (Specific to mode)
  const assetContent =
    mode === "deposit" ? (
      // Deposit Style: List all tokens
      <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
        {transactionData.tokenQuery.data?.map(token => {
          const isSelected =
            transactionData.selectedToken?.address === token.address;
          const balance = transactionData.balanceQuery.data?.balance || "0";
          return (
            <modalDeps.TokenOptionButton
              key={token.address}
              symbol={token.symbol}
              balanceLabel={`${balance} available`}
              isSelected={isSelected}
              onSelect={() => {
                form.setValue("tokenAddress", token.address);
                dropdownState.closeDropdowns();
              }}
            />
          );
        })}
        {(!transactionData.tokenQuery.data ||
          transactionData.tokenQuery.data.length === 0) && (
          <modalDeps.EmptyAssetsMessage />
        )}
      </div>
    ) : (
      // Withdraw Style: Categorized
      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {/* Simplified for this view - just listing tokens for now to save complexity of replicating CATEGORIES */}
        {transactionData.tokenQuery.data?.map(token => {
          const isSelected =
            transactionData.selectedToken?.address === token.address;
          const bal = transactionData.balances[token.address]?.balance || "0";
          return (
            <modalDeps.TokenOptionButton
              key={token.address}
              symbol={token.symbol}
              balanceLabel={`${bal} available`}
              isSelected={isSelected}
              onSelect={() => {
                form.setValue("tokenAddress", token.address);
                dropdownState.closeDropdowns();
              }}
            />
          );
        })}
      </div>
    );

  return (
    <div className="max-w-md mx-auto bg-gray-950 border border-gray-800 rounded-xl overflow-visible p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white capitalize">
          {mode} Assets
        </h3>
        <div
          className={`w-2 h-2 rounded-full ${mode === "deposit" ? "bg-green-500" : "bg-indigo-500"} shadow-[0_0_10px_currentColor]`}
        />
      </div>

      <TransactionModalContent
        modalState={modalState}
        dropdownState={dropdownState}
        actionLabel={actionLabel}
        actionGradient={
          mode === "deposit"
            ? "from-indigo-600 to-purple-600"
            : "from-indigo-600 to-violet-600"
        }
        handlePercentage={handlePercentage}
        assetContent={assetContent}
      />

      {submission.status === "success" && (
        <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-center text-sm font-medium">
          Transaction Executed Successfully!
        </div>
      )}
    </div>
  );
}

export function TradingView({ userId }: TradingViewProps) {
  const [mode, setMode] = useState<TradingMode>("rebalance");

  if (!userId) {
    return (
      <EmptyStateCard
        icon={AlertCircle}
        message="Connect wallet to access trading"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-gray-900/50 p-1 rounded-xl border border-gray-800 inline-flex">
          {(["rebalance", "deposit", "withdraw"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`
                px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all
                ${
                  mode === m
                    ? "bg-gray-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }
              `}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {mode === "rebalance" && <RebalanceSection userId={userId} />}
        {mode === "deposit" && <TransactionSection mode="deposit" />}
        {mode === "withdraw" && <TransactionSection mode="withdraw" />}
      </div>
    </div>
  );
}
