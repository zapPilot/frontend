"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Coins, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { type AssetCategoryKey, getCategoryForToken } from "@/lib/assetCategoryUtils";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";

import {
    useTransactionForm,
    useTransactionSubmission,
    useTransactionViewModel,
} from "./hooks";
import { getChainLogo } from "./utils/assetHelpers";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

// Local utils
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface WithdrawModalV10DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChainId?: number;
}

const CATEGORIES: { id: AssetCategoryKey; label: string; icon: React.ReactNode }[] = [
    { id: "stablecoin", label: "Stablecoins", icon: <Coins className="w-3 h-3 text-emerald-400" /> },
    { id: "btc", label: "Bitcoin", icon: <span className="text-orange-400 font-bold text-xs">₿</span> },
    { id: "eth", label: "Ethereum", icon: <span className="text-blue-400 font-bold text-xs">Ξ</span> },
    { id: "altcoin", label: "Altcoins", icon: <Layers className="w-3 h-3 text-purple-400" /> },
];

export function WithdrawModalV10Dropdown({
  isOpen,
  onClose,
  defaultChainId = 1,
}: WithdrawModalV10DropdownProps) {
  const { isConnected } = useWalletProvider();
  
  // Local state for dropdowns
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const form = useTransactionForm({ chainId: defaultChainId, slippage: 0.5 });
  const { chainId, amount, transactionData } = useTransactionViewModel(form, isOpen);

  const { statusState, isSubmitDisabled, handleSubmit, resetState } =
    useTransactionSubmission(
      form,
      isConnected,
      transactionData.selectedToken,
      transactionService.simulateWithdraw, // Withdraw service!
      onClose
    );

  const selectedChain = transactionData.chainList.find(c => c.chainId === chainId);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssetDropdownOpen(false);
        setIsChainDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // --- Data Processing for Dropdown ---
  const tokens = transactionData.tokenQuery.data || [];

  // Group tokens by category
    const tokensByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = tokens.filter(t => getCategoryForToken(t.symbol) === cat.id);
    return acc;
  }, {} as Record<AssetCategoryKey, typeof tokens>);


  const handlePercentage = (pct: number) => {
    const max = parseFloat(transactionData.balances[transactionData.selectedToken?.address || ""]?.balance || "0");
    if (max > 0) {
      form.setValue("amount", (max * pct).toFixed(4), { shouldValidate: true });
    }
  };

  const isSubmitting = statusState.status === "submitting" || statusState.status === "success";

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-visible bg-gray-950 border-gray-800">
        {/* Header */}
        <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="font-bold text-white flex items-center gap-2">
             {/* Changed indicator to localized purple for Withdraw */}
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            Withdraw from Pilot
          </h3>
          {!isSubmitting && (
            <button onClick={resetState} className="text-gray-400 hover:text-white">✕</button>
          )}
        </div>

        <div className="p-6 relative" ref={dropdownRef}>
          {isSubmitting ? (
             <div className="animate-in fade-in zoom-in duration-300">
               <div className="mb-6">
                 {/* Reusing IntentVisualizer - generic enough? If not, we might need a Withdraw specific one or genericize props */}
                 <IntentVisualizer />
               </div>
 
               {statusState.status === "success" && (
                 <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-3 text-indigo-400">
                   <Check className="w-5 h-5 flex-shrink-0" />
                   <div className="text-sm font-semibold">Withdrawal Executed Successfully!</div>
                 </div>
               )}
             </div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Selectors Grid */}
              <div className="grid grid-cols-2 gap-3 z-20">
                {/* Chain Selector */}
                <div className="relative">
                    <button 
                        onClick={() => { setIsChainDropdownOpen(!isChainDropdownOpen); setIsAssetDropdownOpen(false); }}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3 hover:border-gray-700 transition-colors text-left"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={getChainLogo(selectedChain?.chainId)}
                            className="w-8 h-8 rounded-full bg-black p-1"
                            alt={selectedChain?.name || "Chain"}
                        />
                        <div className="flex-1 overflow-hidden">
                            <div className="text-xs text-gray-500 font-bold uppercase">Network</div>
                            <div className="font-bold text-gray-200 truncate">{selectedChain?.name || "Select"}</div>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isChainDropdownOpen && "rotate-180")} />
                    </button>

                     {/* Chain Dropdown */}
                     <AnimatePresence>
                        {isChainDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-2 w-full bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-30"
                            >
                                <div className="p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                    {transactionData.chainList.map(chain => (
                                        <button
                                            key={chain.chainId}
                                            onClick={() => {
                                                form.setValue("chainId", chain.chainId);
                                                setIsChainDropdownOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors",
                                                chainId === chain.chainId && "bg-gray-800"
                                            )}
                                        >
                                            <img src={getChainLogo(chain.chainId)} className="w-6 h-6 rounded-full" />
                                            <span className="text-sm font-medium text-white">{chain.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Asset Selector (Dropdown Logic) */}
                <div className="relative">
                    <button 
                        onClick={() => { setIsAssetDropdownOpen(!isAssetDropdownOpen); setIsChainDropdownOpen(false); }}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3 hover:border-gray-700 transition-colors text-left"
                    >
                         <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                            {transactionData.selectedToken?.symbol?.[0] || "?"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-xs text-gray-500 font-bold uppercase">Asset</div>
                            <div className="font-bold text-gray-200 truncate">{transactionData.selectedToken?.symbol || "Select Asset"}</div>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isAssetDropdownOpen && "rotate-180")} />
                    </button>

                    {/* Categorized Asset Dropdown */}
                    <AnimatePresence>
                        {isAssetDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full right-0 mt-2 w-[280px] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-30"
                            >
                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                    {CATEGORIES.map(category => {
                                        const catTokens = tokensByCategory[category.id] || [];
                                        if (catTokens.length === 0) return null;

                                        return (
                                            <div key={category.id} className="border-b border-gray-800 last:border-0">
                                                <div className="px-4 py-2 bg-gray-950/50 text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2 tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                                                    {category.icon} {category.label}
                                                </div>
                                                <div className="p-1">
                                                    {catTokens.map(token => {
                                                        const isSelected = transactionData.selectedToken?.address === token.address;
                                                        const bal = transactionData.balances[token.address]?.balance || "0";
                                                        return (
                                                            <button
                                                                key={token.address}
                                                                onClick={() => {
                                                                    form.setValue("tokenAddress", token.address);
                                                                    setIsAssetDropdownOpen(false);
                                                                }}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors group",
                                                                    isSelected ? "bg-indigo-500/10" : "hover:bg-gray-800"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                     <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-gray-700">
                                                                        {token.symbol[0]}
                                                                     </div>
                                                                     <div className="text-left">
                                                                         <div className={cn("text-sm font-medium", isSelected ? "text-indigo-300" : "text-gray-300")}>
                                                                             {token.symbol}
                                                                         </div>
                                                                         <div className="text-[10px] text-gray-500">{bal} available</div>
                                                                     </div>
                                                                </div>
                                                                {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {tokens.length === 0 && (
                                        <div className="p-6 text-center text-gray-500 text-sm">
                                            No assets found.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </div>

               {/* Amount Input */}
               <div className="relative z-0"> 
                 {/* z-0 to ensure it stays behind dropdowns if needed, though modal z-stack matches */}
                 <div className="absolute top-0 left-0 text-xs font-bold text-gray-500 uppercase tracking-wider">
                   Amount
                 </div>
                 <input
                   type="number"
                   value={amount}
                   onChange={e => form.setValue("amount", e.target.value, { shouldValidate: true })}
                   placeholder="0.00"
                   className="w-full bg-transparent text-4xl font-mono font-bold text-white placeholder-gray-800 focus:outline-none py-6 border-b border-gray-800 focus:border-indigo-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                 />
                 <div className="absolute top-6 right-0 text-sm text-gray-500 flex items-center gap-1">
                   ≈ $ {(parseFloat(amount || "0") * (transactionData.selectedToken?.usdPrice || 1)).toLocaleString()}
                 </div>
               </div>
 
               {/* Quick Pills */}
               <div className="flex gap-2">
                 {[0.25, 0.5, 0.75, 1].map(pct => (
                   <button
                     key={pct}
                     onClick={() => handlePercentage(pct)}
                     className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 text-xs font-bold py-2 rounded-lg border border-gray-800 transition-colors"
                   >
                     {pct === 1 ? "MAX" : `${pct * 100}%`}
                   </button>
                 ))}
               </div>
 
               <GradientButton
                 gradient="from-indigo-600 to-violet-600"
                 className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group"
                 disabled={isSubmitDisabled}
                 onClick={handleSubmit}
               >
                 <span>
                   {(() => {
                     if (!isConnected) return "Connect Wallet";
                     if (!transactionData.selectedToken) return "Select Asset";
                     if (!form.formState.isValid) return "Enter Amount";
                     return "Review & Withdraw";
                   })()}
                 </span>
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </GradientButton>

            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
