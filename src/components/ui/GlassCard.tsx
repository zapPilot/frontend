"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type AriaLive = "off" | "polite" | "assertive";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  testId?: string;
  role?: string;
  ariaLive?: AriaLive;
}

export function GlassCard({
  children,
  className = "",
  animate = true,
  testId,
  role,
  ariaLive,
}: GlassCardProps) {
  const baseClasses = "glass-morphism rounded-3xl p-6 border border-gray-800";
  const fullClassName = `${baseClasses} ${className}`;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={fullClassName}
        data-testid={testId}
        role={role}
        aria-live={ariaLive}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={fullClassName}
      data-testid={testId}
      role={role}
      aria-live={ariaLive}
    >
      {children}
    </div>
  );
}
