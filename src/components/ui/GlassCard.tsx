"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { BaseComponentProps } from "../../types/ui.types";
import { fadeInUp, SMOOTH_TRANSITION } from "@/lib/animationVariants";

type AriaLive = "off" | "polite" | "assertive";

interface GlassCardProps extends BaseComponentProps {
  children: ReactNode;
  animate?: boolean;
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
        {...fadeInUp}
        transition={SMOOTH_TRANSITION}
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
