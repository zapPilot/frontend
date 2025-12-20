"use client";

import type { ReactNode } from "react";

import { GradientButton } from "@/components/ui";
import { FOCUS_STYLES } from "@/constants/design-system";
import type {
  AllocationBreakdown,
  ChainData,
  TokenBalance,
  TransactionToken,
} from "@/types/domain/transaction";

import { TransactionModal } from "../TransactionModal";
import { AmountInput } from "./AmountInput";
import { ChainSelector } from "./ChainSelector";
import { TokenSelector } from "./TokenSelector";
import { TransactionSummary } from "./TransactionSummary";

interface SummaryProps {
  chain: ChainData | null;
  token: TransactionToken | null;
  amount: string;
  usdAmount: number;
  actionLabel: string;
  allocationAfter?: AllocationBreakdown;
  gasEstimateUsd?: number;
}

export interface ActionButtonsProps {
  gradient: string;
  disabled: boolean;
  isConnected: boolean;
  status: "idle" | "submitting" | "success";
  submittingLabel: string;
  readyLabel: string;
  connectLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface TransactionFormLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  accent: "success" | "danger" | "primary";
  testId: string;
  chainList: ChainData[];
  selectedChainId: number | null;
  onSelectChain: (id: number) => void;
  tokens: TransactionToken[];
  selectedTokenAddress: string | null;
  onSelectToken: (address: string) => void;
  balances: Record<string, TokenBalance>;
  tokensLoading: boolean;
  amount: string;
  onChangeAmount: (value: string) => void;
  maxAmount?: string;
  token: TransactionToken | null;
  amountError?: string;
  readOnlyAmount?: boolean;
  summary: SummaryProps;
  actionButtons: ActionButtonsProps;
  successMessage?: string;
  successClassName?: string;
  preFormContent?: ReactNode;
  postAmountContent?: ReactNode;
  isSubmitting?: boolean;
  visualizer?: ReactNode;
}

export function ActionButtons({
  gradient,
  disabled,
  isConnected,
  status,
  submittingLabel,
  readyLabel,
  connectLabel = "Connect Wallet",
  onConfirm,
  onCancel,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel transaction and close modal"
        className={`rounded-xl border border-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white ${FOCUS_STYLES}`}
      >
        Cancel
      </button>
      <GradientButton
        data-testid="confirm-button"
        gradient={gradient}
        disabled={disabled}
        onClick={onConfirm}
        aria-label={
          status === "submitting"
            ? submittingLabel
            : !isConnected
              ? connectLabel
              : `Confirm ${readyLabel.toLowerCase()}`
        }
        aria-busy={status === "submitting"}
        className="min-w-[180px]"
      >
        {status === "submitting"
          ? submittingLabel
          : !isConnected
            ? connectLabel
            : readyLabel}
      </GradientButton>
    </div>
  );
}

export function TransactionFormLayout({
  isOpen,
  onClose,
  title,
  subtitle,
  accent,
  testId,
  chainList,
  selectedChainId,
  onSelectChain,
  tokens,
  selectedTokenAddress,
  onSelectToken,
  balances,
  tokensLoading,
  amount,
  onChangeAmount,
  maxAmount,
  token,
  amountError,
  readOnlyAmount = false,
  summary,
  actionButtons,
  successMessage,
  successClassName,
  preFormContent,
  postAmountContent,
  isSubmitting,
  visualizer,
}: TransactionFormLayoutProps) {
  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      accent={accent}
      testId={testId}
    >
      {isSubmitting && visualizer ? (
        <div className="animate-in fade-in zoom-in duration-300">
          <div className="mb-6">{visualizer}</div>
          {successMessage ? (
            <div
              data-testid="success-message"
              className={
                successClassName ??
                "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"
              }
            >
              {successMessage}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {preFormContent}

          <ChainSelector
            chains={chainList}
            selectedChainId={selectedChainId}
            onSelect={onSelectChain}
          />

          <TokenSelector
            tokens={tokens}
            selectedToken={selectedTokenAddress}
            onSelect={onSelectToken}
            balances={balances}
            loading={tokensLoading}
          />

          <AmountInput
            value={amount}
            onChange={onChangeAmount}
            max={maxAmount}
            token={token}
            readOnly={readOnlyAmount}
            error={amountError}
          />

          {postAmountContent}

          <TransactionSummary {...summary} />

          <ActionButtons {...actionButtons} />

          {successMessage ? (
            <div
              data-testid="success-message"
              className={
                successClassName ??
                "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"
              }
            >
              {successMessage}
            </div>
          ) : null}
        </>
      )}
    </TransactionModal>
  );
}
