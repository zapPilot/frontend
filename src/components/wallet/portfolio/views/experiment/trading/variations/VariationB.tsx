"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowRightCircle,
  ArrowUpCircle,
  Sparkles,
  Zap,
} from "lucide-react";

import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import { cn } from "@/lib/ui/classNames";

import { useDailySuggestion } from "@/components/wallet/portfolio/views/strategy/hooks/useDailySuggestion";
import { useStrategyConfigs } from "@/components/wallet/portfolio/views/strategy/hooks/useStrategyConfigs";
import { useTransactionData } from "@/components/wallet/portfolio/modals/hooks/useTransactionData";
import { useTransactionForm } from "@/components/wallet/portfolio/modals/hooks/useTransactionForm";
import { useTransactionSubmission } from "@/components/wallet/portfolio/modals/hooks/useTransactionSubmission";
import { formatCurrency } from "@/utils/formatters";

// --- Components ---

function ActionCard({
  title,
  desc,
  icon: Icon,
  isActive,
  onClick,
  colorClass,
}: {
  title: string;
  desc: string;
  icon: any;
  isActive: boolean;
  onClick: () => void;
  colorClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 w-full md:w-auto flex-1 group border",
        isActive
          ? `bg-gray-900 border-${colorClass}-500 shadow-lg shadow-${colorClass}-500/20 scale-[1.02]`
          : "bg-gray-900/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/60"
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-white/5 rounded-bl-full transition-opacity opacity-0 group-hover:opacity-100",
          isActive && "opacity-100"
        )}
      />

      <div
        className={cn(
          "mb-4 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
          isActive
            ? `bg-${colorClass}-500 text-white shadow-lg`
            : "bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-white"
        )}
      >
        <Icon className="w-6 h-6" />
      </div>

      <h3
        className={cn(
          "text-lg font-bold mb-1",
          isActive ? "text-white" : "text-gray-300"
        )}
      >
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>

      {isActive && (
        <div className="absolute bottom-4 right-4">
          <div
            className={`w-2 h-2 rounded-full bg-${colorClass}-500 animate-pulse`}
          />
        </div>
      )}
    </button>
  );
}

// --- Content Panels ---

