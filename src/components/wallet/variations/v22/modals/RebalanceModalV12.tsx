"use client";

import { Printer } from "lucide-react";

import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";

interface RebalanceModalV12Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV12({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV12Props) {
  const { isConnected } = useWalletProvider();
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();

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

  const resetState = () => { resetStatus(); onClose(); };
  
  const timestamp = new Date().toLocaleString('en-US', { opacity: 0.5, font: 'monospace' } as any);

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="sm">
      <ModalContent className="p-0 overflow-hidden bg-transparent border-none shadow-none">
        
        {/* THE RECEIPT PAPER */}
        <div className="bg-white text-black font-mono text-sm shadow-2xl mx-auto w-full max-w-[320px] relative">
            
            {/* Perforated Top */}
            <div className="absolute top-0 left-0 w-full h-4 -mt-4 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>

            <div className="p-6 flex flex-col items-center">
                <div className="font-bold text-2xl mb-2 tracking-tighter">ZAP PILOT</div>
                <div className="text-xs uppercase mb-6 text-gray-500">Official Transaction Record</div>
                
                <div className="w-full border-b-2 border-dashed border-gray-300 mb-4" />
                
                {/* Line Items */}
                <div className="w-full space-y-2 mb-4">
                    <div className="flex justify-between">
                        <span>ITEM</span>
                        <span>QTY</span>
                    </div>
                    
                    <div className="flex justify-between font-bold">
                        <span>SELL ETH</span>
                        <span>0.52</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">@ $2,420.50 / unit</div>

                    <div className="flex justify-between font-bold">
                        <span>BUY USDC</span>
                        <span>1,250.00</span>
                    </div>
                     <div className="text-xs text-gray-500">1:1 Peg</div>
                </div>

                <div className="w-full border-b-2 border-dashed border-gray-300 mb-4" />

                <div className="w-full space-y-1 mb-6">
                    <div className="flex justify-between">
                        <span>SUBTOTAL</span>
                        <span>$1,258.66</span>
                    </div>
                     <div className="flex justify-between text-gray-500 text-xs">
                        <span>GAS FEE (EST)</span>
                        <span>$4.20</span>
                    </div>
                     <div className="flex justify-between text-gray-500 text-xs">
                        <span>SERVICE FEE</span>
                        <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-black">
                        <span>TOTAL</span>
                        <span>$1,262.86</span>
                    </div>
                </div>
                
                <div className="text-center text-xs text-gray-400 mb-6 font-mono">
                    <div>{timestamp}</div>
                    <div>TRX ID: #8291-A92B</div>
                </div>

                {/* Barcode Mockup */}
                <div className="h-12 w-full bg-black mb-6 opacity-80" style={{ maskImage: 'repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px)' }}></div>

                {status === "success" ? (
                    <div className="w-full text-center border-2 border-black p-2 font-bold uppercase rotate-[-2deg] mb-2 text-red-600 stamp-effect">
                        PAID - CONFIRMED
                    </div>
                ) : (
                    <button 
                        onClick={handleSubmit} 
                        disabled={!isConnected}
                        className="w-full bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors uppercase flex items-center justify-center gap-2"
                    >
                        <Printer size={16} /> Print & Sign
                    </button>
                )}
            </div>

             {/* Perforated Bottom */}
             <div className="absolute bottom-0 left-0 w-full h-4 -mb-4 bg-white" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
        </div>

        {/* Close Button Outside */}
        <button onClick={resetState} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>

      </ModalContent>
    </Modal>
  );
}
