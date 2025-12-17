import type { UseFormReturn } from "react-hook-form";

import type { TransactionFormData } from "@/types/domain/transaction";

import { useTransactionTokenData } from "./useTransactionTokenData";

export function useTransactionViewModel(
  form: UseFormReturn<TransactionFormData>,
  isOpen: boolean
) {
  const chainId = form.watch("chainId");
  const tokenAddress = form.watch("tokenAddress");
  const amount = form.watch("amount");

  const transactionData = useTransactionTokenData({
    isOpen,
    chainId,
    tokenAddress,
    setTokenAddress: address => form.setValue("tokenAddress", address),
    amount,
  });

  return {
    chainId,
    amount,
    transactionData,
  } as const;
}
