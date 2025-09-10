/**
 * Risk Metric Card Component
 *
 * Displays individual risk metrics with detailed explanations
 */

import { motion } from "framer-motion";
import { Calendar, LucideIcon } from "lucide-react";
import {
  DRAWDOWN_COLORS,
  DRAWDOWN_LABELS,
  DrawdownLevel,
  RISK_COLORS,
  RISK_LABELS,
  RiskLevel,
} from "../../../utils/risk";
import { GlassCard } from "../../ui";

interface RiskMetricCardProps {
  title: string;
  value: number;
  unit: string;
  riskLevel: RiskLevel | DrawdownLevel;
  icon: LucideIcon;
  explanation: string;
  contextDescription: string;
  supportingData: Array<{
    label: string;
    value: string;
  }>;
  periodInfo: {
    dateRange: string;
    dataPoints: number;
  };
  delay?: number;
  className?: string;
}

export function RiskMetricCard({
  title,
  value,
  unit,
  riskLevel,
  icon: Icon,
  explanation,
  contextDescription,
  supportingData,
  periodInfo,
  delay = 0,
  className = "",
}: RiskMetricCardProps) {
  const colors =
    riskLevel in RISK_COLORS
      ? RISK_COLORS[riskLevel as RiskLevel]
      : riskLevel in DRAWDOWN_COLORS
        ? DRAWDOWN_COLORS[riskLevel as DrawdownLevel]
        : RISK_COLORS.low; // Fallback to low risk colors

  const label =
    riskLevel in RISK_LABELS
      ? RISK_LABELS[riskLevel as RiskLevel]
      : riskLevel in DRAWDOWN_LABELS
        ? DRAWDOWN_LABELS[riskLevel as DrawdownLevel]
        : "Unknown"; // Fallback label

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      <GlassCard className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <Icon className={`w-6 h-6 ${colors.icon} mr-3`} aria-hidden="true" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        {/* Main Metric */}
        <div className="mb-6">
          <div className="flex items-baseline mb-2">
            <span
              className={`text-4xl font-bold ${colors.value}`}
              aria-label={`${title}: ${value.toFixed(1)}${unit}`}
            >
              {value.toFixed(1)}
              {unit}
            </span>
            <span
              className={`ml-3 text-sm font-medium px-2 py-1 rounded ${colors.badge}`}
              role="status"
              aria-label={`Risk level: ${label}`}
            >
              {label}
            </span>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="space-y-4">
          <div className="text-gray-300 text-sm leading-relaxed">
            <p className="mb-3">
              <strong>What this means:</strong> {explanation}
            </p>
            <p className="mb-3">
              <strong>In context:</strong> {contextDescription}
            </p>
          </div>

          {/* Supporting Data */}
          {supportingData.length > 0 && (
            <div
              className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${colors.bg}`}
            >
              {supportingData.map((data, index) => (
                <div key={index}>
                  <div className="text-xs text-gray-400 mb-1">{data.label}</div>
                  <div className="text-sm font-semibold text-white">
                    {data.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Period Information */}
          <div className="text-xs text-gray-500 flex items-center">
            <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>
              Analysis period: {periodInfo.dateRange} ({periodInfo.dataPoints}{" "}
              data points)
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
