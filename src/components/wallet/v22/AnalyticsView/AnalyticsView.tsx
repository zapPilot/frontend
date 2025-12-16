/**
 * Analytics View (Presentation Component)
 *
 * Pure presentation component for analytics dashboard
 * Receives all data and handlers via props
 */

import type { AnalyticsData, AnalyticsTimePeriod } from "@/types/analytics";

import { AdditionalMetricsGrid } from "./components/AdditionalMetricsGrid";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { ChartSection } from "./components/ChartSection";
import { KeyMetricsGrid } from "./components/KeyMetricsGrid";
import { MonthlyPnLHeatmap } from "./components/MonthlyPnLHeatmap";

/**
 * Analytics View Props
 */
interface AnalyticsViewProps {
  /** Transformed analytics data */
  data: AnalyticsData;
  /** Currently selected time period */
  selectedPeriod: AnalyticsTimePeriod;
  /** Active chart tab */
  activeChartTab: "performance" | "drawdown";
  /** Period change handler */
  onPeriodChange: (period: AnalyticsTimePeriod) => void;
  /** Chart tab change handler */
  onChartTabChange: (tab: "performance" | "drawdown") => void;
}

/**
 * Analytics View
 *
 * Pure presentation component composing:
 * - Header with title and export button
 * - Chart section with tabs and period selector
 * - Key metrics grid (4 primary metrics)
 * - Additional metrics grid (4 secondary metrics)
 * - Monthly PnL heatmap
 *
 * All state and data fetching handled by AnalyticsViewContainer.
 */
export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  data,
  selectedPeriod,
  activeChartTab,
  onPeriodChange,
  onChartTabChange,
}) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    {/* Header */}
    <AnalyticsHeader />

    {/* Primary Chart Section with Tabs */}
    <ChartSection
      data={data}
      selectedPeriod={selectedPeriod}
      activeChartTab={activeChartTab}
      onPeriodChange={onPeriodChange}
      onChartTabChange={onChartTabChange}
    />

    {/* Key Metrics Grid */}
    <KeyMetricsGrid metrics={data.keyMetrics} />

    {/* Additional Metrics Row */}
    <AdditionalMetricsGrid metrics={data.keyMetrics} />

    {/* PnL Heatmap */}
    <MonthlyPnLHeatmap monthlyPnL={data.monthlyPnL} />
  </div>
);
