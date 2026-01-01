"use client";

import type { ReactNode } from "react";

import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider } from "@/providers/WalletProvider";
import type {
  TransactionFormData,
  TransactionResult,
} from "@/types/domain/transaction";

import {
  SubmittingState,
  TransactionModalHeader,
} from "../components/TransactionModalParts";
import { useTransactionModalState } from "../hooks/useTransactionModalState";

/**
 * State exposed to render prop children for custom modal content
 */
export interface TransactionModalState {
  form: ReturnType<typeof useTransactionModalState>["form"];
  chainId: number;
  amount: string;
  transactionData: ReturnType<
    typeof useTransactionModalState
  >["transactionData"];
  selectedChain: ReturnType<typeof useTransactionModalState>["selectedChain"];
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

  const modalState = useTransactionModalState({
    isOpen,
    isConnected,
    onClose,
    defaultChainId,
    ...(slippage !== undefined ? { slippage } : {}),
    submitFn,
  });

  const {
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
  } = modalState;

  const renderState: TransactionModalState = {
    form,
    chainId,
    amount,
    transactionData,
    selectedChain,
    isSubmitting,
    isSubmitDisabled,
    handleSubmit,
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
              isSuccess={statusState.status === "success"}
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
