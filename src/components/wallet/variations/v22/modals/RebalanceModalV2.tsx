"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, PieChart } from "lucide-react";
import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { StrategySlider } from "@/components/wallet/variations/v22/modals/components/StrategySlider";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface RebalanceModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV2({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV2Props) {
  const { isConnected } = useWalletProvider();
  const [intensity, setIntensity] = useState(100); // Default full rebalance
  const { status, setStatus, result, setResult, resetStatus } = useTransactionStatus();

  // Compute Projected
  const projected = useMemo(
    () => transactionService.computeProjectedAllocation(intensity, currentAllocation, targetAllocation),
    [currentAllocation, intensity, targetAllocation]
  );
  
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
            <PieChart className="w-4 h-4 text-blue-400" />
            Portfolio Projection
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
                        <div className="text-sm font-semibold">Projection Realized</div>
                    </div>
                   )}
                 </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Side-by-Side Visualizer Area */}
                    <div className="flex gap-4">
                        {/* Current State */}
                        <div className="flex-1 bg-gray-900/40 rounded-2xl border border-gray-800 p-4 relative overflow-hidden flex flex-col justify-end h-48">
                            <div className="absolute top-3 left-0 right-0 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Current</div>
                            <div className="flex items-end gap-2 h-32 px-2">
                                {/* Crypto */}
                                <div className="flex-1 flex flex-col justify-end group h-full">
                                    <motion.div 
                                        className="w-full bg-purple-500/50 border border-purple-500/30 rounded-t-sm relative"
                                        initial={false}
                                        animate={{ height: `${currentAllocation.crypto}%` }}
                                    >
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400">
                                            {currentAllocation.crypto.toFixed(0)}%
                                        </div>
                                    </motion.div>
                                    <div className="text-[10px] text-center text-gray-600 mt-1 font-bold">CRYPTO</div>
                                </div>
                                {/* Stable */}
                                <div className="flex-1 flex flex-col justify-end group h-full">
                                    <motion.div 
                                        className="w-full bg-emerald-500/50 border border-emerald-500/30 rounded-t-sm relative"
                                        initial={false}
                                        animate={{ height: `${currentAllocation.stable}%` }}
                                    >
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400">
                                            {currentAllocation.stable.toFixed(0)}%
                                        </div>
                                    </motion.div>
                                    <div className="text-[10px] text-center text-gray-600 mt-1 font-bold">STABLE</div>
                                </div>
                            </div>
                        </div>

                         {/* Arrow Indicator */}
                        <div className="flex flex-col justify-center items-center text-gray-600">
                             <ArrowRight className="w-5 h-5" />
                        </div>

                        {/* Projected State */}
                        <div className="flex-1 bg-gray-900/40 rounded-2xl border border-gray-800 p-4 relative overflow-hidden flex flex-col justify-end h-48">
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                             <div className="absolute top-3 left-0 right-0 text-center text-xs font-bold text-indigo-400 uppercase tracking-wider">New Target</div>
                            <div className="flex items-end gap-2 h-32 px-2 z-10">
                                {/* Crypto */}
                                <div className="flex-1 flex flex-col justify-end group h-full">
                                    <motion.div 
                                        className="w-full bg-purple-500 rounded-t-sm relative shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                        initial={false}
                                        animate={{ height: `${projected.crypto}%` }}
                                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    >
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white">
                                            {projected.crypto.toFixed(0)}%
                                        </div>
                                    </motion.div>
                                     <div className="text-[10px] text-center text-purple-300 mt-1 font-bold">CRYPTO</div>
                                </div>
                                {/* Stable */}
                                <div className="flex-1 flex flex-col justify-end group h-full">
                                    <motion.div 
                                        className="w-full bg-emerald-500 rounded-t-sm relative shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                        initial={false}
                                        animate={{ height: `${projected.stable}%` }}
                                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    >
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white">
                                            {projected.stable.toFixed(0)}%
                                        </div>
                                    </motion.div>
                                    <div className="text-[10px] text-center text-emerald-300 mt-1 font-bold">STABLE</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Control Slider */}
                     <StrategySlider
                        value={intensity}
                        onChange={(v) => setIntensity(v)} 
                        currentAllocation={currentAllocation}
                        targetAllocation={targetAllocation}
                        previewAllocation={projected}
                      />

                     <GradientButton
                        gradient="from-indigo-600 to-cyan-500"
                        className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group"
                        onClick={handleSubmit}
                         disabled={!isConnected}
                     >
                        <span>Align Portfolio</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