function RebalanceVisuals({ userId }: { userId: string }) {
  const { data: configsResponse } = useStrategyConfigs(true);
  const defaultPresetId = useMemo(() => {
    const presets = configsResponse?.presets ?? [];
    const regimePreset = presets.find(p => p.strategy_id === "simple_regime");
    return regimePreset?.config_id ?? presets[0]?.config_id;
  }, [configsResponse]);

  const { data, isLoading } = useDailySuggestion(
    userId,
    defaultPresetId ? { config_id: defaultPresetId } : {}
  );

  if (isLoading)
    return (
      <div className="h-64 flex items-center justify-center text-indigo-400">
        Loading Strategy...
      </div>
    );
  if (!data)
    return (
      <div className="h-64 flex items-center justify-center text-rose-400">
        Unable to load strategy
      </div>
    );

  const totalValue = data.total_value_usd;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
      <div className="space-y-6">
        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Portfolio Optimization
        </h3>
        <p className="text-gray-400 leading-relaxed">
          Based on the current{" "}
          <strong>{data.regime.current.replace("_", " ")}</strong> regime, we
          recommend rebalancing to capture upside while managing risk.
        </p>

        <div className="flex gap-4">
          <div className="px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Current Value</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(totalValue)}
            </div>
          </div>
          <div className="px-4 py-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <div className="text-xs text-indigo-300 mb-1">Projected Drift</div>
            <div className="text-xl font-bold text-indigo-400">
              {(data.drift.max_drift * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transform transition-all active:scale-95 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5" />
          Align Portfolio
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-inner space-y-3">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Recommended Actions
        </h4>
        {data.trade_suggestions.map((trade, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  trade.action === "buy"
                    ? "bg-green-500/20 text-green-400"
                    : trade.action === "sell"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-700 text-gray-400"
                )}
              >
                {trade.action === "buy" ? (
                  <ArrowUpCircle className="w-5 h-5" />
                ) : trade.action === "sell" ? (
                  <ArrowDownCircle className="w-5 h-5" />
                ) : (
                  <ArrowRightCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="font-bold text-white capitalize">
                  {trade.action} {trade.bucket.replace("lp", "LP")}
                </div>
                <div className="text-xs text-gray-500">{trade.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-white">
                {formatCurrency(trade.amount_usd)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionVisuals({ mode }: { mode: "deposit" | "withdraw" }) {
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

  const isDeposit = mode === "deposit";
  const accentColor = isDeposit ? "emerald" : "rose";
  const bgGradient = isDeposit
    ? "from-emerald-900/20 to-gray-900"
    : "from-rose-900/20 to-gray-900";

  return (
    <div
      className={cn(
        "h-full rounded-3xl p-8 bg-gradient-to-br border border-gray-800 flex flex-col items-center justify-center text-center relative overflow-hidden",
        bgGradient
      )}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="max-w-md w-full space-y-8 z-10">
        <div>
          <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
            {isDeposit ? "Top Up Balance" : "Withdraw Funds"}
          </h3>
          <p className="text-gray-400">
            Select an asset to {isDeposit ? "deposit into" : "withdraw from"}{" "}
            your portfolio.
          </p>
        </div>

        {/* Graphical Asset Selector */}
        <div className="flex gap-4 justify-center py-4 overflow-x-auto">
          {transactionData.tokenQuery.data?.slice(0, 4).map(token => (
            <button
              key={token.address}
              onClick={() => form.setValue("tokenAddress", token.address)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all w-24",
                transactionData.selectedToken?.address === token.address
                  ? `bg-gray-800 ring-2 ring-${accentColor}-500 transform scale-110 shadow-xl`
                  : "bg-gray-900/50 hover:bg-gray-800"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-lg">
                {token.symbol[0]}
              </div>
              <div className="text-xs font-bold text-gray-300">
                {token.symbol}
              </div>
            </button>
          ))}
        </div>

        {/* Big Input */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-black rounded-2xl p-6 flex items-center justify-between">
            <input
              type="text"
              placeholder="0.00"
              {...form.register("amount")}
              className="bg-transparent border-none text-4xl font-bold text-white placeholder:text-gray-700 w-full outline-none"
            />
            <div className="text-gray-500 font-bold text-xl ml-4">
              {transactionData.selectedToken?.symbol || "ETH"}
            </div>
          </div>
        </div>

        <button
          onClick={() => submission.handleSubmit()}
          disabled={submission.isSubmitting}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3",
            isDeposit
              ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
              : "bg-rose-500 hover:bg-rose-400 shadow-rose-500/20"
          )}
        >
          {submission.isSubmitting ? (
            "Processing..."
          ) : (
            <>
              {isDeposit ? "Proceed to Deposit" : "Review Withdrawal"}{" "}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function VariationB({ userId }: { userId: string }) {
  const [activeMode, setActiveMode] = useState<
    "rebalance" | "deposit" | "withdraw"
  >("rebalance");

  return (
    <div className="space-y-8 h-[700px] flex flex-col">
      <div className="flex flex-col md:flex-row gap-4">
        <ActionCard
          title="Smart Rebalance"
          desc="Optimize your allocation based on AI insights."
          icon={Zap}
          isActive={activeMode === "rebalance"}
          onClick={() => setActiveMode("rebalance")}
          colorClass="indigo"
        />
        <ActionCard
          title="Quick Deposit"
          desc="Add funds to your portfolio instantly."
          icon={ArrowDownCircle}
          isActive={activeMode === "deposit"}
          onClick={() => setActiveMode("deposit")}
          colorClass="emerald"
        />
        <ActionCard
          title="Fast Withdraw"
          desc="Move assets back to your wallet."
          icon={ArrowUpCircle}
          isActive={activeMode === "withdraw"}
          onClick={() => setActiveMode("withdraw")}
          colorClass="rose"
        />
      </div>

      <div className="flex-1 bg-gray-950/50 backdrop-blur-sm rounded-3xl border border-gray-800 p-2 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-3xl" />
        <div className="h-full bg-gray-900/80 rounded-[20px] overflow-hidden p-6 relative z-10">
          {activeMode === "rebalance" && <RebalanceVisuals userId={userId} />}
          {(activeMode === "deposit" || activeMode === "withdraw") && (
            <TransactionVisuals mode={activeMode} />
          )}
        </div>
      </div>
    </div>
  );
}
