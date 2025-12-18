"use client";

import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { GradientButton } from "@/components/ui/GradientButton";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";

import {
  useTransactionForm,
  useTransactionSubmission,
  useTransactionViewModel,
} from "./hooks";
import { getChainLogo } from "./utils/assetHelpers";
import { IntentVisualizer } from "./visualizers/IntentVisualizer";

type WithdrawMode = "partial" | "full";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

export function WithdrawModal({
  isOpen,
  onClose,
  currentBalance = 0,
}: WithdrawModalProps) {
  const { isConnected } = useWalletProvider();
  const [mode, setMode] = useState<WithdrawMode>("partial");
  const form = useTransactionForm({
    slippage: 0.5,
    amount: mode === "full" ? currentBalance.toString() : "",
  });

  const { chainId, amount, transactionData } = useTransactionViewModel(
    form,
    isOpen
  );
  const slippage = form.watch("slippage");

  useEffect(() => {
    if (mode === "full") {
      const decimals = transactionData.selectedToken?.decimals || 4;
      form.setValue("amount", currentBalance.toFixed(decimals), {
        shouldValidate: true,
      });
    } else if (
      mode === "partial" &&
      parseFloat(form.getValues("amount") || "0") >= currentBalance
    ) {
      form.setValue("amount", "", { shouldValidate: true });
    }
  }, [currentBalance, form, mode, transactionData.selectedToken?.decimals]);

  const { statusState, isSubmitDisabled, handleSubmit, resetState } =
    useTransactionSubmission(
      form,
      isConnected,
      transactionData.selectedToken,
      transactionService.simulateWithdraw,
      onClose
    );

  const selectedChain = transactionData.chainList.find(
    c => c.chainId === chainId
  );

  const maxAmount = parseFloat(
    transactionData.balanceQuery.data?.balance || currentBalance.toString()
  );

  const handlePercentage = (pct: number) => {
    if (maxAmount > 0) {
      const decimals = transactionData.selectedToken?.decimals || 4;
      form.setValue("amount", (maxAmount * pct).toFixed(decimals), {
        shouldValidate: true,
      });
    }
  };

  const isSubmitting =
    statusState.status === "submitting" || statusState.status === "success";

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        {/* Header with red status indicator */}
        <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            Withdraw Funds
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
            // Submission view with IntentVisualizer
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="mb-6">
                <IntentVisualizer steps={["Sign", "Unstake", "Withdraw"]} />
              </div>
              {statusState.status === "success" && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm font-semibold">
                    Withdrawal Successfully Executed!
                  </div>
                  {statusState.result?.txHash && (
                    <div className="ml-auto text-xs underline cursor-pointer hover:text-red-300">
                      View Tx
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Mode Selector - Unique to Withdraw */}
              <div className="grid grid-cols-2 gap-3">
                {(["partial", "full"] as WithdrawMode[]).map(option => (
                  <button
                    key={option}
                    onClick={() => setMode(option)}
                    className={`bg-gray-900 border rounded-xl p-3 flex items-center justify-center transition-colors ${
                      mode === option
                        ? "border-red-500/50 bg-red-500/10 text-white"
                        : "border-gray-800 hover:border-red-500/30 text-gray-400"
                    }`}
                    aria-pressed={mode === option}
                    data-testid={`mode-${option}`}
                  >
                    <span className="font-bold text-sm">
                      {option === "partial"
                        ? "Partial Withdrawal"
                        : "Full Exit"}
                    </span>
                  </button>
                ))}
              </div>

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
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold border border-red-500/30">
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

              {/* Amount Input - Large 4xl */}
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
                  disabled={mode === "full"}
                  className="w-full bg-transparent text-4xl font-mono font-bold text-white placeholder-gray-800 focus:outline-none py-6 border-b border-gray-800 focus:border-red-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label="Withdrawal amount"
                  data-testid="amount-input"
                />
                <div className="absolute top-6 right-0 text-sm text-gray-500 flex items-center gap-1">
                  ≈ $
                  {(
                    parseFloat(amount || "0") *
                    (transactionData.selectedToken?.usdPrice || 1)
                  ).toLocaleString()}
                </div>
              </div>

              {/* Quick Pills - Only for partial mode */}
              {mode === "partial" && (
                <div className="flex gap-2">
                  {[0.25, 0.5, 0.75, 1].map(pct => (
                    <button
                      key={pct}
                      onClick={() => handlePercentage(pct)}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 text-xs font-bold py-2 rounded-lg border border-gray-800 transition-colors"
                      aria-label={`${pct === 1 ? "Max" : `${pct * 100}%`} of total balance`}
                      data-testid={`percentage-${pct}`}
                    >
                      {pct === 1 ? "MAX" : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              )}

              {/* Slippage Controls - Unique to Withdraw */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Slippage Tolerance
                  </span>
                  <span className="text-xs text-gray-400">{slippage}%</span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 1, 2].map(value => (
                    <button
                      key={value}
                      onClick={() => form.setValue("slippage", value)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        slippage === value
                          ? "border-red-500/60 bg-red-500/10 text-white"
                          : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-red-500/40"
                      }`}
                      aria-pressed={slippage === value}
                      data-testid={`slippage-${value}`}
                    >
                      {value}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={slippage ?? ""}
                    onChange={e =>
                      form.setValue("slippage", Number(e.target.value))
                    }
                    className="w-20 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs text-white focus:border-red-500/40 focus:outline-none"
                    step="0.1"
                    min="0.1"
                    max="50"
                    aria-label="Custom slippage percentage"
                    data-testid="slippage-custom"
                  />
                </div>
              </div>

              {/* Submit Button - Red/Pink Gradient */}
              <GradientButton
                gradient="from-red-600 to-pink-600"
                className="w-full py-4 text-lg font-bold shadow-lg shadow-red-500/10 flex items-center justify-center gap-2 group"
                disabled={isSubmitDisabled}
                onClick={handleSubmit}
                testId="withdraw-submit"
              >
                <span>
                  {(() => {
                    if (!isConnected) return "Connect Wallet";
                    if (!transactionData.selectedToken) return "Select Asset";
                    if (!form.formState.isValid) return "Enter Amount";
                    return mode === "full"
                      ? "Exit Full Position"
                      : "Review & Withdraw";
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
