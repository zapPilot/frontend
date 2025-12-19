"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";

interface RebalanceModalV13Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV13({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV13Props) {
  const { isConnected } = useWalletProvider();
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();
  
  // Fader state (0-100) representing how close to target we are
  const [mixLevel, setMixLevel] = useState(0);

  const handleSubmit = async () => {
    setStatus("submitting");
    try {
        const response = await transactionService.simulateRebalance(mixLevel, currentAllocation, targetAllocation);
        setResult(response);
        setStatus("success");
    } catch (e) {
        setStatus("idle");
    }
  };

  const resetState = () => { resetStatus(); onClose(); setMixLevel(0); };

  // Calculate positions
  // We want to visualize "Current" vs "Target" on vertical bars.
  // Let's make the fader control the interpolation between Current and Target.
  
  const cryptoCurrent = currentAllocation.crypto;
  const cryptoTarget = targetAllocation.crypto;
  const stableCurrent = currentAllocation.stable;
  const stableTarget = targetAllocation.stable;

  const cryptoMix = cryptoCurrent + (cryptoTarget - cryptoCurrent) * (mixLevel / 100);
  const stableMix = stableCurrent + (stableTarget - stableCurrent) * (mixLevel / 100);

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="sm">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <SlidersHorizontal className="text-pink-500" /> Mix Portfolio
            </h2>

            <div className="flex gap-8 justify-center mb-8 h-64">
                {/* Channel 1: Crypto */}
                <div className="flex flex-col items-center gap-2 w-16">
                     <div className="text-xs font-bold text-purple-400 rotate-180 mb-2 vertical-rl">CRYPTO</div>
                     <div className="relative flex-1 w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                        {/* Target Line */}
                        <div 
                            className="absolute w-full h-0.5 bg-white z-20 transition-all" 
                            style={{ bottom: `${cryptoTarget}%` }} 
                        />
                        {/* Level */}
                        <motion.div 
                            className="absolute bottom-0 w-full bg-purple-600/50"
                            style={{ height: `${cryptoMix}%` }}
                        />
                        {/* Shadow of Current */}
                        <div 
                            className="absolute bottom-0 w-full bg-purple-900/40 border-t border-purple-500/30 border-dashed"
                            style={{ height: `${cryptoCurrent}%` }}
                        />
                     </div>
                     <div className="font-mono text-xs text-purple-300">{cryptoMix.toFixed(1)}%</div>
                </div>

                {/* Master Fader (The Control) */}
                <div className="flex flex-col items-center gap-2 w-20 mx-4">
                     <div className="text-xs font-bold text-gray-400 rotate-180 mb-2 vertical-rl">MASTER</div>
                     <div className="relative flex-1 w-full bg-black rounded-full p-2 border border-gray-800 shadow-inner">
                         {/* Track marks */}
                         <div className="absolute inset-0 flex flex-col justify-between py-4 px-3 pointer-events-none opacity-20">
                             {[...Array(10)].map((_, i) => <div key={i} className="w-full h-px bg-white" />)}
                         </div>

                         {/* Slider Input */}
                         <input 
                            type="range"
                            min="0"
                            max="100"
                            value={mixLevel}
                            onChange={(e) => setMixLevel(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 -rotate-90"
                         />
                         
                         {/* Visual Thumb */}
                         <motion.div 
                            className="absolute left-2 right-2 h-12 bg-gradient-to-t from-gray-700 to-gray-600 rounded shadow-xl border border-gray-500 z-20 flex items-center justify-center pointer-events-none"
                            style={{ bottom: `calc(${mixLevel}% - 24px)` }}
                         >
                            <div className="w-8 h-1 bg-black/50 rounded-full" />
                         </motion.div>
                     </div>
                     <div className="font-mono text-xs text-white">{mixLevel}%</div>
                </div>

                {/* Channel 2: Stable */}
                <div className="flex flex-col items-center gap-2 w-16">
                     <div className="text-xs font-bold text-emerald-400 rotate-180 mb-2 vertical-rl">STABLE</div>
                     <div className="relative flex-1 w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                        {/* Target Line */}
                        <div 
                            className="absolute w-full h-0.5 bg-white z-20 transition-all" 
                            style={{ bottom: `${stableTarget}%` }} 
                        />
                        {/* Level */}
                        <motion.div 
                            className="absolute bottom-0 w-full bg-emerald-600/50"
                            style={{ height: `${stableMix}%` }}
                        />
                        {/* Shadow of Current */}
                         <div 
                            className="absolute bottom-0 w-full bg-emerald-900/40 border-t border-emerald-500/30 border-dashed"
                            style={{ height: `${stableCurrent}%` }}
                        />
                     </div>
                     <div className="font-mono text-xs text-emerald-300">{stableMix.toFixed(1)}%</div>
                </div>
            </div>

            <GradientButton
                gradient={mixLevel === 100 ? "from-pink-500 to-rose-500" : "from-gray-800 to-gray-700"}
                className="w-full"
                onClick={handleSubmit}
                disabled={!isConnected}
            >
                {status === "submitting" ? "Mixing..." : mixLevel === 100 ? "Confirm Mix" : "Slide to 100%"}
            </GradientButton>
        </div>
      </ModalContent>
    </Modal>
  );
}
