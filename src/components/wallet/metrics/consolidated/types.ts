/**
 * Shared types for consolidated metrics components
 */

import type { LandingPageResponse, YieldReturnsSummaryResponse } from "@/services/analyticsService";

/**
 * Metric types that can be displayed
 */
export type MetricType = "roi" | "pnl" | "yield";

/**
 * Common props for all consolidated metric components
 */
export interface ConsolidatedMetricsProps {
  portfolioROI?: LandingPageResponse["portfolio_roi"] | null;
  yieldSummaryData?: YieldReturnsSummaryResponse | null;
  isLandingLoading?: boolean;
  isYieldLoading?: boolean;
  portfolioChangePercentage: number;
  isConnected: boolean;
  errorMessage?: string | null;
}

/**
 * ROI metric data structure
 */
export interface ROIMetricData {
  value: number;
  period: string;
  windows: Record<string, { value: number; dataPoints: number }>;
  confidence: "high" | "medium" | "low";
  isEstimated: boolean;
}

/**
 * PnL metric data structure
 */
export interface PnLMetricData {
  value: number;
  currency: "USD";
  trend: "up" | "down" | "neutral";
  changePercentage: number;
  isEstimated: boolean;
}

/**
 * Yield metric data structure
 */
export interface YieldMetricData {
  avgDailyYield: number;
  daysWithData: number;
  outliersRemoved: number;
  badge: "preliminary" | "improving" | "established" | null;
  confidence: "high" | "medium" | "low";
  protocolBreakdown: ProtocolYieldBreakdown[];
}

/**
 * Protocol breakdown for yield metric
 */
export interface ProtocolYieldBreakdown {
  protocol: string;
  contribution: number;
  percentage: number;
  color: string;
}

/**
 * Unified metrics data structure
 */
export interface ConsolidatedMetricsData {
  roi: ROIMetricData;
  pnl: PnLMetricData;
  yield: YieldMetricData;
  loading: {
    roi: boolean;
    pnl: boolean;
    yield: boolean;
  };
}

/**
 * Tab state for tabbed interface
 */
export interface TabbedMetricsState {
  activeTab: MetricType;
  previousTab: MetricType | null;
}

/**
 * Accordion section state
 */
export interface AccordionSectionState {
  id: MetricType;
  expanded: boolean;
  order: number;
}

/**
 * Layout variants for unified card
 */
export type UnifiedCardLayout = "horizontal" | "vertical" | "grid";

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  ease: string;
  stagger: number;
}
