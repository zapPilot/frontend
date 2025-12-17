"use client";

import { useWalletProvider as useDepositWalletProvider } from "@/providers/WalletProvider";
import { transactionService as depositTransactionService } from "@/services";
import type { AllocationBreakdown } from "@/types/domain/transaction";

import {
  useTransactionForm,
  useTransactionSubmission,
  useTransactionViewModel,
} from "./hooks";
import { TransactionModalScaffold } from "./TransactionModalScaffold";
import * as modalHelpers from "./utils/modalHelpers";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChainId?: number;
  regimeAllocation?: AllocationBreakdown | undefined;
}

export function DepositModal({
  isOpen,
  onClose,
  defaultChainId = 1,
  regimeAllocation,
}: DepositModalProps) {
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

  const allocationAfter: AllocationBreakdown | undefined = regimeAllocation
    ? { ...regimeAllocation }
    : undefined;

  const summaryWithAllocation = modalHelpers.createSummary(
    transactionData,
    amount,
    "Deposit",
    allocationAfter ? { allocationAfter } : undefined
  );

  const maxAmount = transactionData.balanceQuery.data?.balance ?? null;
  const successMessage = modalHelpers.formatSuccessMessage(
    transactionData.selectedToken ? statusState.result?.txHash : undefined,
    "Deposit"
  );

  return (
    <TransactionModalScaffold
      meta={{
        isOpen,
        onClose: resetState,
        title: "Deposit to Pilot",
        subtitle: "Chain → Token → Amount → Confirm",
        accent: "success",
        testId: "deposit-modal",
      }}
      {...modalHelpers.buildScaffoldBaseProps(
        form,
        transactionData,
        chainId ?? null,
        amount,
        maxAmount
      )}
      summary={summaryWithAllocation}
      actionButtons={modalHelpers.createActionButtons({
        gradient: "from-emerald-500 to-teal-500",
        disabled: isSubmitDisabled,
        isConnected,
        status: statusState.status,
        submittingLabel: "Submitting…",
        readyLabel: "Confirm Deposit",
        onConfirm: () => {
          void handleSubmit();
        },
        onCancel: resetState,
      })}
      successMessage={successMessage}
      successClassName="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"
      preFormContent={
        regimeAllocation ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Based on current regime target: {regimeAllocation.crypto}% Crypto /
            {regimeAllocation.stable}% Stable
          </div>
        ) : null
      }
    />
  );
}
