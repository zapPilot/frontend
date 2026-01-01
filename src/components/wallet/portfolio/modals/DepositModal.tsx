"use client";

import Image from "next/image";

import { transactionService as depositTransactionService } from "@/services";
import type { DepositModalProps } from "@/types/ui/modals";

import { TransactionModalBase } from "./base/TransactionModalBase";
import * as modalDeps from "./transactionModalDependencies";

export function DepositModal({
  isOpen,
  onClose,
  defaultChainId = 1,
}: DepositModalProps) {
  return (
    <TransactionModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Deposit to Pilot"
      indicatorColor="bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
      defaultChainId={defaultChainId}
      submitFn={depositTransactionService.simulateDeposit}
      successMessage="Deposit Successfully Executed!"
      successTone="green"
      successExtra={
        <span className="text-xs underline cursor-pointer hover:text-green-300">
          View Tx
        </span>
      }
    >
      {({
        form,
        amount,
        transactionData,
        selectedChain,
        isSubmitDisabled,
        handleSubmit,
      }) => {
        const handlePercentage = (pct: number) => {
          const max = parseFloat(
            transactionData.balanceQuery.data?.balance || "0"
          );
          modalDeps.applyPercentageToAmount(form, pct, max);
        };

        const hasSelectedToken = Boolean(transactionData.selectedToken);
        const actionLabel = modalDeps.resolveActionLabel({
          isConnected: true, // Already validated in base
          hasSelection: hasSelectedToken,
          isReady: form.formState.isValid,
          selectionLabel: "Select Asset",
          notReadyLabel: "Enter Amount",
          readyLabel: "Review & Deposit",
        });

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
        );
      }}
    </TransactionModalBase>
  );
}
