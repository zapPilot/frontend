"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";

interface RebalanceModalV14Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV14({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV14Props) {
  const { isConnected } = useWalletProvider();
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();
  
  const [value, setValue] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Knob interaction logic
  const handleMouseDown = () => setIsDragging(true);
  
  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !knobRef.current) return;
        
        const rect = knobRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const x = e.clientX - centerX;
        const y = e.clientY - centerY;
        
        // Calculate angle
        // At 12 o'clock, angle is -90rad? No.
        // Let's use atan2(y, x).
        // 0 is right (3 o'clock). 
        // We want 0 at 7 o'clock, 100 at 5 o'clock? (Standard volume knob)
        // Or simplification: Just use vertical-ish movement or standard rotary handling.
        // Let's simplify: Vertical drag controls value.
        // Or true rotation:
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        // Normalize: -180 to 180.
        // Convert to 0-360 starting from South (6 o'clock)
        angle = (angle + 90 + 360) % 360; 
        
        // Map 0-300 degrees to 0-100 value (leaving a gap at bottom)
        let newValue = (angle / 300) * 100;
        if (angle > 300) newValue = 100; // clamp
        
        if (newValue < 0) newValue = 0;
        if (newValue > 100) newValue = 100;
        
        setValue(newValue);
    };

    if (isDragging) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }
    
    return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleSubmit = async () => {
    setStatus("submitting");
    try {
        const response = await transactionService.simulateRebalance(value, currentAllocation, targetAllocation);
        setResult(response);
        setStatus("success");
    } catch (e) {
        setStatus("idle");
    }
  };

  const resetState = () => { resetStatus(); onClose(); setValue(0); };
  
  // Knob visual rotation: Map 0-100 to -135deg to +135deg
  const rotation = -135 + (value / 100) * 270;

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="sm">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800 flex items-center justify-center">
        <div className="p-8 w-full flex flex-col items-center">
            
            {/* Display */}
            <div className="text-center mb-8">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Intensity</div>
                <div className="text-5xl font-mono font-bold text-white flex items-center justify-center">
                    {Math.round(value)}<span className="text-gray-600 text-2xl">%</span>
                </div>
            </div>

            {/* THE KNOB */}
            <div 
                ref={knobRef}
                className="w-48 h-48 rounded-full bg-gradient-to-br from-gray-800 to-black rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border-4 border-gray-900 flex items-center justify-center cursor-grapple relative"
                onMouseDown={handleMouseDown}
            >
                {/* Ticks around */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                     {[...Array(11)].map((_, i) => {
                         const tickAngle = -135 + (i * 27);
                         return (
                            <div 
                                key={i}
                                className="absolute top-1/2 left-1/2 w-full h-full"
                                style={{ transform: `translate(-50%, -50%) rotate(${tickAngle}deg)` }}
                            >
                                <div className={`w-1 h-3 mx-auto mt-1 ${i/10 <= value/100 ? 'bg-cyan-500 shadow-[0_0_8px_cyan]' : 'bg-gray-700'}`} />
                            </div>
                         );
                     })}
                </div>

                {/* Rotating Cap */}
                <motion.div 
                    className="w-32 h-32 rounded-full bg-gray-900 shadow-[0_5px_15px_rgba(0,0,0,0.8)] border border-gray-700/30 flex items-start justify-center pt-3 relative"
                    style={{ rotate: rotation }}
                >
                    {/* Indicator Dot */}
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]" />
                    
                    {/* Texture */}
                    <div className="absolute inset-0 w-full h-full rounded-full opacity-10 bg-[radial-gradient(circle,transparent_40%,#000_100%)]" />
                </motion.div>
                
                {/* Center Label */}
                <div className="absolute font-bold text-gray-600 pointer-events-none select-none">TUNER</div>
            </div>

            <div className="h-8" />

            <GradientButton
                gradient={value >= 95 ? "from-cyan-600 to-blue-600" : "from-gray-800 to-gray-700"}
                className={`w-full py-4 transition-all duration-300 ${value >= 95 ? 'shadow-[0_0_20px_rgba(6,182,212,0.3)]' : ''}`}
                onClick={handleSubmit}
                disabled={!isConnected}
            >
                {status === "submitting" ? <RefreshCw className="animate-spin" /> : value >= 95 ? "ENGAGE" : "TURN TO 100%"}
            </GradientButton>

        </div>
      </ModalContent>
    </Modal>
  );
}
