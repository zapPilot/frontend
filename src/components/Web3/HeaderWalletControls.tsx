"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { ChainSwitcher } from "./ChainSwitcher";
import { SimpleConnectButton } from "./SimpleConnectButton";
// Analytics imports ready for future integration:
// import { useAnalytics } from "@/hooks/useAnalytics";
// import { useOnboarding } from "@/providers/OnboardingProvider";

type WalletControlsSize = "compact" | "normal" | "full";

interface HeaderWalletControlsProps {
  className?: string;
  size?: WalletControlsSize;
  isMobile?: boolean;
}

const HeaderWalletControlsComponent = ({
  className = "",
  size = "normal",
  isMobile = false,
}: HeaderWalletControlsProps) => {
  // Note: Analytics integration ready for when component callbacks are available
  // const { trackWalletInteraction } = useAnalytics();
  // const { markStepCompleted } = useOnboarding();
  const getVariant = () => {
    if (size === "compact") return "ghost";
    if (isMobile) return "ghost";
    return "primary";
  };

  const getButtonSize = () => {
    if (size === "compact") return "sm";
    if (isMobile) return "sm";
    return "md";
  };

  const getSpacing = () => {
    if (size === "compact") return "gap-2";
    return "gap-3";
  };

  const getChainSwitcherWidth = () => {
    if (size === "compact") return "min-w-[100px]";
    if (isMobile) return "min-w-[120px]";
    return "min-w-[140px]";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center ${getSpacing()} ${className}`}
    >
      {/* Chain Switcher */}
      <div data-testid="chain-switcher">
        <ChainSwitcher
          variant="primary"
          className={`${getChainSwitcherWidth()} transition-all duration-200`}
        />
      </div>

      {/* Connect Button */}
      <div data-testid="wallet-connect-button">
        <SimpleConnectButton
          variant={getVariant()}
          size={getButtonSize()}
          className="transition-all duration-200"
        />
      </div>
    </motion.div>
  );
};

export const HeaderWalletControls = memo(HeaderWalletControlsComponent);
