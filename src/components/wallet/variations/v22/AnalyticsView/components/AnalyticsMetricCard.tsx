/**
 * Analytics Metric Card Component
 *
 * Reusable metric card for analytics metrics display
 */

import type React from "react";

import { BaseCard } from "@/components/ui/BaseCard";

/**
 * Analytics Metric Card Props
 */
export interface AnalyticsMetricCardProps {
  /** Icon component */
  icon: React.ElementType;
  /** Metric label */
  label: string;
  /** Main value display */
  value: string;
  /** Subtitle/context value */
  subValue: string;
  /** Color class for value (default: text-white) */
  valueColor?: string;
}

/**
 * Reusable metric card for analytics metrics
 *
 * Displays a metric with icon, label, value, and subtitle
 * in a consistent glass-morphism card layout.
 */
export const AnalyticsMetricCard: React.FC<AnalyticsMetricCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  valueColor = "text-white",
}) => (
  <BaseCard variant="glass" className="p-4">
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <div className={`text-lg font-mono ${valueColor}`}>{value}</div>
    <div className="text-[10px] text-gray-500">{subValue}</div>
  </BaseCard>
);
