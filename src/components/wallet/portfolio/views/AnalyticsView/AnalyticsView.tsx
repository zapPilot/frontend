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
  /** Loading state for individual components */
  isLoading?: boolean;
  /** Independent loading state for monthly PnL (yield/daily endpoint) */
  isMonthlyPnLLoading?: boolean;
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
  isLoading = false,
  isMonthlyPnLLoading = false,
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
      isLoading={isLoading}
    />

    {/* Key Metrics Grid */}
    <KeyMetricsGrid metrics={data.keyMetrics} isLoading={isLoading} />

    {/* Additional Metrics Row */}
    <AdditionalMetricsGrid metrics={data.keyMetrics} isLoading={isLoading} />

    {/* PnL Heatmap - Uses independent loading state for yield/daily endpoint */}
    <MonthlyPnLHeatmap monthlyPnL={data.monthlyPnL} isLoading={isMonthlyPnLLoading} />
  </div>
);
