"use client";

import { useMemo, useState } from "react";

import { StrategySlider } from "@/components/wallet/variations/v22/modals/components/StrategySlider";
import { ActionButtons } from "@/components/wallet/variations/v22/modals/components/TransactionFormLayout";
import { TransactionSummary } from "@/components/wallet/variations/v22/modals/components/TransactionSummary";
import { TransactionModal } from "@/components/wallet/variations/v22/modals/TransactionModal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

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
  const { status, setStatus, result, setResult, resetStatus } =
    useTransactionStatus();

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
    resetStatus();
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
      {status === "submitting" || status === "success" ? (
        <div className="animate-in fade-in zoom-in duration-300">
          <div className="mb-6">
            <IntentVisualizer steps={["Analyze", "Rebalance", "Invest"]} />
          </div>
          {result ? (
            <div
              data-testid="success-message"
              className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-100"
            >
              Rebalance simulated. Tx: {result.txHash.slice(0, 12)}…
            </div>
          ) : null}
        </div>
      ) : (
        <>
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
              <span>
                Projected drift after:{" "}
                {(targetAllocation.crypto - previewAllocation.crypto).toFixed(
                  2
                )}
                %
              </span>
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

          <ActionButtons
            gradient="from-purple-500 to-blue-500"
            disabled={isSubmitDisabled}
            isConnected={isConnected}
            status={status}
            submittingLabel="Calculating…"
            readyLabel="Execute Rebalance"
            onConfirm={handleSubmit}
            onCancel={resetState}
          />

          {result ? (
            <div
              data-testid="success-message"
              className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-100"
            >
              Rebalance simulated. Tx: {result.txHash.slice(0, 12)}…
            </div>
          ) : null}
        </>
      )}
    </TransactionModal>
  );
}
