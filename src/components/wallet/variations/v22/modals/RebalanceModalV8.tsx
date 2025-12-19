"use client";

import { motion } from "framer-motion";
import { Check, Gauge } from "lucide-react";
import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface RebalanceModalV8Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

// Gauge Component
const ArcGauge = ({
    value,
    max = 100,
    target = 50
}: {
    value: number;
    max?: number;
    target?: number;
}) => {
    // 180 degree semi-circle
    // const radius = 80;
    
    // Map 0-100 to 0-180 degrees (but SVG strokeDash maps to length)
    // const strokeDashoffset = circumference - (value / max) * circumference;
    
    // Target marker rotation
    // 0 = -90deg, 50 = 0deg, 100 = 90deg (if center is top)
    // Actually for strokeDash, 0 starts at 9 o'clock usually. 
    // Let's rely on simple rotation mapping.
    const needleRotation = (value / max) * 180 - 90; 

    return (
      <div className="relative w-64 h-32 overflow-hidden flex justify-center mt-4">
         <svg className="w-64 h-64 -mt-32" viewBox="0 0 200 100">
             {/* Gradient Defs */}
             <defs>
                 <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#10b981" /> {/* More Stable */}
                     <stop offset="50%" stopColor="#6366f1" /> {/* Balanced */}
                     <stop offset="100%" stopColor="#a855f7" /> {/* More Crypto */}
                 </linearGradient>
             </defs>

             {/* Background Arc */}
             <path 
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#1f2937"
                strokeWidth="20"
                strokeLinecap="round"
             />

             {/* Colored Arc (Currently Projecting) */}
             {/* We want the WHOLE arc to be colored gradient, and the needle creates context */}
              <path 
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="20"
                strokeLinecap="round"
                className="opacity-80"
             />
             
             {/* Target Zone Marker (Green Area) */}
             {/* Simple white notch at target % */}
             <g transform={`rotate(${(target / 100) * 180 - 90} 100 100)`}>
                 {/* <rect x="98" y="10" width="4" height="20" fill="white" /> */}
                 <path d="M 96,10 L 104,10 L 100,24 Z" fill="white" className="drop-shadow-lg" />
             </g>

         </svg>
         
         {/* Needle (CSS Rotation for smoothness) */}
         <motion.div 
            className="absolute bottom-0 left-[50%] w-1 h-32 bg-transparent origin-bottom ml-[-2px]"
            animate={{ rotate: needleRotation }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
         >
             <div className="w-4 h-24 bg-white rounded-full mx-auto relative shadow-xl border-2 border-gray-900">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-red-500 rounded-full" />
             </div>
         </motion.div>
         
         {/* Center Hub */}
         <div className="absolute bottom-[-16px] w-8 h-8 rounded-full bg-white border-4 border-gray-900 z-10" />
      </div>
    );
}

export function RebalanceModalV8({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV8Props) {
  const { isConnected } = useWalletProvider();
  const [intensity, setIntensity] = useState(100); // 0 to 100% rebalance
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
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="sm">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        <div className="p-4 flex justify-between items-center border-b border-gray-800 bg-gray-900/40">
           <h3 className="font-bold text-white flex items-center gap-2">
             <Gauge className="w-4 h-4 text-emerald-400" />
             Balancer
           </h3>
           <button onClick={resetState} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 pt-8">
            {isSubmitting ? (
                 <div className="animate-in fade-in zoom-in duration-300">
                   <IntentVisualizer />
                   {status === "success" && (
                    <div className="mt-6 text-center text-emerald-400 font-bold">
                        <Check className="w-8 h-8 mx-auto mb-2" />
                        Guage Aligned
                    </div>
                   )}
                 </div>
            ) : (
                <div className="flex flex-col gap-8 items-center">
                    
                    {/* Gauge Visualization */}
                    <div className="relative">
                        <ArcGauge 
                            value={projected.crypto} 
                            target={targetAllocation.crypto}
                        />
                        <div className="flex justify-between w-64 mt-4 text-xs font-mono text-gray-400 uppercase">
                            <span>Stable</span>
                            <span>Balanced</span>
                            <span>Crypto</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 text-center">
                        <div>
                            <div className="text-2xl font-bold text-white">{projected.crypto.toFixed(1)}%</div>
                            <div className="text-xs text-purple-400 uppercase">Crypto</div>
                        </div>
                        <div className="w-px bg-gray-800" />
                        <div>
                            <div className="text-2xl font-bold text-white">{projected.stable.toFixed(1)}%</div>
                            <div className="text-xs text-emerald-400 uppercase">Stable</div>
                        </div>
                    </div>

                    {/* Manual Tuner via HTML Range input for "Mechanical" feel */}
                    <div className="w-full">
                        <label className="text-xs text-gray-500 font-medium ml-1">TUNING FORCE</label>
                        <input 
                            type="range"
                            min="0"
                            max="100"
                            value={intensity}
                            onChange={(e) => setIntensity(Number(e.target.value))}
                            className="w-full h-12 bg-gray-900 rounded-lg appearance-none cursor-ew-resize border border-gray-800 mt-2 px-1"
                            style={{
                                backgroundImage: "linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.05) 50%)",
                                backgroundSize: "10px 100%"
                            }}
                        />
                    </div>

                     <GradientButton
                        gradient="from-emerald-600 to-teal-600"
                        className="w-full py-3"
                        onClick={handleSubmit}
                         disabled={!isConnected}
                     >
                        Execute Adjustment
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
