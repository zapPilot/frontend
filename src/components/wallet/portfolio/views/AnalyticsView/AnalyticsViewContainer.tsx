/**
 * Analytics View Container
 *
 * Container component managing state and data fetching for analytics view
 * Follows Container/Presentational pattern
 */

"use client";

import { useState } from "react";

import { useAnalyticsData } from "@/hooks/queries/useAnalyticsData";
import type { AnalyticsData, AnalyticsTimePeriod } from "@/types/analytics";

import { AnalyticsView } from "./AnalyticsView";
import { AnalyticsErrorState } from "./components/AnalyticsErrorState";
import { DEFAULT_ANALYTICS_PERIOD } from "./constants";

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

  // Data fetching with period change detection
  const { data, isLoading, error, refetch } = useAnalyticsData(
    userId,
    selectedPeriod
  );

  // Handlers
  const handlePeriodChange = (period: AnalyticsTimePeriod) => {
    setSelectedPeriod(period);
  };

  const handleChartTabChange = (tab: "performance" | "drawdown") => {
    setActiveChartTab(tab);
  };

  // Error state (show error UI only when there's an actual error and no data)
  if (error && !data) {
    return <AnalyticsErrorState error={error} onRetry={refetch} />;
  }

  // Provide fallback empty data structure to ensure components always render
  // Component-level skeletons will be shown via isLoading prop
  const analyticsData: AnalyticsData =
    data ??
    ({
      performanceChart: { points: [], startDate: "", endDate: "" },
      drawdownChart: { points: [], maxDrawdown: 0, maxDrawdownDate: "" },
      keyMetrics: {
        timeWeightedReturn: { value: 0, label: "Time-Weighted Return" },
        maxDrawdown: { value: 0, label: "Max Drawdown" },
        sharpe: { value: 0, label: "Sharpe Ratio" },
        winRate: { value: 0, label: "Win Rate" },
        volatility: { value: 0, label: "Volatility" },
      },
      monthlyPnL: [],
    } as unknown as AnalyticsData);

  return (
    <AnalyticsView
      data={analyticsData}
      selectedPeriod={selectedPeriod}
      activeChartTab={activeChartTab}
      onPeriodChange={handlePeriodChange}
      onChartTabChange={handleChartTabChange}
      isLoading={isLoading}
    />
  );
};
