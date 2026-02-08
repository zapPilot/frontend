"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  DollarSign,
  Download,
  Layers,
  RefreshCw,
  TrendingUp,
  Wallet,
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

function StatItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
        {label}
      </span>
      <span className="text-sm font-mono text-white font-medium">{value}</span>
      {sub && (
        <span className="text-[10px] text-gray-600 font-mono">{sub}</span>
      )}
    </div>
  );
}

function TokenRow({
  symbol,
  balance,
  isSelected,
  onSelect,
}: {
  symbol: string;
  balance: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors text-left group border border-transparent",
        isSelected ? "bg-gray-800 border-gray-700" : ""
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-gray-700 flex items-center justify-center text-[10px] text-gray-400 font-bold group-hover:bg-gray-600 group-hover:text-white transition-colors">
          {symbol[0]}
        </div>
        <span
          className={cn(
            "text-xs font-mono",
            isSelected
              ? "text-white font-bold"
              : "text-gray-400 group-hover:text-gray-300"
          )}
        >
          {symbol}
        </span>
      </div>
      <span className="text-[10px] font-mono text-gray-500">{balance}</span>
    </button>
  );
}

// --- Sections ---

function RebalancePanel({ userId }: { userId: string }) {
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
      <div className="text-xs font-mono text-gray-500 animate-pulse">
        LOADING MARKET DATA...
      </div>
    );
  if (!data)
    return <div className="text-xs font-mono text-rose-500">DATA ERROR</div>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-3 rounded">
          <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">
            Current Allocation
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${data.current_allocation.spot * 100}%` }}
              className="bg-orange-500/50 h-full"
            />
            <div
              style={{ width: `${data.current_allocation.lp * 100}%` }}
              className="bg-purple-500/50 h-full"
            />
            <div
              style={{ width: `${data.current_allocation.stable * 100}%` }}
              className="bg-emerald-500/50 h-full"
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-mono text-gray-400">
            <span>SPOT</span>
            <span>LP</span>
            <span>STABLE</span>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-3 rounded relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
          </div>
          <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">
            Target Allocation
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${data.target_allocation.spot * 100}%` }}
              className="bg-orange-500 h-full"
            />
            <div
              style={{ width: `${data.target_allocation.lp * 100}%` }}
              className="bg-purple-500 h-full"
            />
            <div
              style={{ width: `${data.target_allocation.stable * 100}%` }}
              className="bg-emerald-500 h-full"
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-mono text-white">
            <span>{(data.target_allocation.spot * 100).toFixed(0)}%</span>
            <span>{(data.target_allocation.lp * 100).toFixed(0)}%</span>
            <span>{(data.target_allocation.stable * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-[10px] text-gray-500 font-mono uppercase">
              <th className="pb-2 font-normal">Action</th>
              <th className="pb-2 font-normal">Asset</th>
              <th className="pb-2 font-normal text-right">Value (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {data.trade_suggestions.map((trade, i) => (
              <tr
                key={i}
                className="group hover:bg-gray-900/50 transition-colors"
              >
                <td className="py-2.5">
                  <span
                    className={cn(
                      "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                      trade.action === "buy"
                        ? "bg-green-500/10 text-green-400"
                        : trade.action === "sell"
                          ? "bg-red-500/10 text-red-400"
                          : "text-gray-500"
                    )}
                  >
                    {trade.action.toUpperCase()}
                  </span>
                </td>
                <td className="py-2.5 text-xs font-mono text-gray-300">
                  {trade.bucket === "spot"
                    ? "BTC/ETH"
                    : trade.bucket === "lp"
                      ? "LP POS"
                      : "USDC"}
                </td>
                <td className="py-2.5 text-xs font-mono text-white text-right">
                  {formatCurrency(trade.amount_usd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-sm py-3 rounded border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
        <RefreshCw className="w-4 h-4" /> Execute Rebalance Plan
      </button>
    </div>
  );
}

function TransactionPanel({ mode }: { mode: "deposit" | "withdraw" }) {
  const { isConnected } = useWalletProvider();

  const form = useTransactionForm({
    chainId: 1,
    slippage: mode === "withdraw" ? 0.5 : undefined,
  });

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
    () => {} // No close handler needed
  );

  const isDeposit = mode === "deposit";

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Token List */}
      <div className="bg-gray-900 border border-gray-800 rounded flex-1 flex flex-col overflow-hidden">
        <div className="p-2 border-b border-gray-800 bg-gray-950 text-[10px] font-mono text-gray-500 uppercase tracking-wider flex justify-between items-center">
          <span>Select Asset</span>
          <span className="text-indigo-400">ETH Chain</span>
        </div>
        <div className="overflow-y-auto p-1 custom-scrollbar flex-1">
          {transactionData.tokenQuery.data?.map(token => {
            const isSelected =
              transactionData.selectedToken?.address === token.address;
            const balance = isDeposit
              ? transactionData.balanceQuery.data?.balance
              : transactionData.balances[token.address]?.balance;

            return (
              <TokenRow
                key={token.address}
                symbol={token.symbol}
                balance={balance || "0.00"}
                isSelected={isSelected}
                onSelect={() => form.setValue("tokenAddress", token.address)}
              />
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded p-4 group focus-within:border-indigo-500/50 focus-within:bg-gray-900/80 transition-all">
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase">
              Amount
            </label>
            <span className="text-[10px] font-mono text-gray-400">
              Max:{" "}
              {isDeposit
                ? transactionData.balanceQuery.data?.balance
                : transactionData.balances[tokenAddress || ""]?.balance || "0"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono text-gray-500">$</span>
            <input
              type="text"
              className="bg-transparent border-none outline-none text-2xl font-mono text-white w-full placeholder:text-gray-700"
              placeholder="0.00"
              {...form.register("amount")}
            />
            {transactionData.selectedToken && (
              <div className="bg-gray-800 px-2 py-1 rounded text-xs font-mono text-gray-300">
                {transactionData.selectedToken.symbol}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map(pct => (
            <button
              key={pct}
              type="button"
              onClick={() => {
                const max = parseFloat(
                  isDeposit
                    ? transactionData.balanceQuery.data?.balance || "0"
                    : transactionData.balances[tokenAddress || ""]?.balance ||
                        "0"
                );
                form.setValue("amount", (max * (pct / 100)).toString());
              }}
              className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-500 hover:text-white text-xs font-mono py-1 rounded transition-colors"
            >
              {pct}%
            </button>
          ))}
        </div>

        <button
          onClick={() => submission.handleSubmit()}
          disabled={submission.isSubmitting || submission.isSubmitDisabled}
          className={cn(
            "w-full font-mono text-sm py-3 rounded border shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide",
            isDeposit
              ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white"
              : "bg-rose-600 hover:bg-rose-500 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] text-white",
            (submission.isSubmitting || submission.isSubmitDisabled) &&
              "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {submission.isSubmitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isDeposit ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {isDeposit ? "Deposit Funds" : "Confirm Withdrawal"}
        </button>

        {submission.status === "success" && (
          <div className="text-center text-xs font-mono text-green-400 bg-green-500/10 py-2 rounded border border-green-500/20 animate-in fade-in">
            TRANSACTION CONFIRMED: {submission.result?.txHash?.slice(0, 8)}...
          </div>
        )}
      </div>
    </div>
  );
}

export function VariationA({ userId }: { userId: string }) {
  const [activeMode, setActiveMode] = useState<
    "rebalance" | "deposit" | "withdraw"
  >("rebalance");

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px] bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-2xl relative overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Sidebar Navigation */}
      <div className="md:col-span-3 flex flex-col gap-2 border-r border-gray-800 pr-4 z-10">
        <div className="mb-6 px-2">
          <div className="text-xs font-mono text-gray-500 mb-1">
            TERMINAL v2.4
          </div>
          <div className="text-white font-bold font-mono tracking-tighter text-xl">
            EXECUTION<span className="text-indigo-500">.</span>LAYER
          </div>
        </div>

        <button
          onClick={() => setActiveMode("rebalance")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all text-left group border border-transparent",
            activeMode === "rebalance"
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-900"
          )}
        >
          <RefreshCw
            className={cn(
              "w-4 h-4",
              activeMode === "rebalance" && "animate-spin-slow"
            )}
          />
          <span className="flex-1">REBALANCE</span>
          {activeMode === "rebalance" && (
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveMode("deposit")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all text-left group border border-transparent",
            activeMode === "deposit"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-900"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="flex-1">DEPOSIT</span>
          {activeMode === "deposit" && (
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveMode("withdraw")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all text-left group border border-transparent",
            activeMode === "withdraw"
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-900"
          )}
        >
          <Download className="w-4 h-4" />
          <span className="flex-1">WITHDRAW</span>
          {activeMode === "withdraw" && (
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
          )}
        </button>

        <div className="mt-auto p-4 bg-gray-900/50 rounded border border-gray-800 space-y-3">
          <StatItem label="Network" value="Ethereum" sub="Mainnet" />
          <StatItem label="Gas Price" value="12 Gwei" sub="Low Congestion" />
          <StatItem label="Latency" value="24ms" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:col-span-9 flex flex-col z-10">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
          <h2 className="text-xl font-mono text-white flex items-center gap-2">
            {activeMode === "rebalance" && (
              <Layers className="w-5 h-5 text-indigo-500" />
            )}
            {activeMode === "deposit" && (
              <DollarSign className="w-5 h-5 text-emerald-500" />
            )}
            {activeMode === "withdraw" && (
              <Wallet className="w-5 h-5 text-rose-500" />
            )}
            <span className="uppercase tracking-widest">
              {activeMode} MODULE
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-green-500 uppercase">
              System Online
            </span>
          </div>
        </div>

        <div className="flex-1 bg-gray-900/20 rounded-lg border border-gray-800 p-1 relative overflow-hidden">
          {/* Content Inner */}
          <div className="absolute inset-0 p-6 overflow-hidden">
            {activeMode === "rebalance" && <RebalancePanel userId={userId} />}
            {(activeMode === "deposit" || activeMode === "withdraw") && (
              <TransactionPanel mode={activeMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
