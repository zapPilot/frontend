/**
 * Drawdown Card Component
 *
 * Displays portfolio drawdown analysis including max drawdown, recovery metrics,
 * and current drawdown status with historical context
 */

import { motion } from "framer-motion";
import {
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { DrawdownData } from "../../types/risk";
import { GlassCard } from "../ui";

interface DrawdownCardProps {
  drawdownData: DrawdownData;
  className?: string;
}

/**
 * Format currency value
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date string for display
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Get drawdown severity level and color
 */
const getDrawdownSeverity = (drawdownPercentage: number) => {
  const absDrawdown = Math.abs(drawdownPercentage);

  if (absDrawdown >= 20)
    return { level: "Severe", color: "text-red-400", bgColor: "bg-red-900/20" };
  if (absDrawdown >= 15)
    return {
      level: "High",
      color: "text-orange-400",
      bgColor: "bg-orange-900/20",
    };
  if (absDrawdown >= 10)
    return {
      level: "Moderate",
      color: "text-yellow-400",
      bgColor: "bg-yellow-900/20",
    };
  if (absDrawdown >= 5)
    return { level: "Low", color: "text-blue-400", bgColor: "bg-blue-900/20" };
  return {
    level: "Minimal",
    color: "text-green-400",
    bgColor: "bg-green-900/20",
  };
};

export function DrawdownCard({
  drawdownData,
  className = "",
}: DrawdownCardProps) {
  const {
    max_drawdown_percentage,
    current_drawdown_percentage,
    recovery_needed_percentage,
    peak_value,
    trough_value,
    max_drawdown_date,
    period_days,
    data_points,
    period_info,
  } = drawdownData;

  const severity = getDrawdownSeverity(max_drawdown_percentage);
  const isCurrentlyInDrawdown = current_drawdown_percentage < -1; // More than -1% is considered in drawdown

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={className}
    >
      <GlassCard className="p-6 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-red-400" />
            Drawdown Analysis
          </h3>
          <div className={`text-sm font-medium ${severity.color}`}>
            {severity.level}
          </div>
        </div>

        {/* Max Drawdown - Primary Metric */}
        <div
          className={`p-4 glass-morphism rounded-lg border border-red-800/30 mb-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Maximum Drawdown</span>
            <div className="text-2xl font-bold text-red-400">
              {max_drawdown_percentage.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            Occurred on {formatDate(max_drawdown_date)}
          </div>
        </div>

        {/* Peak to Trough Analysis */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Peak Value */}
          <div className="p-3 glass-morphism rounded-lg">
            <div className="flex items-center text-green-400 mb-1">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span className="text-xs">Peak</span>
            </div>
            <div className="text-sm font-bold text-white">
              {formatCurrency(peak_value)}
            </div>
          </div>

          {/* Trough Value */}
          <div className="p-3 glass-morphism rounded-lg">
            <div className="flex items-center text-red-400 mb-1">
              <ArrowDown className="w-4 h-4 mr-1" />
              <span className="text-xs">Trough</span>
            </div>
            <div className="text-sm font-bold text-white">
              {formatCurrency(trough_value)}
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div
          className={`p-3 rounded-lg mb-4 ${
            isCurrentlyInDrawdown
              ? "bg-red-900/20 border border-red-800/30"
              : "bg-green-900/20 border border-green-800/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Current Status</span>
            <div
              className={`text-sm font-medium ${
                isCurrentlyInDrawdown ? "text-red-300" : "text-green-300"
              }`}
            >
              {isCurrentlyInDrawdown
                ? `In Drawdown (${current_drawdown_percentage.toFixed(1)}%)`
                : "Above Peak"}
            </div>
          </div>
        </div>

        {/* Recovery Information */}
        {recovery_needed_percentage > 0 && (
          <div className="p-3 glass-morphism rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Recovery Needed</span>
              <div className="text-sm font-medium text-orange-400">
                +{recovery_needed_percentage.toFixed(1)}%
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full"
                style={{
                  width: `${Math.min(recovery_needed_percentage * 2, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Analysis Period */}
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              Analysis Period
            </div>
            <div className="text-gray-300">{period_days} days</div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {new Date(period_info.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(period_info.end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <div className="flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              {data_points} data points
            </div>
          </div>
        </div>

        {/* Risk Interpretation */}
        <div
          className={`mt-4 p-3 ${severity.bgColor} border border-red-800/30 rounded-lg`}
        >
          <div className="text-xs text-red-300">
            {Math.abs(max_drawdown_percentage) >= 20 &&
              "Severe drawdown indicates high portfolio risk. Consider risk management strategies."}
            {Math.abs(max_drawdown_percentage) < 20 &&
              Math.abs(max_drawdown_percentage) >= 15 &&
              "High drawdown suggests significant portfolio volatility during adverse conditions."}
            {Math.abs(max_drawdown_percentage) < 15 &&
              Math.abs(max_drawdown_percentage) >= 10 &&
              "Moderate drawdown shows typical market-related portfolio fluctuations."}
            {Math.abs(max_drawdown_percentage) < 10 &&
              "Low drawdown indicates good downside protection and risk management."}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
