import type { OperationMode } from "../../../types";

export const getActionButtonText = (
  operationMode: OperationMode,
  includedCount: number,
  rebalanceChanges: number
): string => {
  if (operationMode === "rebalance") {
    return `Execute Rebalance (${rebalanceChanges} changes)`;
  }

  if (operationMode === "zapIn") {
    return includedCount === 0
      ? "Select categories to Zap In"
      : `Zap In to ${includedCount} categor${includedCount === 1 ? "y" : "ies"}`;
  }

  if (operationMode === "zapOut") {
    return includedCount === 0
      ? "Select categories to Zap Out"
      : `Zap Out from ${includedCount} categor${includedCount === 1 ? "y" : "ies"}`;
  }

  return includedCount === 0
    ? "Select categories"
    : `Execute with ${includedCount} categor${includedCount === 1 ? "y" : "ies"}`;
};
