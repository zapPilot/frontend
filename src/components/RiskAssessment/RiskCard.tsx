/**
 * Individual Risk Metric Card Component
 *
 * Displays a single risk metric with value, level, and description
 */

import { RiskMetric } from "../../types/risk";
import { RiskBadge } from "./RiskBadge";

interface RiskCardProps {
  metric: RiskMetric;
}

export function RiskCard({ metric }: RiskCardProps) {
  // Format value based on unit
  const formatValue = (value: number, unit: string | null): string => {
    switch (unit) {
      case "%":
        return `${value}%`;
      case "ratio":
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const formattedValue = formatValue(metric.value, metric.unit);

  return (
    <div className="p-4 glass-morphism rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{metric.name}</span>
        <RiskBadge level={metric.level} />
      </div>
      <div className="text-lg font-bold text-white mb-1">{formattedValue}</div>
      <div className="text-xs text-gray-500">{metric.description}</div>
    </div>
  );
}
