"use client";

import { ArrowRight, Check } from "lucide-react";
import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { StrategySlider } from "@/components/wallet/variations/v22/modals/components/StrategySlider";
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
  const isSubmitting = status === "submitting" || status === "success";

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        {/* Header with purple status indicator */}
        <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            Portfolio Rebalance
          </h3>
          {!isSubmitting && (
            <button
              onClick={resetState}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-6">
          {isSubmitting ? (
            // Submission view with IntentVisualizer
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="mb-6">
                <IntentVisualizer
                  steps={["Analyze", "Rebalance", "Allocate"]}
                />
              </div>
              {status === "success" && result && (
                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3 text-purple-400">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm font-semibold">
                    Rebalance Successfully Executed!
                  </div>
                  {result.txHash && (
                    <div className="ml-auto text-xs underline cursor-pointer hover:text-purple-300">
                      View Tx
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Strategy Slider - Keep existing component */}
              <StrategySlider
                value={intensity}
                onChange={setIntensity}
                currentAllocation={currentAllocation}
                targetAllocation={targetAllocation}
                previewAllocation={previewAllocation}
              />

              {/* Impact Preview - Redesigned */}
              <div className="bg-gray-900/50 border border-purple-500/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-purple-100">
                    Impact Preview
                  </span>
                  <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-300">
                    {intensity}% Intensity
                  </span>
                </div>
                <div className="space-y-2 text-sm text-purple-100/80">
                  <div className="flex justify-between">
                    <span>APR Change:</span>
                    <span className="font-semibold text-green-400">
                      +{aprDelta.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projected Drift:</span>
                    <span className="font-semibold">
                      {Math.abs(
                        targetAllocation.crypto - previewAllocation.crypto
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Gas:</span>
                    <span className="font-semibold text-gray-400">~$3.20</span>
                  </div>
                </div>
              </div>

              {/* Transaction Value Display */}
              <div className="relative">
                <div className="absolute top-0 left-0 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Transaction Value
                </div>
                <div className="w-full bg-transparent text-4xl font-mono font-bold text-white py-6 border-b border-gray-800">
                  ${usdAmount.toLocaleString()}
                </div>
                <div className="absolute top-6 right-0 text-sm text-gray-500">
                  Based on {intensity}% intensity
                </div>
              </div>

              {/* Submit Button - Purple/Blue Gradient */}
              <GradientButton
                gradient="from-purple-600 to-blue-600"
                className="w-full py-4 text-lg font-bold shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 group"
                disabled={isSubmitDisabled}
                onClick={handleSubmit}
                testId="rebalance-submit"
              >
                <span>
                  {(() => {
                    if (!isConnected) return "Connect Wallet";
                    if (intensity === 0) return "Adjust Intensity";
                    return "Execute Rebalance";
                  })()}
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
