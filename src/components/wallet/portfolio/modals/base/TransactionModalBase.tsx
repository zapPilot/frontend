"use client";

import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import type {
  ChainData,
  TransactionFormData,
  TransactionResult,
} from "@/types/domain/transaction";

import {
  SubmittingState,
  TransactionModalHeader,
} from "../components/TransactionModalParts";
import { useTransactionData } from "../hooks/useTransactionData";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { useTransactionSubmission } from "../hooks/useTransactionSubmission";

/**
 * State exposed to render prop children for custom modal content
 */
export interface TransactionModalState {
  form: UseFormReturn<TransactionFormData>;
  chainId: number;
  amount: string;
  transactionData: ReturnType<typeof useTransactionData>;
  selectedChain: ChainData | null;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  handleSubmit: () => Promise<void> | void;
}

/**
 * Base configuration for transaction modals
 */
export interface TransactionModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  indicatorColor: string;
  defaultChainId?: number;
  slippage?: number;
  submitFn: (data: TransactionFormData) => Promise<TransactionResult>;
  successMessage?: string;
  successTone?: "green" | "indigo";
  successExtra?: ReactNode;
  modalContentClassName?: string;
  children: (state: TransactionModalState) => ReactNode;
}

/**
 * TransactionModalBase - Shared modal wrapper for Deposit/Withdraw/Rebalance flows
 *
 * Handles:
 * - Modal shell structure
 * - Transaction state management
 * - Submitting/success UI
 * - Header with indicator
 *
 * Delegates content rendering to render prop pattern for flexibility.
 */
export function TransactionModalBase({
  isOpen,
  onClose,
  title,
  indicatorColor,
  defaultChainId = 1,
  slippage,
  submitFn,
  successMessage,
  successTone = "indigo",
  successExtra,
  modalContentClassName = "p-0 overflow-hidden bg-gray-950 border-gray-800",
  children,
}: TransactionModalBaseProps) {
  const { isConnected } = useWalletProvider();

  // 1. Form management
  const form = useTransactionForm({
    chainId: defaultChainId,
    ...(slippage !== undefined ? { slippage } : {}),
  });

  // Watch form values for data fetching
  const chainId = form.watch("chainId");
  const tokenAddress = form.watch("tokenAddress");
  const amount = form.watch("amount");

  // 2. Data fetching (tokens, chains, balances)
  const transactionData = useTransactionData({
    isOpen,
    chainId,
    tokenAddress,
    amount,
  });

  // 3. Submission handling
  const submission = useTransactionSubmission(
    form,
    isConnected,
    transactionData.selectedToken,
    submitFn,
    onClose
  );

  // Derived state
  const selectedChain = transactionData.selectedChain;
  const isSubmitting = submission.isSubmitting;

  const resetState = () => {
    submission.resetState();
  };

  const renderState: TransactionModalState = {
    form,
    chainId,
    amount,
    transactionData,
    selectedChain,
    isSubmitting,
    isSubmitDisabled: submission.isSubmitDisabled,
    handleSubmit: submission.handleSubmit,
  };

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className={modalContentClassName}>
        <TransactionModalHeader
          title={title}
          indicatorClassName={indicatorColor}
          isSubmitting={isSubmitting}
          onClose={resetState}
        />

        <div className="p-6">
          {isSubmitting ? (
            <SubmittingState
              isSuccess={submission.status === "success"}
              {...(successMessage ? { successMessage } : {})}
              successTone={successTone}
              successExtra={successExtra}
            />
          ) : (
            children(renderState)
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
