"use client";

import { useEffect, useState } from "react";

import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";

import {
  useTransactionForm,
  useTransactionSubmission,
  useTransactionViewModel,
} from "./hooks";
import { TransactionModalScaffold } from "./TransactionModalScaffold";
import {
  buildScaffoldBaseProps,
  createActionButtons,
  createSummary,
  formatSuccessMessage,
} from "./utils/modalHelpers";
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
      form.setValue("amount", currentBalance.toString());
    }
  }, [currentBalance, form, mode]);

  const { statusState, isSubmitDisabled, handleSubmit, resetState } =
    useTransactionSubmission(
      form,
      isConnected,
      transactionData.selectedToken,
      transactionService.simulateWithdraw,
      onClose
    );

  const amountError =
    (form.formState.errors.amount?.message as string | undefined) ?? null;

  const maxAmount =
    transactionData.balanceQuery.data?.balance ?? currentBalance.toString();
  const successMessage = formatSuccessMessage(
    transactionData.selectedToken ? statusState.result?.txHash : undefined,
    "Withdraw"
  );

  const scaffoldBase = buildScaffoldBaseProps(
    form,
    transactionData,
    chainId ?? null,
    amount,
    maxAmount
  );

  const summary = createSummary(transactionData, amount, "Withdraw", {
    gasEstimateUsd: 3.1,
  });

  const actionButtons = createActionButtons({
    gradient: "from-red-500 to-pink-500",
    disabled: isSubmitDisabled,
    isConnected,
    status: statusState.status,
    submittingLabel: "Submitting…",
    readyLabel: mode === "full" ? "Exit Position" : "Confirm Withdraw",
    onConfirm: () => {
      void handleSubmit();
    },
    onCancel: resetState,
  });

  const modeSelector = (
    <div className="grid grid-cols-2 gap-2">
      {(["partial", "full"] as WithdrawMode[]).map(option => (
        <button
          key={option}
          type="button"
          onClick={() => setMode(option)}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
            mode === option
              ? "border-red-500/50 bg-red-500/10 text-white"
              : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-red-500/30 hover:text-white"
          }`}
        >
          {option === "partial" ? "Partial Withdrawal" : "Full Exit"}
        </button>
      ))}
    </div>
  );

  const slippageControls = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Slippage
        </span>
        <span className="text-xs text-gray-400">
          Adjust for volatile markets
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[0.5, 1, 2].map(value => (
          <button
            key={value}
            type="button"
            onClick={() => form.setValue("slippage", value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              slippage === value
                ? "border-red-500/60 bg-red-500/10 text-white"
                : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-red-500/40 hover:text-white"
            }`}
          >
            {value}%
          </button>
        ))}
        <input
          type="number"
          value={slippage ?? ""}
          onChange={event =>
            form.setValue("slippage", Number(event.target.value))
          }
          className="w-24 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs text-white focus:border-red-500/40 focus:outline-none"
          step="0.1"
          min="0.1"
          max="50"
          aria-label="Custom slippage"
        />
      </div>
    </div>
  );

  return (
    <TransactionModalScaffold
      meta={{
        isOpen,
        onClose: resetState,
        title: "Withdraw Funds",
        subtitle:
          "Switch between partial and full exit. Slippage is configurable.",
        accent: "danger",
        testId: "withdraw-modal",
      }}
      {...scaffoldBase}
      {...(amountError ? { amountError } : {})}
      readOnlyAmount={mode === "full"}
      summary={summary}
      actionButtons={actionButtons}
      successMessage={successMessage}
      successClassName="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100"
      preFormContent={modeSelector}
      postAmountContent={slippageControls}
      isSubmitting={statusState.status === "submitting" || statusState.status === "success"}
      visualizer={<IntentVisualizer steps={["Sign", "Unstake", "Withdraw"]} />}
    />
  );
}
