"use client";

import { ArrowRight, Check, ListChecks } from "lucide-react";
import { useMemo } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface RebalanceModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

export function RebalanceModalV3({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV3Props) {
  const { isConnected } = useWalletProvider();
  const intensity = 100; // Fixed 100% for this "Verify" style view
  const { status, setStatus, result, setResult, resetStatus } = useTransactionStatus();

  // Mock list of trades based on logic
  // In a real app we'd get this from the simulation service
  const trades = useMemo(() => {
    const diff = targetAllocation.crypto - currentAllocation.crypto;
    const absDiff = Math.abs(diff);
    // Rough mock logic
    if (diff > 0) {
        // Need to buy crypto
        return [
            { id: 1, action: "SELL", asset: "USDC", amount: "1,200", icon: "S" },
            { id: 2, action: "BUY", asset: "ETH", amount: "0.25", icon: "Ξ" },
            { id: 3, action: "BUY", asset: "BTC", amount: "0.015", icon: "₿" }
        ];
    } else {
        // Need to sell crypto
         return [
            { id: 1, action: "SELL", asset: "ETH", amount: "0.45", icon: "Ξ" },
            { id: 2, action: "SELL", asset: "UNI", amount: "400", icon: "U" },
            { id: 3, action: "BUY", asset: "USDC", amount: "3,400", icon: "S" }
        ];
    }
  }, [currentAllocation, targetAllocation]);


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
            <ListChecks className="w-4 h-4 text-gray-400" />
            Review Transaction Plan
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
                        <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center gap-3 text-white">
                            <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
                            <div className="text-sm font-semibold">
                                {trades.length} Trades Executed Successfully
                            </div>
                        </div>
                    )}
                 </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-3 bg-gray-800/30 border-b border-gray-800 text-xs font-bold text-gray-400 uppercase">
                            Planned Swaps
                        </div>
                        <div className="divide-y divide-gray-800">
                            {trades.map((trade, idx) => (
                                <div key={trade.id} className="p-4 flex items-center justify-between group hover:bg-gray-800/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${trade.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{trade.action} {trade.asset}</div>
                                            <div className="text-xs text-gray-500">via Uniswap V3</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-white">{trade.amount}</div>
                                        <div className="text-xs text-gray-500">Est. completion 12s</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Summary Footer */}
                        <div className="p-3 bg-gray-800/30 border-t border-gray-800 flex justify-between items-center">
                            <span className="text-xs text-gray-500">Total Gas Fee</span>
                            <span className="text-xs font-bold text-white">~$4.52</span>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs text-amber-500/80 flex gap-2 items-start">
                        <div className="mt-0.5">•</div>
                        <div>transactions will be bundled for efficiency where possible. Slippage tolerance set to 0.5%.</div>
                    </div>

                     <GradientButton
                        gradient="from-gray-700 to-slate-800"
                        className="w-full py-4 text-lg font-bold shadow-lg shadow-black/20 flex items-center justify-center gap-2 group border border-gray-600"
                        onClick={handleSubmit}
                         disabled={!isConnected}
                     >
                        <span>Confirm {trades.length} Swaps</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
