import { useState } from "react";

import type { TransactionResult } from "@/types/domain/transaction";

export function useTransactionStatus() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );
  const [result, setResult] = useState<TransactionResult | null>(null);

  const resetStatus = () => {
    setStatus("idle");
    setResult(null);
  };

  return { status, setStatus, result, setResult, resetStatus };
}
