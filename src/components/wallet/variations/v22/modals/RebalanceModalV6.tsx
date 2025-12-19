"use client";

import { ArrowRight, Check, MessageSquareQuote } from "lucide-react";
import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { StrategySlider } from "@/components/wallet/variations/v22/modals/components/StrategySlider";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface RebalanceModalV6Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV6({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV6Props) {
  const { isConnected } = useWalletProvider();
  const [intensity, setIntensity] = useState(100);
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();

  // Compute Projected
  const projected = useMemo(
    () => transactionService.computeProjectedAllocation(intensity, currentAllocation, targetAllocation),
    [currentAllocation, intensity, targetAllocation]
  );
  
  // Narrative Logic
  const cryptoDiff = currentAllocation.crypto - targetAllocation.crypto;
  const isCryptoOverweight = cryptoDiff > 0;
  const overweightDiff = Math.abs(cryptoDiff);
  
  const narrative = {
      state: isCryptoOverweight ? "Overweight" : "Underweight",
      asset: "Crypto",
      percent: overweightDiff.toFixed(1) + "%",
      action: isCryptoOverweight ? "Sell" : "Buy",
      target: "50/50 Split" // assuming 50/50 target for simplicity in narrative, or derive from target
  };

  const handleSubmit = async () => {
    setStatus("submitting");
    try {
        const response = await transactionService.simulateRebalance(intensity, currentAllocation, targetAllocation);
        setResult(response);
        setStatus("success");
    } catch (e) {
        setStatus("idle");
    }
  };

  const resetState = () => { resetStatus(); onClose(); };
  const isSubmitting = status === "submitting" || status === "success";

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        {/* Header */}
        <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
           <h3 className="font-bold text-white flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-blue-400" />
            Portfolio Advisor
          </h3>
          {!isSubmitting && (
            <button onClick={resetState} className="text-gray-400 hover:text-white">✕</button>
          )}
        </div>

        <div className="p-6">
            {isSubmitting ? (
                 <div className="animate-in fade-in zoom-in duration-300">
                   <div className="mb-6"><IntentVisualizer /></div>
                   {status === "success" && (
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-400">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <div className="text-sm font-semibold">Advice Executed</div>
                    </div>
                   )}
                 </div>
            ) : (
                <div className="flex flex-col gap-8">
                    
                    {/* The Narrative */}
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                            <div className="space-y-4 py-2">
                                <p className="text-lg text-gray-300 leading-relaxed font-light">
                                    You are currently <span className="font-bold text-white bg-red-500/20 px-1 rounded">{narrative.state}</span> in <span className="font-bold text-purple-400">{narrative.asset}</span> by <span className="font-bold text-white">{narrative.percent}</span>.
                                </p>
                                <p className="text-lg text-gray-300 leading-relaxed font-light">
                                    To fix this, we need to <span className={`font-bold ${isCryptoOverweight ? "text-red-400" : "text-emerald-400"}`}>{narrative.action}</span> some assets to return your portfolio to a balanced state.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Simple Impact Summary */}
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center">
                        <div className="text-center">
                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Current Drift</div>
                            <div className="text-xl font-bold text-red-400">{overweightDiff.toFixed(1)}%</div>
                        </div>
                        <ArrowRight className="text-gray-600" />
                        <div className="text-center">
                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Projected</div>
                             {/* Dynamic feedback based on slider */}
                            <div className="text-xl font-bold text-emerald-400">{(overweightDiff * (1 - intensity/100)).toFixed(1)}%</div>
                        </div>
                    </div>

                    {/* Control Slider */}
                     <StrategySlider
                        value={intensity}
                        onChange={setIntensity}
                        currentAllocation={currentAllocation}
                        targetAllocation={targetAllocation}
                        previewAllocation={projected}
                      />

                     <GradientButton
                        gradient="from-indigo-600 to-pink-600"
                        className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group"
                        onClick={handleSubmit}
                         disabled={!isConnected}
                     >
                        <span>Follow Advice</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
