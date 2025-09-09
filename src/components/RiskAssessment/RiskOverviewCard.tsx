/**
 * Risk Overview Card Component
 *
 * Displays the main risk score and level prominently with visual indicators
 */

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { SummaryMetrics } from "../../types/risk";
import { GlassCard } from "../ui";

interface RiskOverviewCardProps {
  summaryMetrics: SummaryMetrics;
  className?: string;
}

/**
 * Get color classes based on risk level
 */
const getRiskLevelColors = (level: string) => {
  switch (level.toLowerCase()) {
    case "very high":
      return {
        bg: "bg-red-900/20",
        border: "border-red-800/30",
        text: "text-red-300",
        icon: "text-red-400",
        gradient: "from-red-500 to-red-400",
      };
    case "high":
      return {
        bg: "bg-orange-900/20",
        border: "border-orange-800/30",
        text: "text-orange-300",
        icon: "text-orange-400",
        gradient: "from-orange-500 to-orange-400",
      };
    case "medium":
      return {
        bg: "bg-yellow-900/20",
        border: "border-yellow-800/30",
        text: "text-yellow-300",
        icon: "text-yellow-400",
        gradient: "from-yellow-500 to-yellow-400",
      };
    case "low":
      return {
        bg: "bg-green-900/20",
        border: "border-green-800/30",
        text: "text-green-300",
        icon: "text-green-400",
        gradient: "from-green-500 to-green-400",
      };
    default:
      return {
        bg: "bg-gray-900/20",
        border: "border-gray-800/30",
        text: "text-gray-300",
        icon: "text-gray-400",
        gradient: "from-gray-500 to-gray-400",
      };
  }
};

export function RiskOverviewCard({
  summaryMetrics,
  className = "",
}: RiskOverviewCardProps) {
  const { risk_score } = summaryMetrics;
  const colors = getRiskLevelColors(risk_score.level);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <GlassCard className={`p-6 ${colors.bg} ${colors.border} border-2`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <AlertTriangle className={`w-5 h-5 mr-2 ${colors.icon}`} />
            Overall Risk Score
          </h3>
        </div>

        {/* Main Risk Score Display */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div
              className={`text-5xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent mb-2`}
            >
              {risk_score.score.toFixed(1)}
            </div>
            <div className={`text-xl font-semibold ${colors.text}`}>
              {risk_score.level} Risk
            </div>
          </div>
        </div>

        {/* Risk Components Breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-300 mb-2">
            Risk Components
          </div>

          {/* Volatility Component */}
          <div className="flex items-center justify-between p-3 glass-morphism rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-purple-400 mr-2" />
              <span className="text-sm text-gray-300">Volatility</span>
            </div>
            <div className="text-sm font-medium text-white">
              {risk_score.volatility_component.toFixed(1)}
            </div>
          </div>

          {/* Drawdown Component */}
          <div className="flex items-center justify-between p-3 glass-morphism rounded-lg">
            <div className="flex items-center">
              <TrendingDown className="w-4 h-4 text-red-400 mr-2" />
              <span className="text-sm text-gray-300">Drawdown</span>
            </div>
            <div className="text-sm font-medium text-white">
              {risk_score.drawdown_component.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Risk Level Description */}
        <div
          className={`mt-4 p-3 ${colors.bg} ${colors.border} border rounded-lg`}
        >
          <div className={`text-xs ${colors.text}`}>
            {risk_score.level === "Very High" &&
              "This portfolio exhibits very high volatility and significant drawdown risk. Consider diversification strategies."}
            {risk_score.level === "High" &&
              "This portfolio has elevated risk levels that may not be suitable for conservative investors."}
            {risk_score.level === "Medium" &&
              "This portfolio shows moderate risk levels appropriate for balanced investment strategies."}
            {risk_score.level === "Low" &&
              "This portfolio demonstrates low risk characteristics suitable for conservative investors."}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
