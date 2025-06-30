"use client";

import { motion } from "framer-motion";
import { ReactNode, memo } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  testId?: string;
  onClick?: () => void;
}

export const GlassCard = memo<GlassCardProps>(function GlassCard({
  children,
  className = "",
  animate = true,
  testId,
  onClick,
}) {
  const baseClasses = "glass-morphism rounded-3xl p-6 border border-gray-800";
  const fullClassName = `${baseClasses} ${className}`;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={fullClassName}
        data-testid={testId}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={fullClassName} data-testid={testId} onClick={onClick}>
      {children}
    </div>
  );
});
