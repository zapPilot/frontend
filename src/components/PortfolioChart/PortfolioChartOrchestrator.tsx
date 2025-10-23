"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Calendar,
  PieChart,
  Target,
  TrendingUp,
} from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { formatPercentage } from "../../lib/formatters";
import { CHART_PERIODS } from "../../lib/portfolio-analytics";
import { logger } from "../../utils/logger";
import { GlassCard } from "../ui";
import type { PortfolioChartProps } from "./types";
import { CHART_CONTENT_ID } from "./utils";
import { PortfolioChartSkeleton } from "./PortfolioChartSkeleton";
import {
  PerformanceChart,
  AllocationChart,
  DrawdownChart,
  SharpeChart,
  VolatilityChart,
  UnderwaterChart,
} from "./charts";
import { useChartData } from "./hooks";

/**
 * Chart type selector configuration
 */
const CHART_TYPES = [
  {
    key: "performance" as const,
    label: "Portfolio Value",
    icon: TrendingUp,
  },
  { key: "allocation" as const, label: "Allocation", icon: PieChart },
  { key: "drawdown" as const, label: "Drawdown", icon: Activity },
  { key: "sharpe" as const, label: "Sharpe Ratio", icon: Target },
  { key: "volatility" as const, label: "Volatility", icon: BarChart3 },
  { key: "underwater" as const, label: "Underwater", icon: Activity },
] as const;

type ChartType = (typeof CHART_TYPES)[number]["key"];

/**
 * Main orchestrator for portfolio chart visualization.
 * Manages chart type selection, period selection, and conditional rendering.
 *
 * This component serves as the entry point for the PortfolioChart module,
 * coordinating between data fetching (via useChartData) and chart rendering.
 *
 * @param userId - User identifier for fetching portfolio data
 * @param portfolioData - Optional override for portfolio data (testing)
 * @param allocationData - Optional override for allocation data (testing)
 * @param drawdownData - Optional override for drawdown data (testing)
 * @param sharpeData - Optional override for Sharpe ratio data (testing)
 * @param volatilityData - Optional override for volatility data (testing)
 * @param underwaterData - Optional override for underwater data (testing)
 * @param activeTab - Optional externally controlled active chart type
 * @param isLoading - Optional external loading state
 * @param error - Optional external error state
 */
