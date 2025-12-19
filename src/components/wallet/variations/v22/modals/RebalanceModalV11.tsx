"use client";

import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";

interface RebalanceModalV11Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV11({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV11Props) {
  const { isConnected } = useWalletProvider();
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();
  
  // State for the "Ballast" slider
  const [ballast, setBallast] = useState(0);

  // Calculate "Weight"
  // If Crypto is overweight (e.g. 60%), scale tips left/down.
  // drift > 0 means Crypto is Heavy. 
  // We want user to slide ballast to counteract drift.
  const drift = currentAllocation.crypto - targetAllocation.crypto;
  
  // Angle: Positive drift = Tipped Left (Negative Rotation for left pan?)
  // Let's say Scale is a beam. 
  // Crypto on Left, Stables on Right.
  // If Crypto > Stables, Left goes DOWN (Counter-clockwise rotation?).
  // Wait, standard angle: 0 is flat. 
  // Left side heavy -> Rotate Negative? (Top goes left-down).
  // Actually, let's just map drift to rotation.
  // Max drift ~20%.
  
  // Simulated Physics
  // Effective rotation = InitialDriftAngle - BallastCorrection
  const initialRotation = -drift * 2; // e.g. 10% drift -> -20deg (Left side down)
  const currentRotation = initialRotation + (ballast * (initialRotation * -1) / 100); 
  
  // Are we balanced?
  const isBalanced = Math.abs(currentRotation) < 2;

  const handleSubmit = async () => {
    setStatus("submitting");
    try {
        const response = await transactionService.simulateRebalance(ballast, currentAllocation, targetAllocation);
        setResult(response);
        setStatus("success");
    } catch (e) {
        setStatus("idle");
    }
  };

  const resetState = () => { resetStatus(); onClose(); setBallast(0); };

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-8 text-center flex justify-center items-center gap-2">
                <Scale className="text-indigo-400" /> Market Balance
            </h2>

            {/* THE SCALE VISUALIZATION */}
            <div className="relative h-48 mb-8 flex items-center justify-center">
                {/* Fulcrum */}
                <div className="absolute bottom-0 w-4 h-16 bg-gray-700/50 rounded-t-lg mx-auto z-0" />
                
                {/* The Beam */}
                <motion.div 
                    className="relative w-64 h-2 bg-gray-500 rounded-full z-10 flex items-center justify-between"
                    animate={{ rotate: currentRotation }}
                    transition={{ type: "spring", stiffness: 100, damping: 10 }}
                >
                    {/* Left Pan (Crypto) */}
                    <div className="absolute -left-4 top-1 flex flex-col items-center">
                         <div className="w-0.5 h-12 bg-gray-400" />
                         <div className="w-16 h-12 border-b-2 border-l-2 border-r-2 border-gray-400 rounded-b-xl bg-purple-500/20 backdrop-blur-sm flex items-center justify-center relative">
                            {/* Visual Weight Block */}
                            <motion.div 
                                className="w-10 h-8 bg-purple-500 rounded-sm shadow-inner"
                                style={{ scale: 1 + (drift/100) }} // Bigger if overweight
                            />
                            <div className="absolute -bottom-6 text-xs font-bold text-purple-400">Crypto</div>
                         </div>
                    </div>

                    {/* Center Point */}
                    <div className="w-4 h-4 rounded-full bg-white border-4 border-gray-900 mx-auto transform -translate-y-1/2 absolute left-1/2 top-1/2 ml-[-8px] mt-[-2px]" />

                    {/* Right Pan (Stable) */}
                    <div className="absolute -right-4 top-1 flex flex-col items-center">
                         <div className="w-0.5 h-12 bg-gray-400" />
                         <div className="w-16 h-12 border-b-2 border-l-2 border-r-2 border-gray-400 rounded-b-xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center relative">
                            {/* Visual Weight Block */}
                             <motion.div 
                                className="w-10 h-8 bg-emerald-500 rounded-sm shadow-inner"
                                style={{ scale: 1 - (drift/100) + (ballast/200) }} // Gets bigger as we add ballast
                            />
                             <div className="absolute -bottom-6 text-xs font-bold text-emerald-400">Stable</div>
                         </div>
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            {status === "success" ? (
                <div className="text-center py-8">
                    <div className="text-green-400 font-bold text-xl mb-2">Equilibrium Restored</div>
                    <button onClick={resetState} className="text-gray-500 hover:text-white underline">Close</button>
                </div>
            ) : (
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-400">Add Liquidity Ballast</span>
                        <span className="text-white font-mono font-bold">{ballast}%</span>
                    </div>
                    
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={ballast}
                        onChange={(e) => setBallast(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-6"
                    />

                    <GradientButton
                        gradient={isBalanced ? "from-green-500 to-emerald-600" : "from-gray-700 to-gray-600"}
                        className="w-full"
                        disabled={!isBalanced || !isConnected}
                        onClick={handleSubmit}
                    >
                        {isBalanced ? "Finalize Balance" : "Level the Scale"}
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
