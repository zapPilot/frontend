/**
 * Risk Narrative View - Variation 2
 *
 * Educational storytelling approach with detailed explanations
 * Mobile-first design that guides users through understanding each risk metric
 */

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Info,
} from "lucide-react";
import { ActualRiskSummaryResponse } from "../../types/risk";
import { GlassCard } from "../ui";

interface RiskNarrativeViewProps {
  data: ActualRiskSummaryResponse;
  className?: string;
}

/**
 * Format date for display
 */
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startStr} - ${endStr}`;
};

/**
 * Generate key takeaway message based on risk levels
 */
const generateKeyTakeaway = (
  volatilityPct: number,
  drawdownPct: number
): string => {
  const highVolatility = volatilityPct > 50;
  const highDrawdown = Math.abs(drawdownPct) > 15;

  if (highVolatility && highDrawdown) {
    return "This portfolio exhibits a high-risk, high-reward profile with significant price swings and notable historical declines. Suitable for aggressive investors with high risk tolerance.";
  } else if (highVolatility && !highDrawdown) {
    return "This portfolio shows high volatility but manageable drawdowns, suggesting effective risk management during market downturns despite active price movements.";
  } else if (!highVolatility && highDrawdown) {
    return "This portfolio demonstrates moderate volatility but experienced significant drawdowns, possibly indicating concentrated positions or exposure to specific market events.";
  } else {
    return "This portfolio maintains a balanced risk profile with manageable volatility and drawdowns, suitable for moderate risk tolerance investors.";
  }
};

export function RiskNarrativeView({
  data,
  className = "",
}: RiskNarrativeViewProps) {
  const { summary_metrics, risk_summary } = data;
  const volatilityPct = summary_metrics.annualized_volatility_percentage;
  const drawdownPct = summary_metrics.max_drawdown_percentage;

  // Get period information
  const volatilityPeriod = formatDateRange(
    risk_summary.volatility.period_info.start_date,
    risk_summary.volatility.period_info.end_date
  );
  const drawdownPeriod = formatDateRange(
    risk_summary.drawdown.period_info.start_date,
    risk_summary.drawdown.period_info.end_date
  );

  const keyTakeaway = generateKeyTakeaway(volatilityPct, drawdownPct);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Risk Assessment Analysis
        </h3>
        <p className="text-gray-400 text-sm">
          Understanding your portfolio&apos;s risk characteristics and
          historical performance
        </p>
      </div>

      {/* Key Takeaway Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard className="p-6 bg-blue-900/20 border border-blue-800/30">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-medium text-blue-300 mb-2">
                Key Takeaway
              </h4>
              <p className="text-blue-200 text-sm leading-relaxed">
                {keyTakeaway}
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Annualized Volatility - Detailed Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-400 mr-3" />
            <h4 className="text-lg font-semibold text-white">
              Annualized Volatility
            </h4>
          </div>

          {/* Main Metric */}
          <div className="mb-6">
            <div className="flex items-baseline mb-2">
              <span className="text-4xl font-bold text-purple-400">
                {volatilityPct.toFixed(1)}%
              </span>
              <span
                className={`ml-3 text-sm font-medium px-2 py-1 rounded ${
                  volatilityPct > 100
                    ? "bg-red-900/30 text-red-400"
                    : volatilityPct > 50
                      ? "bg-orange-900/30 text-orange-400"
                      : volatilityPct > 25
                        ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-green-900/30 text-green-400"
                }`}
              >
                {volatilityPct > 100
                  ? "Very High"
                  : volatilityPct > 50
                    ? "High"
                    : volatilityPct > 25
                      ? "Medium"
                      : "Low"}
              </span>
            </div>
          </div>

          {/* Detailed Explanation */}
          <div className="space-y-4">
            <div className="text-gray-300 text-sm leading-relaxed">
              <p className="mb-3">
                <strong>What this means:</strong> This metric reflects how much
                your portfolio&apos;s value is expected to fluctuate over a
                year. A value of {volatilityPct.toFixed(1)}% suggests that in a
                typical year, your portfolio might move up or down by roughly
                this percentage from its average value.
              </p>

              <p className="mb-3">
                <strong>In context:</strong> This level is{" "}
                {volatilityPct > 100
                  ? "extremely high compared to market benchmarks"
                  : volatilityPct > 50
                    ? "significantly higher than typical market indices"
                    : volatilityPct > 25
                      ? "moderately elevated compared to conservative portfolios"
                      : "relatively conservative compared to growth-oriented investments"}
                , indicating{" "}
                {volatilityPct > 50
                  ? "aggressive growth potential with substantial risk"
                  : "a balanced approach to growth and stability"}
                .
              </p>
            </div>

            {/* Supporting Data */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-900/20 rounded-lg">
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  Daily Volatility
                </div>
                <div className="text-sm font-semibold text-white">
                  {(risk_summary.volatility.volatility_daily * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  Analysis Period
                </div>
                <div className="text-sm font-semibold text-white">
                  {risk_summary.volatility.period_days} days
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Analysis period: {volatilityPeriod} (
              {risk_summary.volatility.data_points} data points)
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Maximum Drawdown - Detailed Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center mb-4">
            <TrendingDown className="w-6 h-6 text-red-400 mr-3" />
            <h4 className="text-lg font-semibold text-white">
              Maximum Drawdown
            </h4>
          </div>

          {/* Main Metric */}
          <div className="mb-6">
            <div className="flex items-baseline mb-2">
              <span className="text-4xl font-bold text-red-400">
                {drawdownPct.toFixed(1)}%
              </span>
              <span
                className={`ml-3 text-sm font-medium px-2 py-1 rounded ${
                  Math.abs(drawdownPct) >= 20
                    ? "bg-red-900/30 text-red-400"
                    : Math.abs(drawdownPct) >= 15
                      ? "bg-orange-900/30 text-orange-400"
                      : Math.abs(drawdownPct) >= 10
                        ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-green-900/30 text-green-400"
                }`}
              >
                {Math.abs(drawdownPct) >= 20
                  ? "Severe"
                  : Math.abs(drawdownPct) >= 15
                    ? "High"
                    : Math.abs(drawdownPct) >= 10
                      ? "Moderate"
                      : "Low"}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Occurred on{" "}
              {new Date(
                risk_summary.drawdown.max_drawdown_date
              ).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Detailed Explanation */}
          <div className="space-y-4">
            <div className="text-gray-300 text-sm leading-relaxed">
              <p className="mb-3">
                <strong>What this means:</strong> During the analysis period,
                your portfolio experienced its worst peak-to-trough decline of{" "}
                {Math.abs(drawdownPct).toFixed(1)}%. This represents the maximum
                loss from a previous high point, showing the potential downside
                risk during adverse market conditions.
              </p>

              <p className="mb-3">
                <strong>Historical context:</strong> Your portfolio peaked at{" "}
                <span className="text-green-400 font-semibold">
                  ${risk_summary.drawdown.peak_value.toLocaleString()}
                </span>{" "}
                and declined to{" "}
                <span className="text-red-400 font-semibold">
                  ${risk_summary.drawdown.trough_value.toLocaleString()}
                </span>
                {risk_summary.drawdown.recovery_needed_percentage > 0 && (
                  <span>
                    {", "}requiring a{" "}
                    <span className="text-orange-400 font-semibold">
                      {risk_summary.drawdown.recovery_needed_percentage.toFixed(
                        1
                      )}
                      %
                    </span>{" "}
                    gain to fully recover
                  </span>
                )}
                .
              </p>
            </div>

            {/* Current Status */}
            <div
              className={`p-4 rounded-lg ${
                risk_summary.drawdown.current_drawdown_percentage < -1
                  ? "bg-red-900/20 border border-red-800/30"
                  : "bg-green-900/20 border border-green-800/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">
                  Current Status
                </span>
                <span
                  className={`text-sm font-semibold ${
                    risk_summary.drawdown.current_drawdown_percentage < -1
                      ? "text-red-300"
                      : "text-green-300"
                  }`}
                >
                  {risk_summary.drawdown.current_drawdown_percentage < -1
                    ? `In Drawdown (${risk_summary.drawdown.current_drawdown_percentage.toFixed(1)}%)`
                    : "Above Previous Peak"}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {risk_summary.drawdown.current_drawdown_percentage < -1
                  ? "Portfolio is currently below its previous peak value"
                  : "Portfolio has recovered from maximum drawdown"}
              </div>
            </div>

            <div className="text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Analysis period: {drawdownPeriod} (
              {risk_summary.drawdown.data_points} data points)
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Risk Management Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <GlassCard className="p-6 bg-yellow-900/20 border border-yellow-800/30">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-medium text-yellow-300 mb-3">
                Risk Management Considerations
              </h4>
              <div className="space-y-3 text-sm text-yellow-200">
                {volatilityPct > 100 && (
                  <div className="flex items-start space-x-2">
                    <span className="w-1 h-1 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></span>
                    <p>
                      <strong>High Volatility:</strong> Consider position sizing
                      strategies and avoid over-leveraging to manage the
                      significant price swings.
                    </p>
                  </div>
                )}

                {Math.abs(drawdownPct) > 15 && (
                  <div className="flex items-start space-x-2">
                    <span className="w-1 h-1 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></span>
                    <p>
                      <strong>Significant Drawdowns:</strong> Implement
                      stop-loss strategies or hedging mechanisms to limit
                      downside exposure during market stress.
                    </p>
                  </div>
                )}

                <div className="flex items-start space-x-2">
                  <span className="w-1 h-1 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></span>
                  <p>
                    <strong>Diversification:</strong> Review portfolio
                    concentration and consider diversification across asset
                    classes, sectors, and geographic regions.
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="w-1 h-1 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></span>
                  <p>
                    <strong>Regular Monitoring:</strong> These metrics can
                    change as market conditions evolve. Regular reassessment
                    helps maintain appropriate risk levels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
