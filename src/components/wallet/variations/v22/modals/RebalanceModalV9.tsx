"use client";

import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import { useTransactionStatus } from "./hooks/useTransactionStatus";

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface RebalanceModalV9Props {
  isOpen: boolean;
  onClose: () => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}

// Mini Stat Card
const StatCard = ({
    initial,
    target,
    label,
    // color, // Unused
    // icon: Icon // Unused
}: {
    initial: number;
    target: number;
    label: string;
    color: string;
    icon: any;
}) => {
    const diff = target - initial;
    const isPositive = diff > 0;
    
    return (
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex items-center justify-between group hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-opacity-20", isPositive ? "bg-green-500 text-green-400" : "bg-red-500 text-red-400")}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div>
                     <div className="text-sm font-medium text-gray-300">{label}</div>
                     <div className="text-xs text-gray-500">Current: {initial.toFixed(1)}%</div>
                </div>
            </div>
            
            <div className="text-right">
                <div className="text-xl font-bold text-white">{target.toFixed(1)}%</div>
                <div className={cn("text-xs font-mono", isPositive ? "text-green-400" : "text-red-400")}>
                    {isPositive ? "+" : ""}{diff.toFixed(1)}%
                </div>
            </div>
        </div>
    );
};

export function RebalanceModalV9({
  isOpen,
  onClose,
  currentAllocation,
  targetAllocation,
}: RebalanceModalV9Props) {
  const { isConnected } = useWalletProvider();
  const { status, setStatus, setResult, resetStatus } = useTransactionStatus();

  // V9 assumes full rebalance (binary action), minimal controls.
  const intensity = 100;

  // Compute Projected (Keeping in case we want to show it, but for now just using target)
  // const projected = useMemo(
  //   () => transactionService.computeProjectedAllocation(intensity, currentAllocation, targetAllocation),
  //   [currentAllocation, intensity, targetAllocation]
  // );
  
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
        {/* Very Minimal Header */}
        <div className="px-6 pt-6 pb-2 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Portfolio Delta</h2>
            {!isSubmitting && <button onClick={resetState} className="text-gray-500 hover:text-white">✕</button>}
        </div>

        <div className="p-6">
            {isSubmitting ? (
                 <div className="py-12 flex flex-col items-center justify-center animate-pulse">
                   <div className="w-16 h-1 bg-gray-800 rounded-full mb-2 overflow-hidden">
                       <div className="h-full bg-blue-500 w-1/2 animate-shimmer" />
                   </div>
                   <div className="text-sm text-gray-500">Processing changes...</div>
                   
                   {status === "success" && (
                       <div className="mt-4 text-green-400 font-bold">Done.</div>
                   )}
                 </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <StatCard 
                        initial={currentAllocation.crypto}
                        target={targetAllocation.crypto}
                        label="Crypto Exposure"
                        color="purple"
                        icon={BarChart3}
                    />

                    <StatCard 
                        initial={currentAllocation.stable}
                        target={targetAllocation.stable}
                        label="Stablecoin Basis"
                        color="emerald"
                        icon={BarChart3}
                    />

                    <div className="h-px bg-gray-800 my-2" />
                    
                    <div className="flex justify-between items-center text-sm text-gray-400 px-1">
                        <span>Rebalance Fee</span>
                        <span className="text-white font-mono">$4.20</span>
                    </div>

                     <GradientButton
                        gradient="from-gray-800 to-gray-700"
                        className="w-full py-3 mt-2 border border-gray-700 hover:border-gray-600"
                        onClick={handleSubmit}
                         disabled={!isConnected}
                     >
                        Apply Changes
                    </GradientButton>
                </div>
            )}
        </div>
      </ModalContent>
    </Modal>
  );
}
