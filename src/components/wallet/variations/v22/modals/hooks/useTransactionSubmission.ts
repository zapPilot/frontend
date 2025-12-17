import type { UseFormReturn } from "react-hook-form";

import type {
  TransactionFormData,
  TransactionResult,
} from "@/types/domain/transaction";

import { useTransactionStatus } from "./useTransactionStatus";

export function useTransactionSubmission(
  form: UseFormReturn<TransactionFormData>,
  isConnected: boolean,
  selectedToken: unknown,
  submitFn: (values: TransactionFormData) => Promise<TransactionResult>,
  onClose: () => void
) {
  const statusState = useTransactionStatus();

  const isSubmitDisabled =
    statusState.status === "submitting" ||
    !form.formState.isValid ||
    !isConnected ||
    !selectedToken;

  const handleSubmit = form.handleSubmit(async values => {
    statusState.setStatus("submitting");
    try {
      const response = await submitFn(values);
      statusState.setResult(response);
      statusState.setStatus("success");
    } catch (error) {
      statusState.setStatus("idle");
      throw error;
    }
  });

  const resetState = () => {
    statusState.resetStatus();
    onClose();
  };

  return { statusState, isSubmitDisabled, handleSubmit, resetState } as const;
}
