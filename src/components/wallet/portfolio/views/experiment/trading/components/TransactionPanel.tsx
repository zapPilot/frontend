"use client";

import { useMemo,useState } from "react";

import { useTransactionData } from "@/components/wallet/portfolio/modals/hooks/useTransactionData";
import { useTransactionForm } from "@/components/wallet/portfolio/modals/hooks/useTransactionForm";
import { useTransactionSubmission } from "@/components/wallet/portfolio/modals/hooks/useTransactionSubmission";
import { cn } from "@/lib/ui/classNames";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { TradeSuggestion } from "@/types/strategy";

import { ActionCard } from "./ActionCard";
import { ImpactVisual } from "./ImpactVisual";
import { ReviewModal } from "./ReviewModal";

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

export function TransactionPanel({ mode }: { mode: "deposit" | "withdraw" }) {
  const { isConnected } = useWalletProvider();
  const [isReviewOpen, setIsReviewOpen] = useState(false);

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
    () => setIsReviewOpen(false)
  );

  // Derive trade suggestion for the review modal
  const trades: TradeSuggestion[] = useMemo(() => {
    if (!amount || !tokenAddress) return [];

    // Simple heuristic for bucket/asset mapping
    const isStable = ["USDC", "USDT", "DAI"].includes(
      transactionData.selectedToken?.symbol || ""
    );
    const isSpot = ["BTC", "WBTC", "ETH", "WETH"].includes(
      transactionData.selectedToken?.symbol || ""
    );
    const bucket = isStable ? "stable" : isSpot ? "spot" : "lp";

    const price = transactionData.selectedToken?.usdPrice ?? 1;

    return [
      {
        action: mode === "deposit" ? "buy" : "sell",
        amount_usd: parseFloat(amount) * price,
        asset: transactionData.selectedToken?.symbol || "Unknown",
        bucket: bucket as any,
        reason: "User action",
        steps: [],
        from_bucket: "stable", // Mock defaults for type safety
        to_bucket: "spot",
        step_fraction: 1,
        description: "Manual transaction",
      },
    ];
  }, [amount, tokenAddress, mode, transactionData.selectedToken]);

  return (
    <>
      <div className="max-w-md mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h3 className="text-4xl font-light text-gray-900 dark:text-white capitalize">
            {mode}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 font-light">
            {mode === "deposit"
              ? "Add capital to your strategy."
              : "Withdraw funds to your wallet."}
          </p>
        </div>

        <ActionCard
          footer={
            <button
              onClick={() => setIsReviewOpen(true)}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review {mode === "deposit" ? "Deposit" : "Withdrawal"}
            </button>
          }
        >
          {/* Allocation Impact Visualization (Mocked for single txn) */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6">
            <ImpactVisual trades={trades} totalValue={10000} />
          </div>

          <MinimalInput
            label="Amount"
            value={amount}
            onChange={e => form.setValue("amount", e.target.value)}
            suffix={
              <span className="text-sm font-medium text-gray-400">USD</span>
            }
          />

          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Select Asset
            </label>
            <div className="flex flex-wrap gap-2">
              {transactionData.tokenQuery.data?.slice(0, 5).map(token => (
                <button
                  key={token.address}
                  onClick={() => form.setValue("tokenAddress", token.address)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm transition-all border font-medium",
                    transactionData.selectedToken?.address === token.address
                      ? "bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-md"
                      : "bg-gray-50 dark:bg-gray-800 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  {token.symbol}
                </button>
              ))}
            </div>
          </div>
        </ActionCard>
      </div>

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={submission.handleSubmit}
        isSubmitting={submission.isSubmitting}
        trades={trades}
        totalValue={10000} // Mock total value
        title={`Confirm ${mode === "deposit" ? "Deposit" : "Withdrawal"}`}
      />
    </>
  );
}
