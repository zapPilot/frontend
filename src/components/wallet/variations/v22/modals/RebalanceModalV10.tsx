"use client";

import { motion } from "framer-motion";
import { Check, Play, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";

interface RebalanceModalV10Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV10({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV10Props) {
  const { isConnected } = useWalletProvider();
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Terminal Logic
  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> ${msg}`]);
  };

  useEffect(() => {
    if (isOpen && status === "idle") {
        setLogs(["> SYSTEM_INIT...", "> CONNECTED: " + (isConnected ? "YES" : "NO")]);
        
        // Simulation sequence
        setTimeout(() => addLog("SCANNING_PORTFOLIO..."), 500);
        setTimeout(() => addLog(`DETECTED_DRIFT: Crypto ${currentAllocation.crypto.toFixed(1)}% -> ${targetAllocation.crypto.toFixed(1)}%`), 1200);
        setTimeout(() => addLog("OPTIMIZATION_REQUIRED: YES"), 2000);
        setTimeout(() => addLog("AWAITING_USER_AUTH..."), 2500);
    }
  }, [isOpen, isConnected, status, currentAllocation, targetAllocation]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async () => {
    setStatus("submitting");
    addLog("AUTH_RECEIVED. EXECUTING_PROTOCOL...");
    
    try {
        await new Promise(r => setTimeout(r, 1500)); // Fake work
        addLog("SWAP_INITIATED: ETH -> USDC");
        await new Promise(r => setTimeout(r, 1000));
        addLog("TX_HASH: 0x71...3f");
        
        const response = await transactionService.simulateRebalance(100, currentAllocation, targetAllocation);
        setResult(response);
        setStatus("success");
        addLog("SUCCESS: PORTFOLIO_ALIGNED.");
    } catch (e) {
        setStatus("idle");
        addLog("ERROR: EXECUTION_FAILED.");
    }
  };

  const resetState = () => { resetStatus(); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-black border border-green-900/50 shadow-[0_0_30px_rgba(34,197,94,0.1)] font-mono">
        {/* Terminal Header */}
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2 text-green-500 text-xs">
                <Terminal size={14} />
                <span className="font-bold">ZAP_PILOT_CLI_V1.0</span>
            </div>
            <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
               <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
        </div>

        {/* Terminal Window */}
        <div 
            ref={scrollRef}
            className="h-64 overflow-y-auto p-4 text-xs md:text-sm text-green-400 font-mono space-y-1 scrollbar-hide"
        >
            {logs.map((log, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                >
                    {log}
                </motion.div>
            ))}
            {status !== "success" && (
                <motion.div 
                    animate={{ opacity: [1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2 h-4 bg-green-500 inline-block ml-1 align-middle"
                />
            )}
        </div>

        {/* Control Input Area */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/30">
            {status === "success" ? (
                 <button 
                 onClick={resetState}
                 className="w-full flex items-center justify-center gap-2 bg-green-900/30 text-green-400 border border-green-500/50 p-3 rounded hover:bg-green-900/50 transition-colors uppercase font-bold tracking-widest"
             >
                 <Check size={16} /> SESSION_COMPLETE
             </button>
            ) : (
                <button 
                    onClick={handleSubmit}
                    disabled={!isConnected || status === "submitting"}
                    className="w-full flex items-center gap-2 group"
                >
                    <span className="text-green-600">admin@zap:~$</span>
                    <span className="px-3 py-2 bg-green-500 hover:bg-green-400 text-black font-bold flex-1 text-left rounded-sm flex items-center justify-between transition-colors">
                        <span>{status === "submitting" ? "EXECUTING..." : "sudo rebalance --force"}</span>
                        {status !== "submitting" && <Play size={14} className="fill-black" />}
                    </span>
                </button>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
