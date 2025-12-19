"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";

interface RebalanceModalV15Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV15({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV15Props) {
  const { isConnected } = useWalletProvider();
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();
  
  const [mode, setMode] = useState<"current" | "target">("current");

  const handleSubmit = async () => {
    setStatus("submitting");
    try {
        const response = await transactionService.simulateRebalance(100, currentAllocation, targetAllocation);
        setResult(response);
        setStatus("success");
    } catch (e) {
        setStatus("idle");
    }
  };

  const resetState = () => { resetStatus(); onClose(); setMode("current"); };

  // Data for Treemap
  // We just have 2 blocks: Crypto & Stable.
  const data = mode === "current" ? currentAllocation : targetAllocation;
  
  // Drift calculation
  const cryptoDrift = currentAllocation.crypto - targetAllocation.crypto; // Positive means Crypto is too big

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <LayoutGrid size={18} className="text-orange-500" /> Area Map
                </h2>
                
                {/* Toggle */}
                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                    <button 
                        onClick={() => setMode("current")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === "current" ? "bg-gray-700 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        Current
                    </button>
                    <button 
                        onClick={() => setMode("target")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === "target" ? "bg-orange-600 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        Target
                    </button>
                </div>
            </div>

            {/* Treemap Container */}
            <div className="h-64 w-full bg-gray-900 rounded-xl overflow-hidden flex flex-col md:flex-row relative border border-gray-800">
                <AnimatePresence mode="wait">
                    {/* Block 1: Crypto */}
                    <motion.div 
                        layout
                        initial={false}
                        animate={{ flex: data.crypto }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        className="bg-purple-900/40 relative group border-r border-gray-800 md:h-full h-auto min-h-[40px] flex items-center justify-center p-4"
                    >
                         <div className="text-center">
                            <div className="text-purple-400 font-bold text-lg">Crypto</div>
                            <div className="text-purple-300/60 font-mono text-sm">{data.crypto.toFixed(1)}%</div>
                         </div>
                         
                         {/* Drift Shadow Indicator */}
                         {mode === "current" && cryptoDrift > 0 && (
                            <div className="absolute right-0 top-0 bottom-0 bg-red-500/10 w-4 border-l border-red-500/30 flex items-center justify-center">
                                <span className="text-[10px] text-red-400 -rotate-90 whitespace-nowrap">Excess</span>
                            </div>
                         )}
                    </motion.div>

                    {/* Block 2: Stable */}
                     <motion.div 
                        layout
                        initial={false}
                        animate={{ flex: data.stable }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        className="bg-emerald-900/40 relative group md:h-full h-auto min-h-[40px] flex items-center justify-center p-4"
                    >
                         <div className="text-center">
                            <div className="text-emerald-400 font-bold text-lg">Stable</div>
                            <div className="text-emerald-300/60 font-mono text-sm">{data.stable.toFixed(1)}%</div>
                         </div>

                          {/* Drift Shadow Indicator */}
                         {mode === "current" && cryptoDrift < 0 && ( /* Means stable is too heavy? No, if cryptoDrift < 0, crypto is too small, so stable is too big */
                            <div className="absolute left-0 top-0 bottom-0 bg-red-500/10 w-4 border-r border-red-500/30 flex items-center justify-center">
                                <span className="text-[10px] text-red-400 -rotate-90 whitespace-nowrap">Excess</span>
                            </div>
                         )}
                    </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 rounded-xl" />
            </div>
            
            <div className="mt-4 mb-6 flex justify-between text-sm text-gray-400 px-2">
                <div>Drift: <span className="text-white font-mono">{cryptoDrift.toFixed(1)}%</span></div>
                <div>Fee: <span className="text-white font-mono">~$4.20</span></div>
            </div>

            <GradientButton
                gradient="from-orange-600 to-red-600"
                className="w-full"
                onClick={handleSubmit}
                disabled={!isConnected}
            >
                {status === "submitting" ? "Resizing..." : mode === "current" ? "Resize to Fit Target" : "Confirm Target Layout"}
            </GradientButton>
        </div>
      </ModalContent>
    </Modal>
  );
}
