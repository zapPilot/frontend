/**
 * Analytics View Container
 *
 * Container component managing state and data fetching for analytics view
 * Follows Container/Presentational pattern
 */

"use client";

import { useState } from "react";

import { useAnalyticsData } from "@/hooks/queries/useAnalyticsData";
import type { AnalyticsTimePeriod } from "@/types/analytics";

import { AnalyticsView } from "./AnalyticsView";
import { AnalyticsErrorState } from "./components/AnalyticsErrorState";
import { AnalyticsLoadingSkeleton } from "./components/AnalyticsLoadingSkeleton";

/**
 * Analytics View Container Props
 */
export interface AnalyticsViewContainerProps {
  userId: string;
}

/**
 * Time period definitions
 */
const TIME_PERIODS: AnalyticsTimePeriod[] = [
  { key: "1M", days: 30, label: "1M" },
  { key: "3M", days: 90, label: "3M" },
  { key: "6M", days: 180, label: "6M" },
  { key: "1Y", days: 365, label: "1Y" },
  { key: "ALL", days: 730, label: "ALL" },
];

/**
 * Analytics View Container
 *
 * Manages:
 * - Time period state
 * - Chart tab state
 * - Data fetching via useAnalyticsData
 * - Loading/error states
 *
 * Delegates rendering to AnalyticsView presentation component.
 */
export const AnalyticsViewContainer = ({
  userId,
}: AnalyticsViewContainerProps) => {
  // Find default period (1Y)
  const defaultPeriod: AnalyticsTimePeriod = TIME_PERIODS.find(
    period => period.key === "1Y"
  ) ??
    TIME_PERIODS[0] ?? { key: "1M", days: 30, label: "1M" };

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

  // Loading state
  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  // Error state
  if (error || !data) {
    return <AnalyticsErrorState error={error} onRetry={refetch} />;
  }

  // Render presentation component
  return (
    <AnalyticsView
      data={data}
      selectedPeriod={selectedPeriod}
      activeChartTab={activeChartTab}
      onPeriodChange={handlePeriodChange}
      onChartTabChange={handleChartTabChange}
    />
  );
};
