"use client";

import { memo } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import type {
  OperationMode,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../../../types";
import { getActionButtonText } from "./utils";

interface ActionButtonProps {
  operationMode: OperationMode;
  includedCategories: ProcessedAssetCategory[];
  rebalanceMode?: RebalanceMode | undefined;
  onAction?: (() => void) | undefined;
  isEnabled?: boolean | undefined;
  disabledReason?: string | undefined;
}

export const ActionButton = memo<ActionButtonProps>(
  ({
    operationMode,
    includedCategories,
    rebalanceMode,
    onAction,
    isEnabled = true,
    disabledReason,
  }) => {
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
        <GradientButton
          {...(onAction && { onClick: onAction })}
          gradient={GRADIENTS.PRIMARY}
          disabled={includedCategories.length === 0 || !isEnabled}
          className={`w-full py-4 px-6 hover:${GRADIENTS.PRIMARY_HOVER} disabled:opacity-60`}
          testId="zap-action-button"
        >
          {buttonText}
        </GradientButton>
        {!isEnabled && disabledReason && (
          <p
            className="mt-2 text-xs text-red-400"
            data-testid="action-disabled-reason"
          >
            {disabledReason}
          </p>
        )}
      </div>
    );
  }
);

ActionButton.displayName = "ActionButton";
