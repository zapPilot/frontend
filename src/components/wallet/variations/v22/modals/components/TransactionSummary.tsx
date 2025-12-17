"use client";

import type {
  AllocationBreakdown,
  ChainData,
  TransactionToken,
} from "@/types/domain/transaction";

interface TransactionSummaryProps {
  chain?: ChainData | null;
  token?: TransactionToken | null;
  amount: string;
  usdAmount: number;
  gasEstimateUsd?: number;
  allocationAfter?: AllocationBreakdown | undefined;
  actionLabel: string;
}

export function TransactionSummary({
  chain,
  token,
  amount,
  usdAmount,
  gasEstimateUsd = 2.5,
  allocationAfter,
  actionLabel,
}: TransactionSummaryProps) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          {actionLabel} Summary
        </h3>
        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-200">
          Mock
        </span>
      </div>

      <div className="mt-3 space-y-2 text-sm text-gray-300">
        <div className="flex justify-between">
          <span>Amount</span>
          <span className="font-semibold text-white">
            {amount || "0"} {token?.symbol ?? ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Value</span>
          <span className="font-semibold text-white">
            ${usdAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
        {chain ? (
          <div className="flex justify-between">
            <span>Chain</span>
            <span className="font-semibold text-white">
              {chain.name} ({chain.symbol})
            </span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Estimated Gas</span>
          <span className="font-semibold text-white">
            ~${gasEstimateUsd.toFixed(2)}
          </span>
        </div>
      </div>

      {allocationAfter ? (
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900/80 p-3 text-xs text-gray-400">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Allocation After
          </div>
          <div className="flex items-center justify-between">
            <span className="text-emerald-300 font-semibold">
              Stable {allocationAfter.stable.toFixed(1)}%
            </span>
            <span className="text-purple-300 font-semibold">
              Crypto {allocationAfter.crypto.toFixed(1)}%
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
