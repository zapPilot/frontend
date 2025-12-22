/**
 * Analytics View Container
 *
 * Container component managing state and data fetching for analytics view
 * Follows Container/Presentational pattern
 */

"use client";

import { useState } from "react";

import { useAnalyticsData } from "@/hooks/queries/useAnalyticsData";
import { exportAnalyticsToCSV } from "@/services/analyticsExportService";
import type {
  AnalyticsData,
  AnalyticsTimePeriod,
  MetricData,
} from "@/types/analytics";

import { AnalyticsView } from "./AnalyticsView";
import { AnalyticsErrorState } from "./components/AnalyticsErrorState";
import { DEFAULT_ANALYTICS_PERIOD } from "./constants";

/**
 * Create empty metric data for fallback state
 */
function createEmptyMetric(label: string): MetricData {
  return {
    value: "0",
    subValue: label,
    trend: "neutral",
  };
}

/**
 * Create empty analytics data structure for fallback state
 * Used when API data is not yet available during loading
 */
function createEmptyAnalyticsData(): AnalyticsData {
  return {
    performanceChart: {
      points: [],
      startDate: "",
      endDate: "",
    },
    drawdownChart: {
      points: [],
      maxDrawdown: 0,
      maxDrawdownDate: "",
    },
    keyMetrics: {
      timeWeightedReturn: createEmptyMetric("Time-Weighted Return"),
      maxDrawdown: createEmptyMetric("Max Drawdown"),
      sharpe: createEmptyMetric("Sharpe Ratio"),
      winRate: createEmptyMetric("Win Rate"),
      volatility: createEmptyMetric("Volatility"),
    },
    monthlyPnL: [],
  };
}

/**
 * Analytics View Container Props
 */
interface AnalyticsViewContainerProps {
  userId: string;
}

/**
 * Time period definitions
 */
export const AnalyticsViewContainer = ({
  userId,
}: AnalyticsViewContainerProps) => {
  // Find default period (1Y)
  const defaultPeriod: AnalyticsTimePeriod = DEFAULT_ANALYTICS_PERIOD;

  // State management
  const [selectedPeriod, setSelectedPeriod] =
    useState<AnalyticsTimePeriod>(defaultPeriod);
  const [activeChartTab, setActiveChartTab] = useState<
    "performance" | "drawdown"
  >("performance");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Data fetching with period change detection
  const { data, isLoading, isMonthlyPnLLoading, error, refetch } =
    useAnalyticsData(userId, selectedPeriod);

  // Handlers
  const handlePeriodChange = (period: AnalyticsTimePeriod) => {
    setSelectedPeriod(period);
  };

  const handleChartTabChange = (tab: "performance" | "drawdown") => {
    setActiveChartTab(tab);
  };

  const handleExport = async () => {
    if (!data) {
      setExportError("No data available to export");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const result = await exportAnalyticsToCSV(userId, data, selectedPeriod);
      if (!result.success) {
        setExportError(result.error || "Export failed");
      }
    } catch {
      setExportError("An unexpected error occurred");
    } finally {
      setIsExporting(false);
    }
  };

  // Error state (show error UI only when there's an actual error and no data)
  if (error && !data) {
    return <AnalyticsErrorState error={error} onRetry={refetch} />;
  }

  // Provide fallback empty data structure to ensure components always render
  // Component-level skeletons will be shown via isLoading prop
  const analyticsData: AnalyticsData = data ?? createEmptyAnalyticsData();

  return (
    <AnalyticsView
      data={analyticsData}
      selectedPeriod={selectedPeriod}
      activeChartTab={activeChartTab}
      onPeriodChange={handlePeriodChange}
      onChartTabChange={handleChartTabChange}
      onExport={handleExport}
      isLoading={isLoading}
      isMonthlyPnLLoading={isMonthlyPnLLoading}
      isExporting={isExporting}
      exportError={exportError}
    />
  );
};
