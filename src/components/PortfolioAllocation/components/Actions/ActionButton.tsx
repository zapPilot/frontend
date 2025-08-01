"use client";

import { memo } from "react";
import { GRADIENTS } from "@/constants/design-system";
import {
  OperationMode,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../../types";

interface ActionButtonProps {
  operationMode: OperationMode;
  includedCategories: ProcessedAssetCategory[];
  rebalanceMode?: RebalanceMode | undefined;
  onAction?: (() => void) | undefined;
}

// Utility function for button text
const getActionButtonText = (
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

  // Default case
  return includedCount === 0
    ? "Select categories"
    : `Execute with ${includedCount} categor${includedCount === 1 ? "y" : "ies"}`;
};

export const ActionButton = memo<ActionButtonProps>(
  ({ operationMode, includedCategories, rebalanceMode, onAction }) => {
    const changesCount =
      rebalanceMode?.data?.shifts.filter(s => s.action !== "maintain").length ||
      0;
    const buttonText = getActionButtonText(
      operationMode,
      includedCategories.length,
      changesCount
    );

    return (
      <div className="pt-4">
        <button
          onClick={() => onAction?.()}
          disabled={includedCategories.length === 0}
          className={`w-full py-4 px-6 bg-gradient-to-r ${GRADIENTS.PRIMARY} text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:from-purple-500 hover:to-blue-500`}
          data-testid="zap-action-button"
        >
          {buttonText}
        </button>
      </div>
    );
  }
);

ActionButton.displayName = "ActionButton";
