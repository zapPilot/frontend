"use client";

import { ArrowRight, Check } from "lucide-react";
import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface RebalanceModalV18Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV18({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV18Props) {
  const { isConnected } = useWalletProvider();
  const [intensity, setIntensity] = useState(100);
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();

  // Compute Projected
  const projected = useMemo(
    () =>
      transactionService.computeProjectedAllocation(
        intensity,
        currentAllocation,
        targetAllocation
      ),
    [currentAllocation, intensity, targetAllocation]
  );

  // Calculate drift reduction
  const currentDrift =
    Math.abs(currentAllocation.crypto - targetAllocation.crypto) +
    Math.abs(currentAllocation.stable - targetAllocation.stable);
  const projectedDrift =
    Math.abs(projected.crypto - targetAllocation.crypto) +
    Math.abs(projected.stable - targetAllocation.stable);
  const driftReduction =
    currentDrift > 0 ? ((1 - projectedDrift / currentDrift) * 100) : 0;

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
    } catch (e) {
      setStatus("idle");
    }
  };

  const resetState = () => {
    resetStatus();
    onClose();
  };

  const isSubmitting = status === "submitting" || status === "success";

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            Rebalance Portfolio
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
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="mb-6">
                <IntentVisualizer />
              </div>

              {status === "success" && (
                <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-3 text-indigo-400">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm font-semibold">
                    Rebalance Successfully Executed!
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Side-by-Side Comparison Grid */}
              <div className="bg-gray-900/30 rounded-2xl border border-gray-800 p-6">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                  {/* Current Column */}
                  <div className="text-center space-y-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Current
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-5xl font-black font-mono text-gray-400 tabular-nums">
                          {currentAllocation.crypto.toFixed(0)}
                          <span className="text-xl text-gray-700">%</span>
                        </div>
                        <div className="text-xs text-purple-400/50 uppercase tracking-wider mt-1">
                          Crypto
                        </div>
                      </div>
                      <div>
                        <div className="text-5xl font-black font-mono text-gray-400 tabular-nums">
                          {currentAllocation.stable.toFixed(0)}
                          <span className="text-xl text-gray-700">%</span>
                        </div>
                        <div className="text-xs text-emerald-400/50 uppercase tracking-wider mt-1">
                          Stable
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-gray-600 hidden md:block" />
                    <div className="w-full h-px bg-gray-800 md:hidden" />
                  </div>

                  {/* Projected Column */}
                  <div className="text-center space-y-4">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      Projected
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-5xl font-black font-mono text-purple-200 tabular-nums">
                          {projected.crypto.toFixed(0)}
                          <span className="text-xl text-purple-500/40">%</span>
                        </div>
                        <div className="text-xs text-purple-400 uppercase tracking-wider mt-1">
                          Crypto
                        </div>
                      </div>
                      <div>
                        <div className="text-5xl font-black font-mono text-emerald-200 tabular-nums">
                          {projected.stable.toFixed(0)}
                          <span className="text-xl text-emerald-500/40">%</span>
                        </div>
                        <div className="text-xs text-emerald-400 uppercase tracking-wider mt-1">
                          Stable
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intensity Slider with Presets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Intensity
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    {intensity}%
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={intensity}
                  onChange={e => setIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-indigo-500 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-gray-950"
                />

                {/* Quick Presets */}
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setIntensity(pct)}
                      className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                        intensity === pct
                          ? "border-indigo-500/60 bg-indigo-500/10 text-white"
                          : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-indigo-500/40 hover:text-white"
                      }`}
                    >
                      {pct === 100 ? "MAX" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delta Summary */}
              {intensity > 0 && (
                <div className="text-center">
                  <span className="text-sm font-medium text-indigo-400">
                    Reducing drift by {driftReduction.toFixed(0)}%
                  </span>
                </div>
              )}

              <GradientButton
                gradient="from-indigo-600 to-purple-600"
                className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group"
                disabled={!isConnected || intensity === 0}
                onClick={handleSubmit}
              >
                <span>
                  {(() => {
                    if (!isConnected) return "Connect Wallet";
                    if (intensity === 0) return "Set Intensity";
                    return "Confirm Rebalance";
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
