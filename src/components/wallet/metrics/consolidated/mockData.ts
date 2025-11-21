/**
 * Mock data generators for consolidated metrics
 */

import type {
  ConsolidatedMetricsData,
  ROIMetricData,
  PnLMetricData,
  YieldMetricData,
  ProtocolYieldBreakdown,
} from "./types";

/**
 * Generate mock ROI data
 */
export function generateMockROIData(): ROIMetricData {
  return {
    value: 15.42,
    period: "30d",
    windows: {
      "7d": { value: 12.34, dataPoints: 7 },
      "30d": { value: 15.42, dataPoints: 30 },
      "90d": { value: 14.87, dataPoints: 90 },
      "365d": { value: 14.18, dataPoints: 365 },
    },
    confidence: "high",
    isEstimated: true,
  };
}

/**
 * Generate mock PnL data
 */
export function generateMockPnLData(): PnLMetricData {
  return {
    value: 3250.5,
    currency: "USD",
    trend: "up",
    changePercentage: 12.5,
    isEstimated: true,
  };
}

/**
 * Generate mock protocol breakdown for yield
 */
function generateMockProtocolBreakdown(): ProtocolYieldBreakdown[] {
  return [
    {
      protocol: "Aave",
      contribution: 18.25,
      percentage: 43.3,
      color: "#B6509E",
    },
    {
      protocol: "Compound",
      contribution: 12.8,
      percentage: 30.4,
      color: "#00D395",
    },
    {
      protocol: "Curve",
      contribution: 7.6,
      percentage: 18.0,
      color: "#4F81C7",
    },
    {
      protocol: "Uniswap V3",
      contribution: 3.5,
      percentage: 8.3,
      color: "#FF007A",
    },
  ];
}

/**
 * Generate mock Yield data
 */
export function generateMockYieldData(): YieldMetricData {
  return {
    avgDailyYield: 42.15,
    daysWithData: 15,
    outliersRemoved: 2,
    badge: "improving",
    confidence: "medium",
    protocolBreakdown: generateMockProtocolBreakdown(),
  };
}

/**
 * Generate complete mock consolidated metrics data
 */
export function generateMockConsolidatedData(): ConsolidatedMetricsData {
  return {
    roi: generateMockROIData(),
    pnl: generateMockPnLData(),
    yield: generateMockYieldData(),
    loading: {
      roi: false,
      pnl: false,
      yield: false,
    },
  };
}

/**
 * Generate mock data with custom values
 */
export function generateCustomMockData(overrides?: {
  roiValue?: number;
  pnlValue?: number;
  yieldValue?: number;
  trend?: "up" | "down" | "neutral";
}): ConsolidatedMetricsData {
  const baseData = generateMockConsolidatedData();

  if (overrides?.roiValue !== undefined) {
    baseData.roi.value = overrides.roiValue;
  }

  if (overrides?.pnlValue !== undefined) {
    baseData.pnl.value = overrides.pnlValue;
  }

  if (overrides?.yieldValue !== undefined) {
    baseData.yield.avgDailyYield = overrides.yieldValue;
  }

  if (overrides?.trend) {
    baseData.pnl.trend = overrides.trend;
  }

  return baseData;
}

/**
 * Generate loading state mock data
 */
export function generateLoadingMockData(): ConsolidatedMetricsData {
  return {
    ...generateMockConsolidatedData(),
    loading: {
      roi: true,
      pnl: true,
      yield: true,
    },
  };
}

/**
 * Generate partial loading state (progressive loading simulation)
 */
export function generatePartialLoadingMockData(): ConsolidatedMetricsData {
  return {
    ...generateMockConsolidatedData(),
    loading: {
      roi: false,
      pnl: false,
      yield: true, // Only yield is still loading
    },
  };
}

/**
 * Mock data variations for different portfolio states
 */
export const MOCK_DATA_PRESETS = {
  // Strong performing portfolio
  bullish: generateCustomMockData({
    roiValue: 28.5,
    pnlValue: 8500.0,
    yieldValue: 95.3,
    trend: "up",
  }),

  // Underperforming portfolio
  bearish: generateCustomMockData({
    roiValue: -5.2,
    pnlValue: -1200.0,
    yieldValue: 12.5,
    trend: "down",
  }),

  // Stable portfolio
  neutral: generateCustomMockData({
    roiValue: 2.1,
    pnlValue: 150.0,
    yieldValue: 25.0,
    trend: "neutral",
  }),

  // Default balanced portfolio
  default: generateMockConsolidatedData(),

  // Loading state
  loading: generateLoadingMockData(),

  // Partial loading state
  partialLoading: generatePartialLoadingMockData(),
} as const;
