"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { ChainSwitcher } from "./ChainSwitcher";
import { SimpleConnectButton } from "./SimpleConnectButton";

interface HeaderWalletControlsProps {
  className?: string;
  isMobile?: boolean;
}

const HeaderWalletControlsComponent = ({
  className = "",
  isMobile = false,
}: HeaderWalletControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 ${className}`}
    >
      {/* Chain Switcher - Always visible on mobile now */}
      <ChainSwitcher
        variant="primary"
        className={`
          ${isMobile ? "min-w-[120px]" : "min-w-[140px]"}
          transition-all duration-200
        `}
      />

      {/* Connect Button */}
      <SimpleConnectButton
        variant={isMobile ? "ghost" : "primary"}
        size={isMobile ? "sm" : "md"}
        className="transition-all duration-200"
      />
    </motion.div>
  );
};

export const HeaderWalletControls = memo(HeaderWalletControlsComponent);
