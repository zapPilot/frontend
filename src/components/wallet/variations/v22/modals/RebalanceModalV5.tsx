"use client";

import { ArrowRight, Check, Sliders } from "lucide-react";
import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface RebalanceModalV5Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV5({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV5Props) {
  const { isConnected } = useWalletProvider();
  const [intensity, setIntensity] = useState(100);
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();

  // Compute Projected
  const projected = useMemo(
    () => transactionService.computeProjectedAllocation(intensity, currentAllocation, targetAllocation),
    [currentAllocation, intensity, targetAllocation]
  );
  
  // Compute Drift dynamically
  const currentDrift = Math.abs(currentAllocation.crypto - targetAllocation.crypto) + Math.abs(currentAllocation.stable - targetAllocation.stable);
  const projectedDrift = Math.abs(projected.crypto - targetAllocation.crypto) + Math.abs(projected.stable - targetAllocation.stable);
  const driftReduction = (1 - (projectedDrift / currentDrift)) * 100;

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
            <Sliders className="w-4 h-4 text-blue-400" />
            Precise Adjustment
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
                        <div className="text-sm font-semibold">Adjustment Complete</div>
                    </div>
                   )}
                 </div>
            ) : (
                <div className="flex flex-col gap-10 py-4">
                    
                    {/* Big Numbers Display */}
                    <div className="flex justify-between items-end px-4">
                        <div className="text-center group">
                            <div className="text-[10px] uppercase font-bold text-purple-400/70 mb-1 tracking-widest">Crypto</div>
                            <div className="text-4xl font-black text-white tabular-nums tracking-tighter transition-all group-hover:text-purple-400">
                                {projected.crypto.toFixed(1)}<span className="text-lg text-gray-600">%</span>
                            </div>
                        </div>
                        
                        {/* Dynamic connection line/arrow? */}
                        <div className="mb-3 flex flex-col items-center gap-1">
                             <div className="text-[10px] font-bold text-gray-500">DRIFT</div>
                             <div className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${projectedDrift < 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                 {projectedDrift.toFixed(1)}%
                             </div>
                        </div>

                        <div className="text-center group">
                            <div className="text-[10px] uppercase font-bold text-emerald-400/70 mb-1 tracking-widest">Stable</div>
                            <div className="text-4xl font-black text-white tabular-nums tracking-tighter transition-all group-hover:text-emerald-400">
                                {projected.stable.toFixed(1)}<span className="text-lg text-gray-600">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Massive Slider */}
                    <div className="px-2">
                        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">
                            <span>Keep Current</span>
                            <span className={intensity === 100 ? "text-indigo-400" : ""}>Fully Align</span>
                        </div>
                        
                        <div className="relative w-full h-12 flex items-center">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                className="absolute w-full h-4 bg-gray-800 rounded-full appearance-none cursor-pointer outline-none z-20 opacity-0"
                            />
                            {/* Visual Track */}
                            <div className="absolute w-full h-4 bg-gray-800 rounded-full overflow-hidden shadow-inner pointer-events-none">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-900 to-indigo-500 transition-all duration-75 ease-out"
                                    style={{ width: `${intensity}%` }}
                                />
                            </div>
                             {/* Ticks */}
                            <div className="absolute inset-0 flex justify-between px-2 pointer-events-none z-10">
                                    {[0, 25, 50, 75, 100].map(tick => (
                                        <div key={tick} className="w-0.5 h-full bg-gray-900/30" />
                                    ))}
                            </div>

                             {/* Custom Thumb - Positioned via style */}
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] border-4 border-indigo-500 z-10 flex items-center justify-center pointer-events-none transition-all duration-75 ease-out"
                                style={{ 
                                    left: `calc(${intensity}% - 20px + (20px - ${intensity * 0.4}px))` 
                                    // Complex calc to keep thumb within bounds (approximate)
                                }}
                            >
                                <div className="w-2 h-4 border-l border-r border-gray-300" />
                            </div>
                        </div>
                        
                        {/* Feedback text below slider */}
                        <div className="mt-4 text-center h-4">
                             {intensity > 95 ? (
                                 <span className="text-xs font-bold text-emerald-400 animate-in fade-in slide-in-from-bottom-1">
                                     Perfect Alignment
                                 </span>
                             ) : intensity === 0 ? (
                                 <span className="text-xs font-bold text-gray-500 animate-in fade-in slide-in-from-bottom-1">
                                     No Action
                                 </span>
                             ) : (
                                 <span className="text-xs font-bold text-indigo-400 animate-in fade-in slide-in-from-bottom-1">
                                     Reducing Drift by {driftReduction.toFixed(0)}%
                                 </span>
                             )}
                        </div>
                    </div>

                     <GradientButton
                        gradient="from-indigo-600 to-blue-600"
                        className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group"
                        onClick={handleSubmit}
                         disabled={!isConnected || intensity === 0}
                     >
                        <span>Execute Adjustment</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
