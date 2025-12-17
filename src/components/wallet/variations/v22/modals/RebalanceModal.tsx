"use client";

import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui";
import { StrategySlider } from "@/components/wallet/variations/v22/modals/components/StrategySlider";
import { TransactionSummary } from "@/components/wallet/variations/v22/modals/components/TransactionSummary";
import { TransactionModal } from "@/components/wallet/variations/v22/modals/TransactionModal";
import { transactionService } from "@/services";
import { useWalletProvider } from "@/providers/WalletProvider";
import type {
  AllocationBreakdown,
  TransactionResult,
} from "@/types/domain/transaction";

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModal({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalProps) {
  const { isConnected } = useWalletProvider();
  const [intensity, setIntensity] = useState(50);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );
  const [result, setResult] = useState<TransactionResult | null>(null);

  const previewAllocation = useMemo(
    () =>
      transactionService.computeProjectedAllocation(
        intensity,
        currentAllocation,
        targetAllocation
      ),
    [currentAllocation, intensity, targetAllocation]
  );

  const aprDelta = useMemo(() => {
    const targetDrift = Math.abs(
      targetAllocation.crypto - currentAllocation.crypto
    );
    const reduction = (targetDrift * intensity) / 100;
    return reduction / 10;
  }, [currentAllocation.crypto, intensity, targetAllocation.crypto]);

  const usdAmount = useMemo(() => {
    // Mock: assume portfolio balance 0.5% adjustment per intensity
    return intensity * 10;
  }, [intensity]);

  const handleSubmit = async () => {
    setStatus("submitting");
    try {
      const response = await transactionService.simulateRebalance(
        intensity,
        currentAllocation,
        targetAllocation
      );
      setResult(response);
      setStatus("success");
    } catch (error) {
      setStatus("idle");
      throw error;
    }
  };

  const resetState = () => {
    setResult(null);
    setStatus("idle");
    onClose();
  };

  const isSubmitDisabled = status === "submitting" || !isConnected;

  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={resetState}
      title="Rebalance with Strategy Slider"
      subtitle="Choose how aggressively to rebalance. 0% = no change, 100% = full target."
      accent="primary"
      testId="rebalance-modal"
    >
      <StrategySlider
        value={intensity}
        onChange={setIntensity}
        currentAllocation={currentAllocation}
        targetAllocation={targetAllocation}
        previewAllocation={previewAllocation}
      />

      <div
        data-testid="rebalance-preview"
        className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 text-sm text-purple-50"
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold">Impact Preview</span>
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest">
            {intensity}% intensity
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-1 text-purple-100/80">
          <span>APR change: +{aprDelta.toFixed(2)}%</span>
          <span>Projected drift after: {(targetAllocation.crypto - previewAllocation.crypto).toFixed(2)}%</span>
          <span>Est. gas: ~$3.20</span>
        </div>
      </div>

      <TransactionSummary
        chain={null}
        token={null}
        amount={intensity.toString()}
        usdAmount={usdAmount}
        actionLabel="Rebalance"
        allocationAfter={previewAllocation}
        gasEstimateUsd={3.2}
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
          gradient="from-purple-500 to-blue-500"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
          className="min-w-[180px]"
        >
          {status === "submitting"
            ? "Calculating…"
            : !isConnected
              ? "Connect Wallet"
              : "Execute Rebalance"}
        </GradientButton>
      </div>

      {result ? (
        <div
          data-testid="success-message"
          className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-100"
        >
          Rebalance simulated. Tx: {result.txHash.slice(0, 12)}…
        </div>
      ) : null}
    </TransactionModal>
  );
}
