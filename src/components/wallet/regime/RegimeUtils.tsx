/**
 * Regime Utilities
 *
 * Shared components and constants for regime visualization.
 */

import { motion } from "framer-motion";

/**
 * Gradient definitions for allocation visualizations
 */
export const ALLOCATION_GRADIENTS = {
  crypto: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  stable: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
};

interface AllocationProgressBarProps {
  label: string;
  percentage: number;
  gradient: string;
  animated?: boolean;
}

/**
 * AllocationProgressBar Component
 *
 * Displays a labeled progress bar with gradient fill for allocation visualization.
 *
 * @param label - Display label for the bar
 * @param percentage - Percentage value (0-100)
 * @param gradient - CSS gradient string for the fill
 * @param animated - Enable Framer Motion animations
 */
export function AllocationProgressBar({
  label,
  percentage,
  gradient,
  animated = false,
}: AllocationProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const BarComponent = animated ? motion.div : "div";

  const barProps = animated
    ? {
        initial: { width: 0 },
        animate: { width: `${clampedPercentage}%` },
        transition: { duration: 0.8, ease: "easeOut" as const },
        style: { background: gradient },
      }
    : {
        style: { width: `${clampedPercentage}%`, background: gradient },
      };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white">{clampedPercentage}%</span>
      </div>
      <div
        className="w-full h-2 bg-gray-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${clampedPercentage}%`}
      >
        <BarComponent className="h-full rounded-full" {...barProps} />
      </div>
    </div>
  );
}