const PortfolioChartComponent = ({
  userId,
  portfolioData: portfolioDataOverride,
  allocationData: allocationDataOverride,
  drawdownData: drawdownDataOverride,
  sharpeData: sharpeDataOverride,
  volatilityData: volatilityDataOverride,
  underwaterData: underwaterDataOverride,
  activeTab,
  isLoading: externalLoading,
  error: externalError,
}: PortfolioChartProps = {}) => {
  // State management
  const [selectedPeriod, setSelectedPeriod] = useState("3M");
  const [selectedChart, setSelectedChart] = useState<ChartType>(
    activeTab ?? "performance"
  );

  const previousActiveTabRef = useRef<string | undefined>(undefined);

  // Sync with external activeTab prop if provided
  useEffect(() => {
    if (activeTab && activeTab !== previousActiveTabRef.current) {
      setSelectedChart(activeTab);
    }
    previousActiveTabRef.current = activeTab;
  }, [activeTab]);

  // Get user info from context
  const { userInfo } = useUser();

  // Resolve which userId to use: provided userId or fallback to context
  const resolvedUserId = userId || userInfo?.userId;

  // Fetch and process all chart data
  const chartData = useChartData(
    resolvedUserId,
    selectedPeriod,
    {
      portfolioData: portfolioDataOverride,
      allocationData: allocationDataOverride,
      drawdownData: drawdownDataOverride,
      sharpeData: sharpeDataOverride,
      volatilityData: volatilityDataOverride,
      underwaterData: underwaterDataOverride,
    },
    externalLoading,
    externalError
  );

  // Debug logging in test mode
  if (process.env.NODE_ENV === "test") {
    logger.debug(
      "PortfolioChart state",
      {
        activeTab,
        selectedChart,
        selectedPeriod,
        isLoading: chartData.isLoading,
        error: chartData.error,
        dataPoints: chartData.portfolioHistory.length,
      },
      "PortfolioChart"
    );
  }

  // Error state
  if (chartData.error) {
    return (
      <GlassCard className="p-6" role="alert" ariaLive="assertive">
        <div className="text-lg font-semibold text-red-400">
          Error loading portfolio analytics
        </div>
        <p className="text-sm text-gray-300 mt-2">{chartData.error}</p>
      </GlassCard>
    );
  }

  // Loading state
  if (chartData.isLoading) {
    return <PortfolioChartSkeleton />;
  }

  // Empty state
  if (chartData.portfolioHistory.length === 0) {
    return (
      <GlassCard
        className="p-6 text-center space-y-2"
        role="status"
        ariaLive="polite"
      >
        <div className="text-lg font-semibold text-gray-200">
          No data available for this portfolio
        </div>
        <p className="text-sm text-gray-400">
          Connect a wallet or import data to see performance analytics.
        </p>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <GlassCard className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Calendar
                className="w-5 h-5 mr-2 text-purple-400"
                aria-hidden="true"
                role="presentation"
              />
              Portfolio Value
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div
                className={`font-medium ${chartData.isPositive ? "text-green-400" : "text-red-400"}`}
              >
                {formatPercentage(chartData.totalReturn, true, 2)}
                <span className="text-gray-400 ml-1">({selectedPeriod})</span>
              </div>
              <div className="text-gray-400">
                ${(chartData.currentValue / 1000).toFixed(1)}k Current Value
              </div>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div
            className="flex flex-wrap gap-2 mb-4 lg:mb-0"
            role="tablist"
            aria-label="Select chart type"
          >
            {CHART_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedChart(key)}
                className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
                  selectedChart === key
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    : "glass-morphism text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                role="tab"
                aria-selected={selectedChart === key}
                tabIndex={selectedChart === key ? 0 : -1}
                aria-controls={CHART_CONTENT_ID}
              >
                <Icon
                  className="w-4 h-4"
                  aria-hidden="true"
                  role="presentation"
                />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex space-x-2 mb-6">
          {CHART_PERIODS.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                selectedPeriod === period.value
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Chart Content */}
        <div className="relative" id={CHART_CONTENT_ID}>
          {selectedChart === "performance" && (
            <PerformanceChart
              data={chartData.stackedPortfolioData}
              selectedPeriod={selectedPeriod}
            />
          )}
          {selectedChart === "allocation" && (
            <AllocationChart data={chartData.allocationHistory} />
          )}
          {selectedChart === "drawdown" && (
            <DrawdownChart
              data={chartData.drawdownData}
              referenceData={chartData.drawdownReferenceData}
            />
          )}
          {selectedChart === "sharpe" && (
            <SharpeChart data={chartData.sharpeData} />
          )}
          {selectedChart === "volatility" && (
            <VolatilityChart data={chartData.volatilityData} />
          )}
          {selectedChart === "underwater" && (
            <UnderwaterChart data={chartData.underwaterData} />
          )}
        </div>

        {/* Chart Summary Statistics */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedChart === "sharpe" && chartData.sharpeData.length > 0 && (
            <>
              <div className="text-center">
                <div className="text-sm text-gray-400">Current Sharpe</div>
                <div className="text-lg font-bold text-green-400">
                  {chartData.sharpeData[
                    chartData.sharpeData.length - 1
                  ]?.sharpe.toFixed(2) || "0.00"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Best Sharpe</div>
                <div className="text-lg font-bold text-green-400">
                  {Math.max(...chartData.sharpeData.map(d => d.sharpe)).toFixed(
                    2
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Avg Sharpe</div>
                <div className="text-lg font-bold text-gray-300">
                  {(
                    chartData.sharpeData.reduce((sum, d) => sum + d.sharpe, 0) /
                    chartData.sharpeData.length
                  ).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Above 1.0</div>
                <div className="text-lg font-bold text-blue-400">
                  {Math.round(
                    (chartData.sharpeData.filter(d => d.sharpe > 1.0).length /
                      chartData.sharpeData.length) *
                      100
                  )}
                  %
                </div>
              </div>
            </>
          )}

          {selectedChart === "volatility" &&
            chartData.volatilityData.length > 0 && (
              <>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Current Vol</div>
                  <div className="text-lg font-bold text-amber-400">
                    {chartData.volatilityData[
                      chartData.volatilityData.length - 1
                    ]?.volatility.toFixed(1) || "0.0"}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Highest Vol</div>
                  <div className="text-lg font-bold text-red-400">
                    {Math.max(
                      ...chartData.volatilityData.map(d => d.volatility)
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Lowest Vol</div>
                  <div className="text-lg font-bold text-green-400">
                    {Math.min(
                      ...chartData.volatilityData.map(d => d.volatility)
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Avg Vol</div>
                  <div className="text-lg font-bold text-gray-300">
                    {(
                      chartData.volatilityData.reduce(
                        (sum, d) => sum + d.volatility,
                        0
                      ) / chartData.volatilityData.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </>
            )}

          {selectedChart === "underwater" &&
            chartData.underwaterData.length > 0 && (
              <>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Max Drawdown</div>
                  <div className="text-lg font-bold text-red-400">
                    {Math.min(
                      ...chartData.underwaterData.map(d => d.underwater)
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Recovery Times</div>
                  <div className="text-lg font-bold text-green-400">
                    {chartData.underwaterData.filter(d => d.recovery).length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Time Underwater</div>
                  <div className="text-lg font-bold text-blue-400">
                    {Math.round(
                      (chartData.underwaterData.filter(d => d.underwater < -0.5)
                        .length /
                        chartData.underwaterData.length) *
                        100
                    )}
                    %
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Current Status</div>
                  <div className="text-lg font-bold text-gray-300">
                    {(chartData.underwaterData[
                      chartData.underwaterData.length - 1
                    ]?.underwater ?? 0) < -0.5
                      ? "Underwater"
                      : "Above Water"}
                  </div>
                </div>
              </>
            )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

/**
 * Memoized PortfolioChart component for optimal performance.
 * Prevents unnecessary re-renders when parent components update.
 */
export const PortfolioChart = memo(PortfolioChartComponent);

PortfolioChart.displayName = "PortfolioChart";

export default PortfolioChart;
