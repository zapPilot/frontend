/**
 * Compact Metric Display Component
 *
 * Reusable component for displaying metrics in compact format
 * Used by all performance metric variations
 */

import React from "react";

import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";

import type { CompactMetricProps } from "./types";

export function CompactMetricDisplay({
  label,
  value,
  icon: Icon,
  subtext,
  colorClass = "text-white",
  isLoading = false,
  badge,
  badgeVariant = "info",
}: CompactMetricProps) {
  // Badge styling
  const getBadgeClass = () => {
    switch (badgeVariant) {
      case "info":
        return "bg-purple-900/20 text-purple-400";
      case "success":
        return "bg-green-900/20 text-green-400";
      case "warning":
        return "bg-yellow-900/20 text-yellow-400";
      default:
        return "bg-gray-800 text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-gray-400">{label}</p>
        <WalletMetricsSkeleton showValue showPercentage={false} />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${colorClass}`} />}
        <span className={`text-lg font-semibold ${colorClass}`}>
          {value}
        </span>
        {badge && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${getBadgeClass()}`}>
            {badge}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
    </div>
  );
}
