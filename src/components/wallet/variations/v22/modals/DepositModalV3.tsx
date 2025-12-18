"use client";

import { ArrowRight, Check, ChevronDown } from "lucide-react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider as useDepositWalletProvider } from "@/providers/WalletProvider";
import { transactionService as depositTransactionService } from "@/services";

import {
  useTransactionForm,
  useTransactionSubmission,
  useTransactionViewModel,
} from "./hooks";
import { getChainLogo } from "./utils/assetHelpers";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

interface DepositModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  defaultChainId?: number;
}

export function DepositModalV3({
  isOpen,
  onClose,
  defaultChainId = 1,
}: DepositModalV3Props) {
  const { isConnected } = useDepositWalletProvider();
  const form = useTransactionForm({ chainId: defaultChainId });
  const { chainId, amount, transactionData } = useTransactionViewModel(
    form,
    isOpen
  );

  const { statusState, isSubmitDisabled, handleSubmit, resetState } =
    useTransactionSubmission(
      form,
      isConnected,
      transactionData.selectedToken,
      depositTransactionService.simulateDeposit,
      onClose
    );

  const selectedChain = transactionData.chainList.find(
    c => c.chainId === chainId
  );

  const handlePercentage = (pct: number) => {
    const max = parseFloat(transactionData.balanceQuery.data?.balance || "0");
    if (max > 0) {
      form.setValue("amount", (max * pct).toFixed(4), { shouldValidate: true });
    }
  };

  const isSubmitting =
    statusState.status === "submitting" || statusState.status === "success";

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            Deposit to Pilot
          </h3>
          {!isSubmitting && (
            <button
              onClick={resetState}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-6">
          {isSubmitting ? (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="mb-6">
                <IntentVisualizer />
              </div>

              {statusState.status === "success" && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm font-semibold">
                    Deposit Successfully Executed!
                  </div>
                  <div className="ml-auto text-xs underline cursor-pointer hover:text-green-300">
                    View Tx
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Compact Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3 hover:border-gray-700 transition-colors text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getChainLogo(selectedChain?.chainId)}
                    className="w-8 h-8 rounded-full bg-black p-1"
                    alt={selectedChain?.name || "Chain"}
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs text-gray-500 font-bold uppercase">
                      Network
                    </div>
                    <div className="font-bold text-gray-200 truncate">
                      {selectedChain?.name || "Select"}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <button className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3 hover:border-gray-700 transition-colors text-left">
                  {/* Assuming USDC for demo or dynamic token icon */}
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                    {transactionData.selectedToken?.symbol?.[0]}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs text-gray-500 font-bold uppercase">
                      Asset
                    </div>
                    <div className="font-bold text-gray-200 truncate">
                      {transactionData.selectedToken?.symbol || "Select"}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Amount Input */}
              <div className="relative">
                <div className="absolute top-0 left-0 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Amount
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={e =>
                    form.setValue("amount", e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  placeholder="0.00"
                  className="w-full bg-transparent text-4xl font-mono font-bold text-white placeholder-gray-800 focus:outline-none py-6 border-b border-gray-800 focus:border-indigo-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute top-6 right-0 text-sm text-gray-500 flex items-center gap-1">
                  ≈ $
                  {(
                    parseFloat(amount || "0") *
                    (transactionData.selectedToken?.usdPrice || 1)
                  ).toLocaleString()}
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
                gradient="from-indigo-600 to-purple-600"
                className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group"
                disabled={isSubmitDisabled}
                onClick={handleSubmit}
              >
                <span>
                  {(() => {
                    if (!isConnected) return "Connect Wallet";
                    if (!transactionData.selectedToken) return "Select Asset";
                    if (!form.formState.isValid) return "Enter Amount";
                    return "Review & Deposit";
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
