import type { UseFormReturn } from "react-hook-form";

import type { TransactionFormData } from "@/types/domain/transaction";

import type {
  ActionButtonsProps,
  TransactionFormLayoutProps,
} from "../components/TransactionFormLayout";
import type { useTransactionTokenData } from "../hooks/useTransactionTokenData";

export function buildScaffoldBaseProps(
  form: UseFormReturn<TransactionFormData>,
  transactionData: ReturnType<typeof useTransactionTokenData>,
  chainId: number | null,
  amount: string,
  maxAmount: string | null
) {
  return {
    form,
    transactionData,
    chainId,
    amount,
    ...(maxAmount ? { maxAmount } : {}),
    token: transactionData.selectedToken,
  } as const;
}

export function applyPercentageToAmount(
  form: UseFormReturn<TransactionFormData>,
  pct: number,
  maxAmount: number
) {
  if (maxAmount > 0) {
    form.setValue("amount", (maxAmount * pct).toFixed(4), {
      shouldValidate: true,
    });
  }
}

export function buildFormActionsProps(
  form: UseFormReturn<TransactionFormData>,
  amount: string,
  usdPrice: number | undefined,
  onQuickSelect: (pct: number) => void,
  actionLabel: string,
  actionDisabled: boolean,
  actionGradient: string,
  onAction: () => void,
  amountClassName?: string
) {
  return {
    form,
    amount,
    usdPrice,
    onQuickSelect,
    actionLabel,
    actionDisabled,
    actionGradient,
    onAction,
    ...(amountClassName ? { amountClassName } : {}),
  } as const;
}

type SummaryProps = TransactionFormLayoutProps["summary"];

export function createSummary(
  transactionData: ReturnType<typeof useTransactionTokenData>,
  amount: string,
  actionLabel: SummaryProps["actionLabel"],
  extras?: Partial<SummaryProps>
): SummaryProps {
  return {
    chain: transactionData.selectedChain,
    token: transactionData.selectedToken,
    amount,
    usdAmount: transactionData.usdAmount,
    actionLabel,
    ...extras,
  };
}

export function createActionButtons(
  config: Omit<ActionButtonsProps, "status"> & {
    status: ActionButtonsProps["status"];
  }
): ActionButtonsProps {
  return {
    gradient: config.gradient,
    disabled: config.disabled,
    isConnected: config.isConnected,
    status: config.status,
    submittingLabel: config.submittingLabel,
    readyLabel: config.readyLabel,
    ...(config.connectLabel ? { connectLabel: config.connectLabel } : {}),
    onConfirm: config.onConfirm,
    onCancel: config.onCancel,
  };
}

export function formatSuccessMessage(txHash?: string, label?: string) {
  if (!txHash || !label) {
    return null;
  }
  return `${label} simulated. Tx: ${txHash.slice(0, 12)}…`;
}
