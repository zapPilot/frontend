import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import React from "react";

import { GRADIENTS } from "../../constants/design-system";
import { GradientButton } from "../ui";

interface WalletActionsProps {
  onZapInClick?: (() => void) | undefined;
  onZapOutClick?: (() => void) | undefined;
  onOptimizeClick?: (() => void) | undefined;
  disabled?: boolean;
}

export const WalletActions = React.memo<WalletActionsProps>(
  ({ onZapInClick, onZapOutClick, disabled = false }) => {
    return (
      <div className="grid grid-cols-2 gap-3">
        <GradientButton
          gradient={GRADIENTS.SUCCESS}
          shadowColor="green-500"
          icon={ArrowUpRight}
          disabled={disabled}
          {...(!disabled && onZapInClick ? { onClick: onZapInClick } : {})}
        >
          <span className="text-sm">Zap In</span>
        </GradientButton>

        <GradientButton
          gradient={GRADIENTS.DANGER}
          shadowColor="red-500"
          icon={ArrowDownLeft}
          disabled={disabled}
          {...(!disabled && onZapOutClick ? { onClick: onZapOutClick } : {})}
        >
          <span className="text-sm">Zap Out</span>
        </GradientButton>
      </div>
    );
  }
);

WalletActions.displayName = "WalletActions";
