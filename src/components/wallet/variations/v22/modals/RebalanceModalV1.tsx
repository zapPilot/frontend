"use client";

import { Check, RefreshCw, Zap } from "lucide-react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface RebalanceModalV1Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV1({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV1Props) {
  const { isConnected } = useWalletProvider();
  // V1 is "Quick Action" - assumes standard intensity for simplicity or hardcoded max
  const intensity = 100; 
  const { status, setStatus, result, setResult, resetStatus } = useTransactionStatus();

  // Calculate high-level metrics
  const drift = Math.abs(currentAllocation.crypto - targetAllocation.crypto).toFixed(2);
  const isHealthy = parseFloat(drift) < 1.0; 

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
      // throw error; // Handle error UI ideally
      console.error(error);
    }
  };

  const resetState = () => {
    resetStatus();
    onClose();
  };

  const isSubmitting = status === "submitting" || status === "success";

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="sm">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        {/* Minimal Header */}
        <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
           <h3 className="font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            Quick Rebalance
          </h3>
          {!isSubmitting && (
            <button onClick={resetState} className="text-gray-400 hover:text-white">✕</button>
          )}
        </div>

        <div className="p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background decorative glow */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] -z-10 ${isHealthy ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`} />

            {isSubmitting ? (
                 <div className="animate-in fade-in zoom-in duration-300 w-full">
                 <div className="mb-6">
                   <IntentVisualizer steps={["Scanning", "Calculated", "Executing"]} />
                 </div>
                 {status === "success" && (
                   <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 justify-center">
                     <Check className="w-5 h-5 flex-shrink-0" />
                     <div className="text-sm font-semibold">Portfolio Aligned</div>
                   </div>
                 )}
               </div>
            ) : (
                <>
                {/* Main Metric: Drift */}
                <div className="mb-8 scale-110">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Current Drift</div>
                    <div className={`text-6xl font-black tracking-tighter ${isHealthy ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {drift}%
                    </div>
                </div>

                {/* Progress Bar Config */}
                <div className="w-full space-y-4 mb-8">
                     {/* Crypto Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-400">
                             <span>Crypto Allocation</span>
                             <span className="text-white">{currentAllocation.crypto.toFixed(1)}% <span className="text-gray-600">→</span> {targetAllocation.crypto}%</span>
                        </div>
                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
                             {/* Target Marker (Ghost) */}
                             <div 
                                className="absolute top-0 bottom-0 border-r-2 border-white/30 z-10" 
                                style={{ left: `${targetAllocation.crypto}%` }} 
                             />
                             {/* Current (Fill) */}
                             <div 
                                className="h-full bg-purple-500 transition-all duration-1000"
                                style={{ width: `${currentAllocation.crypto}%` }}
                             />
                        </div>
                    </div>

                    {/* Stable Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-400">
                             <span>Stable Allocation</span>
                             <span className="text-white">{currentAllocation.stable.toFixed(1)}% <span className="text-gray-600">→</span> {targetAllocation.stable}%</span>
                        </div>
                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
                              {/* Target Marker (Ghost) */}
                             <div 
                                className="absolute top-0 bottom-0 border-r-2 border-emerald-400/50 z-10" 
                                style={{ left: `${targetAllocation.stable}%` }} 
                             />
                             {/* Current */}
                             <div 
                                className="h-full bg-emerald-500 transition-all duration-1000"
                                style={{ width: `${currentAllocation.stable}%` }}
                             />
                        </div>
                    </div>
                </div>

                <GradientButton
                    gradient="from-amber-500 to-orange-600"
                    className="w-full py-4 text-lg font-bold shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 group"
                    onClick={handleSubmit}
                    disabled={isHealthy} // Disable if logic implies no need? Or let them run it anyway for tiny dust remediation
                >
                    <RefreshCw className={`w-5 h-5 ${isHealthy ? '' : 'animate-spin-slow'}`} />
                    <span>{isHealthy ? "Portfolio Aligned" : "Fix Portfolio Now"}</span>
                </GradientButton>

                {!isHealthy && (
                    <p className="mt-4 text-xs text-gray-500">
                        This operation will automatically sell overweight assets and buy underweight ones to match your target.
                    </p>
                )}
                </>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
