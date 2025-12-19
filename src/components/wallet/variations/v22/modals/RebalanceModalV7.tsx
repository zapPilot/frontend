"use client";

import { motion } from "framer-motion";
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

interface RebalanceModalV7Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

// Unified Donut Chart Component
const UnifiedDonutChart = ({ 
    currentCrypto, 
    targetCrypto,
    label, 
    subLabel 
}: { 
    currentCrypto: number; 
    targetCrypto: number;
    label: string; 
    subLabel?: string 
}) => {
    const radius = 60; // Larger for single view
    const circumference = 2 * Math.PI * radius;
    
    const currentOffset = circumference - (currentCrypto / 100) * circumference;
    const targetOffset = circumference - (targetCrypto / 100) * circumference;
    
    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Legend / Tooltips could go here, keeping it simple for V7 */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                {/* 1. Base Track (Stable - Emerald) */}
                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#059669" // Emerald-600 (Darker base)
                    strokeWidth="16"
                    className="opacity-20"
                />

                {/* 2. Target Indicator (Ghost / Dashed Ring) */}
                {/* Shows where the purple line SHOULD end */}
                 <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#6366f1" // Indigo-500 (Target Color)
                    strokeWidth="16"
                    strokeDasharray="4 4" // Dashed
                    strokeDashoffset={targetOffset} 
                    // To show a "slice" of target, we'd need complex path logic.
                    // For simplicity in V7, let's represent target as a thin solid ring 
                    // OUTSIDE or INSIDE the main chart, or just the main bar animating to it.
                    // Let's try: Target is a thin separate ring *inside* the main one.
                    className="opacity-0" // Hiding this attempt, switching strategy below
                />

                {/* Strategy B: Inner Ring = Target, Outer = Current */}
                
                {/* Inner Ring: Target Allocation */}
                <circle 
                    cx="70" cy="70" r={radius - 12}
                    fill="transparent"
                    stroke="#374151" // Gray-700 background
                    strokeWidth="6"
                />
                <circle 
                    cx="70" cy="70" r={radius - 12}
                    fill="transparent"
                    stroke="#10b981" // Emerald-500 (Target Stable)
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * (radius - 12)}
                    // strokeDashoffset... actually let's keep V7 REALLY simple.
                    // Just ONE main donut that animates from Current -> Projected based on slider.
                    className="opacity-50"
                 />

                 {/* Reverting to SINGLE Donut that morphs. 
                     "Streamlined" usually means less cognitive load.
                     We will show Current state, and the slider moves it to Target.
                     We add a small "marker" for the target.
                 */}

                 {/* Background (Stable) */}
                 <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#059669" // Emerald-600
                    strokeWidth="20"
                    className="opacity-30"
                 />
                 
                 {/* Foreground (Crypto) */}
                 <motion.circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#a855f7" // Purple-500
                    strokeWidth="20"
                    strokeDasharray={circumference}
                    strokeDashoffset={currentOffset} // Starts at Current
                    initial={{ strokeDashoffset: currentOffset }}
                    animate={{ strokeDashoffset: currentOffset }} // We will control this via props if we want animation
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                />

                {/* Target Marker (White Line) */}
                {/* We calculate rotation for the marker based on target % */}
                {/* 360 * (targetCrypto / 100) */}
                 <g transform={`rotate(${ (targetCrypto / 100) * 360 } 70 70)`}>
                    <rect 
                        x="70" 
                        y={70 - radius - 12} 
                        width="4" 
                        height="24" 
                        fill="white" 
                        rx="2"
                        className="shadow-sm"
                    />
                 </g>

            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-3xl font-bold text-white tracking-tighter">{label}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{subLabel}</div>
            </div>
        </div>
    );
};

export function RebalanceModalV7({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV7Props) {
  const { isConnected } = useWalletProvider();
  const [intensity, setIntensity] = useState(100);
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();

  // Compute Projected based on intensity
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
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="sm">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        
        {/* Simplified Header */}
        <div className="p-6 pb-0 flex justify-between items-start">
           <div>
             <h3 className="text-xl font-bold text-white mb-1">Align Portfolio</h3>
             <p className="text-sm text-gray-400">Targeting {targetAllocation.crypto}% Crypto / {targetAllocation.stable}% Stable</p>
           </div>
           {!isSubmitting && (
             <button onClick={resetState} className="text-gray-500 hover:text-white transition-colors">✕</button>
           )}
        </div>

        <div className="p-6">
            {isSubmitting ? (
                 <div className="animate-in fade-in zoom-in duration-300 py-8">
                   <div className="mb-6"><IntentVisualizer /></div>
                   {status === "success" && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-400 mb-3">
                            <Check className="w-6 h-6" />
                        </div>
                        <p className="text-white font-medium">Rebalance Complete</p>
                    </div>
                   )}
                 </div>
            ) : (
                <div className="flex flex-col gap-8">
                    
                    {/* Unified Chart Section */}
                    <div className="flex flex-col items-center justify-center py-4">
                        <UnifiedDonutChart 
                            currentCrypto={projected.crypto} // We show the PROJECTED value as user slides!
                            targetCrypto={targetAllocation.crypto}
                            label={`${projected.crypto.toFixed(0)}%`}
                            subLabel="Crypto Exposure"
                        />
                        
                        {/* Legend */}
                         <div className="flex items-center gap-6 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                <span className="text-xs text-gray-400">Current</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <div className="w-1 h-3 bg-white rounded-full" />
                                <span className="text-xs text-gray-400">Target</span>
                            </div>
                        </div>
                    </div>

                    {/* Slider */}
                    <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
                         <StrategySlider
                            value={intensity}
                            onChange={setIntensity}
                            currentAllocation={currentAllocation}
                            targetAllocation={targetAllocation}
                            previewAllocation={projected}
                          />
                    </div>

                    {/* Action */}
                     <GradientButton
                        gradient="from-indigo-600 to-violet-600"
                        className="w-full py-4 text-base font-bold shadow-lg shadow-indigo-500/20 group"
                        onClick={handleSubmit}
                         disabled={!isConnected}
                     >
                       <span className="flex items-center justify-center gap-2">
                         Confirm Rebalance
                         <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                       </span>
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
