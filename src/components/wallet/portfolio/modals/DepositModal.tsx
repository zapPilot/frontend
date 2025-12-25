"use client";

import Image from "next/image";

import { Modal, ModalContent } from "@/components/ui/modal";
import { useWalletProvider as useDepositWalletProvider } from "@/providers/WalletProvider";
import { transactionService as depositTransactionService } from "@/services";
import type { DepositModalProps } from "@/types/ui/modals";

import * as modalDeps from "./transactionModalDependencies";

export function DepositModal({
  isOpen,
  onClose,
  defaultChainId = 1,
}: DepositModalProps) {
  const { isConnected } = useDepositWalletProvider();
  const modalState = modalDeps.useTransactionModalState({
    isOpen,
    isConnected,
    onClose,
    defaultChainId,
    submitFn: depositTransactionService.simulateDeposit,
  });
  const {
    form,
    amount,
    transactionData,
    statusState,
    isSubmitDisabled,
    handleSubmit,
    resetState,
    selectedChain,
    isSubmitting,
  } = modalState;

  const handlePercentage = (pct: number) => {
    const max = parseFloat(transactionData.balanceQuery.data?.balance || "0");
    modalDeps.applyPercentageToAmount(form, pct, max);
  };

  const hasSelectedToken = Boolean(transactionData.selectedToken);
  const actionLabel = modalDeps.resolveActionLabel({
    isConnected,
    hasSelection: hasSelectedToken,
    isReady: form.formState.isValid,
    selectionLabel: "Select Asset",
    notReadyLabel: "Enter Amount",
    readyLabel: "Review & Deposit",
  });
  const modalTitle = "Deposit to Pilot";
  const modalContentClassName =
    "p-0 overflow-hidden bg-gray-950 border-gray-800";
  const formActionsProps = modalDeps.buildFormActionsProps(
    form,
    amount,
    transactionData.selectedToken?.usdPrice,
    handlePercentage,
    actionLabel,
    isSubmitDisabled,
    "from-indigo-600 to-purple-600",
    handleSubmit
  );

  return (
    <Modal isOpen={isOpen} onClose={resetState} maxWidth="md">
      <ModalContent className={modalContentClassName}>
        <modalDeps.TransactionModalHeader
          title={modalTitle}
          indicatorClassName="bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          isSubmitting={isSubmitting}
          onClose={resetState}
        />

        <div className="p-6">
          {isSubmitting ? (
            <modalDeps.SubmittingState
              isSuccess={statusState.status === "success"}
              successMessage="Deposit Successfully Executed!"
              successTone="green"
              successExtra={
                <span className="text-xs underline cursor-pointer hover:text-green-300">
                  View Tx
                </span>
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Compact Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <modalDeps.CompactSelectorButton
                  icon={
                    <Image
                      src={modalDeps.getChainLogo(selectedChain?.chainId)}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full bg-black p-1"
                      alt={selectedChain?.name || "Chain"}
                    />
                  }
                  label="Network"
                  value={selectedChain?.name || "Select"}
                />
                <modalDeps.CompactSelectorButton
                  icon={
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                      {transactionData.selectedToken?.symbol?.[0]}
                    </div>
                  }
                  label="Asset"
                  value={transactionData.selectedToken?.symbol || "Select"}
                />
              </div>

              <modalDeps.TransactionFormActionsWithForm {...formActionsProps} />
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
