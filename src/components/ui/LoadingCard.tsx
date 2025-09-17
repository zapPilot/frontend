import React from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { LoadingSpinner } from "./LoadingSystem";

export interface LoadingCardProps {
  title?: string;
  message?: string;
  showSpinner?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Loading state card with consistent styling
 */
export function LoadingCard({
  title = "Loading",
  message = "Please wait while we fetch your data...",
  showSpinner = true,
  className = "",
  children,
}: LoadingCardProps) {
  return (
    <GlassCard className={`text-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="py-8 px-4"
      >
        {showSpinner && (
          <div className="mb-4">
            <LoadingSpinner size="lg" />
          </div>
        )}

        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>

        {message && <p className="text-gray-600 mb-4">{message}</p>}

        {children}
      </motion.div>
    </GlassCard>
  );
}
