"use client";

import type {
  TransactionFormData,
  TransactionResult,
} from "@/types/domain/transaction";

import { useTransactionForm } from "./useTransactionForm";
import { useTransactionSubmission } from "./useTransactionSubmission";
import { useTransactionViewModel } from "./useTransactionViewModel";

interface TransactionModalStateConfig {
  isOpen: boolean;
  isConnected: boolean;
  onClose: () => void;
  defaultChainId: number;
  slippage?: number;
  submitFn: (values: TransactionFormData) => Promise<TransactionResult>;
}

export function useTransactionModalState({
  isOpen,
  isConnected,
  onClose,
  defaultChainId,
  slippage,
  submitFn,
}: TransactionModalStateConfig) {
  const form = useTransactionForm({
    chainId: defaultChainId,
    ...(slippage !== undefined ? { slippage } : {}),
  });
  const { chainId, amount, transactionData } = useTransactionViewModel(
    form,
    isOpen
  );

  const { statusState, isSubmitDisabled, handleSubmit, resetState } =
    useTransactionSubmission(
      form,
      isConnected,
      transactionData.selectedToken,
      submitFn,
      onClose
    );

  const selectedChain = transactionData.chainList.find(
    c => c.chainId === chainId
  );

  const isSubmitting =
    statusState.status === "submitting" || statusState.status === "success";

  return {
    form,
    chainId,
    amount,
    transactionData,
    statusState,
    isSubmitDisabled,
    handleSubmit,
    resetState,
    selectedChain,
    isSubmitting,
  } as const;
}
