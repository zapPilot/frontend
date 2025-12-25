import type { UseFormReturn } from "react-hook-form";

import type { TransactionFormData } from "@/types/domain/transaction";

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
