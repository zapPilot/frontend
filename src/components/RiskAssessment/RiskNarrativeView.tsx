/**
 * Risk Narrative View
 *
 * Educational storytelling approach with detailed explanations
 * Mobile-first design that guides users through understanding each risk metric
 */

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ActualRiskSummaryResponse } from "../../types/risk";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  formatDateRange,
  formatPercentage,
  getVolatilityLevel,
  getDrawdownLevel,
  getVolatilityDescription,
  generateKeyTakeaway,
  ANIMATION_DELAYS,
} from "../../utils/risk";
import {
  KeyTakeaway,
  RiskMetricCard,
  DrawdownStatus,
  RiskRecommendations,
} from "./components";

interface RiskNarrativeViewProps {
  data: ActualRiskSummaryResponse;
  className?: string;
}

export function RiskNarrativeView({
  data,
  className = "",
}: RiskNarrativeViewProps) {
  const { summary_metrics, risk_summary } = data;
  const volatilityPct = summary_metrics.annualized_volatility_percentage;
  const drawdownPct = summary_metrics.max_drawdown_percentage;
  const prefersReducedMotion = useReducedMotion();

  // Memoize calculations to prevent re-computation
  const calculations = useMemo(() => {
    const volatilityLevel = getVolatilityLevel(volatilityPct);
    const drawdownLevel = getDrawdownLevel(drawdownPct);
    const volatilityDesc = getVolatilityDescription(volatilityPct);
    const keyTakeaway = generateKeyTakeaway(volatilityPct, drawdownPct);

    // Format period information
    const volatilityPeriod = formatDateRange(
      risk_summary.volatility.period_info.start_date,
      risk_summary.volatility.period_info.end_date
    );
    const drawdownPeriod = formatDateRange(
      risk_summary.drawdown.period_info.start_date,
      risk_summary.drawdown.period_info.end_date
    );

    return {
      volatilityLevel,
      drawdownLevel,
      volatilityDesc,
      keyTakeaway,
      volatilityPeriod,
      drawdownPeriod,
    };
  }, [volatilityPct, drawdownPct, risk_summary]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <header className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">
          Risk Assessment Analysis
        </h2>
        <p className="text-gray-400 text-sm">
          Understanding your portfolio&apos;s risk characteristics and
          historical performance
        </p>
      </header>

      {/* Key Takeaway Summary */}
      <KeyTakeaway
        message={calculations.keyTakeaway}
        delay={prefersReducedMotion ? 0 : ANIMATION_DELAYS.KEY_TAKEAWAY}
      />

      {/* Annualized Volatility - Detailed Narrative */}
      <RiskMetricCard
        title="Annualized Volatility"
        value={volatilityPct}
        unit="%"
        riskLevel={calculations.volatilityLevel}
        icon={TrendingUp}
        explanation={`This metric reflects how much your portfolio's value is expected to fluctuate over a year. A value of ${formatPercentage(volatilityPct)} suggests that in a typical year, your portfolio might move up or down by roughly this percentage from its average value.`}
        contextDescription={`This level is ${calculations.volatilityDesc.context}, indicating ${calculations.volatilityDesc.implication}.`}
        supportingData={[
          {
            label: "Daily Volatility",
            value: formatPercentage(
              risk_summary.volatility.volatility_daily * 100,
              2
            ),
          },
          {
            label: "Analysis Period",
            value: `${risk_summary.volatility.period_days} days`,
          },
        ]}
        periodInfo={{
          dateRange: calculations.volatilityPeriod,
          dataPoints: risk_summary.volatility.data_points,
        }}
        delay={prefersReducedMotion ? 0 : ANIMATION_DELAYS.VOLATILITY}
      />

      {/* Maximum Drawdown - Detailed Narrative */}
      <section>
        <RiskMetricCard
          title="Maximum Drawdown"
          value={Math.abs(drawdownPct)}
          unit="%"
          riskLevel={calculations.drawdownLevel}
          icon={TrendingDown}
          explanation={`During the analysis period, your portfolio experienced its worst peak-to-trough decline of ${formatPercentage(Math.abs(drawdownPct))}. This represents the maximum loss from a previous high point, showing the potential downside risk during adverse market conditions.`}
          contextDescription="This metric helps understand the worst-case scenario your portfolio has historically experienced."
          supportingData={[]}
          periodInfo={{
            dateRange: calculations.drawdownPeriod,
            dataPoints: risk_summary.drawdown.data_points,
          }}
          delay={prefersReducedMotion ? 0 : ANIMATION_DELAYS.DRAWDOWN}
        />

        {/* Drawdown Status Details */}
        <div className="mt-4">
          <DrawdownStatus
            currentDrawdownPct={
              risk_summary.drawdown.current_drawdown_percentage
            }
            peakValue={risk_summary.drawdown.peak_value}
            troughValue={risk_summary.drawdown.trough_value}
            maxDrawdownDate={risk_summary.drawdown.max_drawdown_date}
            recoveryNeededPct={risk_summary.drawdown.recovery_needed_percentage}
          />
        </div>
      </section>

      {/* Risk Management Recommendations */}
      <RiskRecommendations
        volatilityPct={volatilityPct}
        drawdownPct={drawdownPct}
        delay={prefersReducedMotion ? 0 : ANIMATION_DELAYS.RECOMMENDATIONS}
      />
    </div>
  );
}
