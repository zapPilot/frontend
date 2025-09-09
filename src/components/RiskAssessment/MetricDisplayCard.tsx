/**
 * Metric Display Card Component
 *
 * Shared component for displaying risk metrics with consistent styling
 * Used across different Risk Assessment layout variations
 */

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { GlassCard } from "../ui";

export interface MetricDisplayCardProps {
  title: string;
  value: string;
  subtitle?: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "very-high";
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}

/**
 * Get severity-based color classes
 */
const getSeverityColors = (severity?: string) => {
  switch (severity) {
    case "very-high":
      return {
        value: "text-red-400",
        border: "border-red-800/30",
        bg: "bg-red-900/20",
        subtitle: "text-red-300",
        icon: "text-red-400",
      };
    case "high":
      return {
        value: "text-orange-400",
        border: "border-orange-800/30",
        bg: "bg-orange-900/20",
        subtitle: "text-orange-300",
        icon: "text-orange-400",
      };
    case "medium":
      return {
        value: "text-yellow-400",
        border: "border-yellow-800/30",
        bg: "bg-yellow-900/20",
        subtitle: "text-yellow-300",
        icon: "text-yellow-400",
      };
    case "low":
      return {
        value: "text-green-400",
        border: "border-green-800/30",
        bg: "bg-green-900/20",
        subtitle: "text-green-300",
        icon: "text-green-400",
      };
    default:
      return {
        value: "text-white",
        border: "border-gray-800/30",
        bg: "bg-gray-900/20",
        subtitle: "text-gray-300",
        icon: "text-gray-400",
      };
  }
};

export function MetricDisplayCard({
  title,
  value,
  subtitle,
  description,
  severity,
  icon: Icon,
  className = "",
  children,
  delay = 0,
}: MetricDisplayCardProps) {
  const colors = getSeverityColors(severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      <GlassCard className={`p-6 h-full ${colors.bg} border ${colors.border}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {Icon && <Icon className={`w-5 h-5 mr-2 ${colors.icon}`} />}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <div className={`text-3xl font-bold ${colors.value} mb-1`}>
            {value}
          </div>
          {subtitle && (
            <div className={`text-sm font-medium ${colors.subtitle}`}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="text-sm text-gray-300 mb-4">{description}</div>
        )}

        {/* Additional Content */}
        {children && <div className="mt-4">{children}</div>}
      </GlassCard>
    </motion.div>
  );
}

/**
 * Simple Progress Bar Component for use within metric cards
 */
export function MetricProgressBar({
  value,
  max = 100,
  color = "bg-blue-500",
  height = "h-2",
  className = "",
}: {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  className?: string;
}) {
  const percentage = Math.min((Math.abs(value) / max) * 100, 100);

  return (
    <div className={`w-full bg-gray-800 rounded-full ${height} ${className}`}>
      <div
        className={`${color} ${height} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

/**
 * Metric Status Indicator Component
 */
export function MetricStatusIndicator({
  status,
  text,
}: {
  status: "good" | "warning" | "danger";
  text: string;
}) {
  const statusColors = {
    good: "text-green-400",
    warning: "text-yellow-400",
    danger: "text-red-400",
  };

  return (
    <div className={`text-xs font-medium ${statusColors[status]}`}>{text}</div>
  );
}
