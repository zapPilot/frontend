"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Info, PieChart } from "lucide-react";
import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { StrategySlider } from "@/components/wallet/variations/v22/modals/components/StrategySlider";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface RebalanceModalV4Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

// Donut Chart Component
const DonutChart = ({ 
    crypto, 
    // stable, // Unused
    label, 
    subLabel 
}: { 
    crypto: number; 
    stable: number; 
    label: string; 
    subLabel?: string 
}) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    // Crypto segment (Purple)
    const cryptoOffset = circumference - (crypto / 100) * circumference;
    // Stable segment (Emerald) starts where crypto ends, but for simple 2-part donut, 
    // we can just layer them. Base circle = Stable, Top circle = Crypto.
    
    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background/Stable Circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981" // Emerald-500
                    strokeWidth="12"
                    className="opacity-20"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981" // Emerald-500
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={0} // Full circle for stable base
                    strokeLinecap="round"
                />
                
                {/* Crypto Circle (Overlay) */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#a855f7" // Purple-500
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: cryptoOffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-sm font-bold text-white">{label}</div>
                {subLabel && <div className="text-[10px] text-gray-400 uppercase tracking-wider">{subLabel}</div>}
            </div>
        </div>
    );
};

export function RebalanceModalV4({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV4Props) {
  const { isConnected } = useWalletProvider();
  const [intensity, setIntensity] = useState(100);
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();

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
            Portfolio Sectors
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
                        <div className="text-sm font-semibold">Sectors Aligned</div>
                    </div>
                   )}
                 </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {/* Donut Comparison Area */}
                    <div className="bg-gray-900/40 rounded-3xl border border-gray-800 p-6 relative overflow-hidden">
                        {/* Legend */}
                        <div className="flex justify-center gap-6 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                <span className="text-xs font-medium text-gray-300">Crypto</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-xs font-medium text-gray-300">Stable</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            {/* Current Donut */}
                            <div className="flex flex-col items-center gap-3 flex-1">
                                <DonutChart 
                                    crypto={currentAllocation.crypto} 
                                    stable={currentAllocation.stable}
                                    label={`${currentAllocation.crypto.toFixed(0)}%`}
                                    subLabel="Current"
                                />
                            </div>

                            {/* Arrow */}
                            <div className="flex flex-col items-center justify-center text-gray-600">
                                <ArrowRight className="w-6 h-6" />
                            </div>

                            {/* Target Donut */}
                            <div className="flex flex-col items-center gap-3 flex-1">
                                <DonutChart 
                                    crypto={projected.crypto} 
                                    stable={projected.stable}
                                    label={`${projected.crypto.toFixed(0)}%`}
                                    subLabel="Target"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Explainer / Drift Note */}
                    <div className="flex items-start gap-3 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-indigo-300">Reshaping Allocation</p>
                            <p className="text-xs text-indigo-400/80 leading-relaxed">
                                Aligning your portfolio sectors to the target distribution. This will optimize your exposure to both growth (Crypto) and stability (Stablecoins).
                            </p>
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
                        gradient="from-indigo-600 to-purple-600"
                        className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group"
                        onClick={handleSubmit}
                         disabled={!isConnected}
                     >
                        <span>Confirm Reshape</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
