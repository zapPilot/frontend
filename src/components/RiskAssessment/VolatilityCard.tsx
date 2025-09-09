/**
 * Volatility Card Component
 *
 * Displays portfolio volatility metrics including daily, annualized volatility
 * and average returns with period information
 */

import { motion } from "framer-motion";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { VolatilityData } from "../../types/risk";
import { GlassCard } from "../ui";

interface VolatilityCardProps {
  volatilityData: VolatilityData;
  className?: string;
}

/**
 * Format date string for display
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Get volatility level indicator
 */
const getVolatilityLevel = (annualizedVolatility: number) => {
  if (annualizedVolatility > 1.0)
    return { level: "Very High", color: "text-red-400" };
  if (annualizedVolatility > 0.5)
    return { level: "High", color: "text-orange-400" };
  if (annualizedVolatility > 0.25)
    return { level: "Medium", color: "text-yellow-400" };
  return { level: "Low", color: "text-green-400" };
};

export function VolatilityCard({
  volatilityData,
  className = "",
}: VolatilityCardProps) {
  const {
    volatility_daily,
    volatility_annualized,
    average_daily_return,
    period_days,
    data_points,
    period_info,
  } = volatilityData;

  const volatilityLevel = getVolatilityLevel(volatility_annualized);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={className}
    >
      <GlassCard className="p-6 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
            Volatility Analysis
          </h3>
          <div className={`text-sm font-medium ${volatilityLevel.color}`}>
            {volatilityLevel.level}
          </div>
        </div>

        {/* Main Metrics */}
        <div className="space-y-4 mb-6">
          {/* Annualized Volatility - Most Important */}
          <div className="p-4 glass-morphism rounded-lg border border-purple-800/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">
                Annualized Volatility
              </span>
              <div className={`text-2xl font-bold ${volatilityLevel.color}`}>
                {(volatility_annualized * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-xs text-gray-500">
              12-month estimated volatility
            </div>
          </div>

          {/* Daily Metrics Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Daily Volatility */}
            <div className="p-3 glass-morphism rounded-lg">
              <div className="text-lg font-bold text-white mb-1">
                {(volatility_daily * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400">Daily Volatility</div>
            </div>

            {/* Average Daily Return */}
            <div className="p-3 glass-morphism rounded-lg">
              <div
                className={`text-lg font-bold mb-1 ${
                  average_daily_return >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {average_daily_return >= 0 ? "+" : ""}
                {(average_daily_return * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400">Avg Daily Return</div>
            </div>
          </div>
        </div>

        {/* Analysis Period Info */}
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              Analysis Period
            </div>
            <div className="text-gray-300">{period_days} days</div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>
              {formatDate(period_info.start_date)} -{" "}
              {formatDate(period_info.end_date)}
            </span>
            <div className="flex items-center">
              <BarChart3 className="w-3 h-3 mr-1" />
              {data_points} data points
            </div>
          </div>
        </div>

        {/* Volatility Interpretation */}
        <div className="mt-4 p-3 bg-purple-900/20 border border-purple-800/30 rounded-lg">
          <div className="text-xs text-purple-300">
            {volatility_annualized > 1.0 &&
              "Very high volatility indicates significant price swings. Portfolio value may fluctuate dramatically."}
            {volatility_annualized <= 1.0 &&
              volatility_annualized > 0.5 &&
              "High volatility suggests notable price movements. Expect moderate to significant fluctuations."}
            {volatility_annualized <= 0.5 &&
              volatility_annualized > 0.25 &&
              "Medium volatility shows moderate price stability with some fluctuation."}
            {volatility_annualized <= 0.25 &&
              "Low volatility indicates relatively stable price movements."}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
