/**
 * Risk Comparison View - Variation 1
 *
 * Side-by-side comparison of Annualized Volatility and Maximum Drawdown
 * Optimized for quick scanning and direct comparison of the two key risk metrics
 */

import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { ActualRiskSummaryResponse } from "../../types/risk";
import {
  MetricDisplayCard,
  MetricProgressBar,
  MetricStatusIndicator,
} from "./MetricDisplayCard";

interface RiskComparisonViewProps {
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
    year: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return `${startStr} - ${endStr}`;
};

/**
 * Get volatility severity level
 */
const getVolatilitySeverity = (
  volatility: number
): "low" | "medium" | "high" | "very-high" => {
  if (volatility > 100) return "very-high";
  if (volatility > 50) return "high";
  if (volatility > 25) return "medium";
  return "low";
};

/**
 * Get drawdown severity level
 */
const getDrawdownSeverity = (
  drawdown: number
): "low" | "medium" | "high" | "very-high" => {
  const absDrawdown = Math.abs(drawdown);
  if (absDrawdown >= 20) return "very-high";
  if (absDrawdown >= 15) return "high";
  if (absDrawdown >= 10) return "medium";
  return "low";
};

export function RiskComparisonView({
  data,
  className = "",
}: RiskComparisonViewProps) {
  const { summary_metrics, risk_summary } = data;
  const volatilityPct = summary_metrics.annualized_volatility_percentage;
  const drawdownPct = summary_metrics.max_drawdown_percentage;

  const volatilitySeverity = getVolatilitySeverity(volatilityPct);
  const drawdownSeverity = getDrawdownSeverity(drawdownPct);

  // Analysis period from volatility data (could use drawdown as well)
  const periodInfo = risk_summary.volatility.period_info;
  const periodText = formatDateRange(
    periodInfo.start_date,
    periodInfo.end_date
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Period Context */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          Risk Assessment Comparison
        </h3>
        <div className="flex items-center text-sm text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {periodText}
        </div>
      </div>

      {/* Side-by-Side Metric Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Annualized Volatility Card */}
        <MetricDisplayCard
          title="Annualized Volatility"
          value={`${volatilityPct.toFixed(1)}%`}
          subtitle={volatilitySeverity.replace("-", " ").toUpperCase()}
          description="Expected annual price fluctuation range. Higher values indicate more potential for gains and losses."
          severity={volatilitySeverity}
          icon={TrendingUp}
          delay={0.1}
        >
          <div className="space-y-3">
            {/* Daily Volatility Context */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Daily Volatility</span>
              <span className="text-gray-300 font-medium">
                {(risk_summary.volatility.volatility_daily * 100).toFixed(2)}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <MetricProgressBar
              value={volatilityPct}
              max={200}
              color={
                volatilitySeverity === "very-high"
                  ? "bg-red-500"
                  : volatilitySeverity === "high"
                    ? "bg-orange-500"
                    : volatilitySeverity === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
              }
            />

            {/* Interpretation */}
            <MetricStatusIndicator
              status={
                volatilitySeverity === "very-high" ||
                volatilitySeverity === "high"
                  ? "danger"
                  : volatilitySeverity === "medium"
                    ? "warning"
                    : "good"
              }
              text={
                volatilitySeverity === "very-high"
                  ? "Extreme price swings expected"
                  : volatilitySeverity === "high"
                    ? "Significant price movements likely"
                    : volatilitySeverity === "medium"
                      ? "Moderate price fluctuations"
                      : "Relatively stable price movements"
              }
            />

            {/* Data Confidence */}
            <div className="text-xs text-gray-500">
              Based on {risk_summary.volatility.data_points} data points over{" "}
              {risk_summary.volatility.period_days} days
            </div>
          </div>
        </MetricDisplayCard>

        {/* Maximum Drawdown Card */}
        <MetricDisplayCard
          title="Maximum Drawdown"
          value={`${drawdownPct.toFixed(1)}%`}
          subtitle={drawdownSeverity.replace("-", " ").toUpperCase()}
          description="Largest peak-to-trough decline experienced. Shows potential downside risk during adverse conditions."
          severity={drawdownSeverity}
          icon={TrendingDown}
          delay={0.2}
        >
          <div className="space-y-3">
            {/* Peak and Trough Values */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-400">Peak Value</div>
                <div className="text-green-400 font-medium">
                  ${risk_summary.drawdown.peak_value.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Trough Value</div>
                <div className="text-red-400 font-medium">
                  ${risk_summary.drawdown.trough_value.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Recovery Information */}
            {risk_summary.drawdown.recovery_needed_percentage > 0 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Recovery Needed</span>
                  <span className="text-orange-400 font-medium">
                    +
                    {risk_summary.drawdown.recovery_needed_percentage.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
                <MetricProgressBar
                  value={risk_summary.drawdown.recovery_needed_percentage}
                  max={30}
                  color="bg-orange-500"
                />
              </>
            )}

            {/* Status Indicator */}
            <MetricStatusIndicator
              status={
                drawdownSeverity === "very-high" || drawdownSeverity === "high"
                  ? "danger"
                  : drawdownSeverity === "medium"
                    ? "warning"
                    : "good"
              }
              text={
                drawdownSeverity === "very-high"
                  ? "Severe historical losses"
                  : drawdownSeverity === "high"
                    ? "Significant historical decline"
                    : drawdownSeverity === "medium"
                      ? "Moderate historical losses"
                      : "Limited historical downside"
              }
            />

            {/* Drawdown Date Context */}
            <div className="text-xs text-gray-500">
              Max drawdown occurred on{" "}
              {new Date(
                risk_summary.drawdown.max_drawdown_date
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </MetricDisplayCard>
      </div>

      {/* Actionable Insight */}
      <div className="p-4 glass-morphism rounded-lg border border-blue-800/30 bg-blue-900/20">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-blue-300 mb-1">
              Risk Management Insight
            </div>
            <div className="text-xs text-blue-200">
              {volatilitySeverity === "very-high" &&
                drawdownSeverity === "very-high" &&
                "This high-volatility, high-drawdown portfolio may benefit from position sizing, stop-losses, or hedging strategies."}
              {volatilitySeverity === "very-high" &&
                drawdownSeverity !== "very-high" &&
                "High volatility with manageable drawdowns suggests good upside capture. Consider volatility management tools."}
              {volatilitySeverity !== "very-high" &&
                drawdownSeverity === "very-high" &&
                "Significant drawdowns despite lower volatility may indicate concentrated positions or correlation risk."}
              {volatilitySeverity !== "very-high" &&
                drawdownSeverity !== "very-high" &&
                "Balanced risk profile with manageable volatility and drawdowns. Monitor for changes in market conditions."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
