"use client";

import { CircleDollarSign, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/ui/classNames";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";

import { useTransactionData } from "@/components/wallet/portfolio/modals/hooks/useTransactionData";
import { useTransactionForm } from "@/components/wallet/portfolio/modals/hooks/useTransactionForm";
import { useTransactionSubmission } from "@/components/wallet/portfolio/modals/hooks/useTransactionSubmission";
import { useDailySuggestion } from "@/components/wallet/portfolio/views/strategy/hooks/useDailySuggestion";
import { useStrategyConfigs } from "@/components/wallet/portfolio/views/strategy/hooks/useStrategyConfigs";
import { formatCurrency } from "@/utils/formatters";

// Import new ReviewModal and ImpactVisual
import { ActionCard } from "./components/ActionCard";
import { ImpactVisual } from "./components/ImpactVisual";
import { ReviewModal } from "./components/ReviewModal";

// --- Minimalist Components ---

function MinimalInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (e: any) => void;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="group">
      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide group-focus-within:text-indigo-500 transition-colors">
        {label}
      </label>
      <div className="flex items-baseline gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 group-focus-within:border-indigo-500 transition-all">
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="bg-transparent text-3xl font-light text-gray-900 dark:text-white w-full outline-none placeholder:text-gray-300"
          placeholder="0.00"
        />
        {suffix}
      </div>
    </div>
  );
}

// --- Updated MinimalRebalance with Modal Logic ---

function MinimalRebalance({ userId }: { userId: string }) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: configsResponse } = useStrategyConfigs(true);
  const defaultPresetId = useMemo(() => {
    const presets = configsResponse?.presets ?? [];
    const regimePreset = presets.find(p => p.strategy_id === "simple_regime");
    return regimePreset?.config_id ?? presets[0]?.config_id;
  }, [configsResponse]);

  const { data } = useDailySuggestion(
    userId,
    defaultPresetId ? { config_id: defaultPresetId } : {}
  );

  if (!data) return null;

  return (
    <>
      <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            BTC ($65k) &gt; 200 DMA ($58k)
          </div>
          <div>
            <h3 className="text-4xl font-light text-white">Portfolio Health</h3>
            <p className="text-gray-400 font-light mt-2">
              Aligned with{" "}
              <span className="text-white font-medium capitalize">
                {data.regime.current.replace("_", " ")}
              </span>{" "}
              Regime
            </p>
          </div>
        </div>

        <ActionCard
          title={`${data.trade_suggestions.length} Actions`}
          subtitle="Suggested Moves"
          icon={<CircleDollarSign className="w-6 h-6 text-gray-900 dark:text-white" />}
          footer={
            <button
              onClick={() => setIsReviewOpen(true)}
              className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity"
            >
              Review & Execute All
            </button>
          }
        >
          {/* Allocation Impact Visualization */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <ImpactVisual
              trades={data.trade_suggestions}
              totalValue={data.total_value_usd}
            />
          </div>

          <div className="space-y-6">
            {data.trade_suggestions.map((trade, i) => (
              <div
                key={i}
                className="flex items-center justify-between group cursor-default"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full transition-all group-hover:scale-150",
                      trade.action === "buy"
                        ? "bg-green-500"
                        : trade.action === "sell"
                          ? "bg-red-500"
                          : "bg-gray-400"
                    )}
                  />
                  <span className="text-lg font-light text-gray-600 dark:text-gray-300">
                    {trade.action === "buy"
                      ? "Add to"
                      : trade.action === "sell"
                        ? "Reduce"
                        : "Hold"}{" "}
                    {trade.bucket.toUpperCase()}
                  </span>
                </div>
                <span className="font-mono text-gray-900 dark:text-white font-medium">
                  {formatCurrency(trade.amount_usd)}
                </span>
              </div>
            ))}
          </div>
        </ActionCard>
      </div>

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        trades={data.trade_suggestions}
        totalValue={data.total_value_usd}
      />
    </>
  );
}

function MinimalTransaction({ mode }: { mode: "deposit" | "withdraw" }) {
  const { isConnected } = useWalletProvider();
  const form = useTransactionForm({ chainId: 1 });
  const chainId = form.watch("chainId");
  const tokenAddress = form.watch("tokenAddress");
  const amount = form.watch("amount");

  const transactionData = useTransactionData({
    isOpen: true,
    chainId,
    tokenAddress,
    amount,
  });

  const submitFn =
    mode === "deposit"
      ? transactionService.simulateDeposit
      : transactionService.simulateWithdraw;
  const submission = useTransactionSubmission(
    form,
    isConnected,
    transactionData.selectedToken,
    submitFn,
    () => {}
  );

  return (
    <div className="max-w-md mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h3 className="text-4xl font-light text-white capitalize">{mode}</h3>
        <p className="text-gray-400 font-light">
          {mode === "deposit"
            ? "Add capital to your strategy."
            : "Withdraw funds to your wallet."}
        </p>
      </div>

      <ActionCard
        footer={
          <button
            onClick={() => submission.handleSubmit()}
            disabled={submission.isSubmitting}
            className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {submission.isSubmitting
              ? "Processing..."
              : `Confirm ${mode === "deposit" ? "Deposit" : "Withdrawal"}`}
          </button>
        }
      >
        <MinimalInput
          label="Amount"
          value={amount}
          onChange={e => form.setValue("amount", e.target.value)}
          suffix={
            <span className="text-sm font-medium text-gray-400">USD</span>
          }
        />

        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Asset
          </label>
          <div className="flex flex-wrap gap-2">
            {transactionData.tokenQuery.data?.slice(0, 5).map(token => (
              <button
                key={token.address}
                onClick={() => form.setValue("tokenAddress", token.address)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all border",
                  transactionData.selectedToken?.address === token.address
                    ? "bg-gray-900 dark:bg-white text-white dark:text-black border-transparent"
                    : "bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400"
                )}
              >
                {token.symbol}
              </button>
            ))}
          </div>
        </div>
      </ActionCard>
    </div>
  );
}

export function VariationC({ userId }: { userId: string }) {
  const [activeMode, setActiveMode] = useState<
    "rebalance" | "deposit" | "withdraw"
  >("rebalance");

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-[600px] flex flex-col items-center pt-8 relative">
      {/* Segmented Control */}
      <div className="bg-white dark:bg-gray-900 p-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-800 mb-12 flex gap-1">
        {(["rebalance", "deposit", "withdraw"] as const).map(m => (
          <button
            key={m}
            onClick={() => setActiveMode(m)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all capitalize",
              activeMode === m
                ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="w-full max-w-4xl px-4 pb-20">
        {activeMode === "rebalance" && <MinimalRebalance userId={userId} />}
        {(activeMode === "deposit" || activeMode === "withdraw") && (
          <MinimalTransaction mode={activeMode} />
        )}
      </div>
    </div>
  );
}
