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
