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
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useAllocationTimeseries } from "../../hooks/useAllocationTimeseries";
import { useAnalyticsData } from "../../hooks/useAnalyticsData";
import { usePortfolioTrends } from "../../hooks/usePortfolioTrends";
import {
  calculateDrawdownData,
  CHART_PERIODS,
} from "../../lib/portfolio-analytics";
import { formatPercentage } from "../../lib/formatters";
import {
  getEnhancedDrawdown,
  getRollingSharpe,
  getRollingVolatility,
  getUnderwaterRecovery,
} from "../../services/analyticsService";
import {
  AssetAllocationPoint,
  PortfolioDataPoint,
} from "../../types/portfolio";
import { logger } from "../../utils/logger";
import { GlassCard } from "../ui";
import type {
  AllocationTimeseriesInputPoint,
  PortfolioChartProps,
} from "./types";
import {
  buildStackedPortfolioData,
  buildAllocationHistory,
  CHART_CONTENT_ID,
} from "./utils";
import { PortfolioChartSkeleton } from "./PortfolioChartSkeleton";
import {
  PerformanceChart,
  AllocationChart,
  DrawdownChart,
  SharpeChart,
  VolatilityChart,
  UnderwaterChart,
} from "./charts";

const PortfolioChartComponent = ({
  userId,
  portfolioData: portfolioDataOverride,
  allocationData: allocationDataOverride,
  drawdownData: drawdownDataOverride,
  sharpeData: sharpeDataOverride,
  volatilityData: volatilityDataOverride,
  underwaterData: underwaterDataOverride,
  activeTab,
  isLoading,
  error,
}: PortfolioChartProps = {}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("3M");
  const [selectedChart, setSelectedChart] = useState<
    | "performance"
    | "allocation"
    | "drawdown"
    | "sharpe"
    | "volatility"
    | "underwater"
  >(activeTab ?? "performance");

  const previousActiveTabRef = useRef<string | undefined>(undefined);

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

  const selectedDays =
    CHART_PERIODS.find(p => p.value === selectedPeriod)?.days || 90;

  // Fetch real portfolio trends data
  const { data: apiPortfolioHistory, loading: portfolioLoading } =
    usePortfolioTrends({
      userId: resolvedUserId,
      days: selectedDays,
      enabled: !!resolvedUserId,
    });

  // Fetch Phase 2 analytics data
  const { data: rollingSharpeData, loading: sharpeLoading } = useAnalyticsData(
    getRollingSharpe,
    {
      userId: resolvedUserId,
      days: selectedDays,
      enabled: !!resolvedUserId,
    }
  );

  const { data: rollingVolatilityData, loading: volatilityLoading } =
    useAnalyticsData(getRollingVolatility, {
      userId: resolvedUserId,
      days: selectedDays,
      enabled: !!resolvedUserId,
    });

  const { data: enhancedDrawdownData, loading: drawdownLoading } =
    useAnalyticsData(getEnhancedDrawdown, {
      userId: resolvedUserId,
      days: selectedDays,
      enabled: !!resolvedUserId,
    });

  const { data: underwaterRecoveryData, loading: underwaterLoading } =
    useAnalyticsData(getUnderwaterRecovery, {
      userId: resolvedUserId,
      days: selectedDays,
      enabled: !!resolvedUserId,
    });

  const { data: allocationTimeseriesData, loading: allocationLoading } =
    useAllocationTimeseries({
      userId: resolvedUserId,
      days: selectedDays,
      enabled: !!resolvedUserId,
    });

  const hasPreloadedData =
    (portfolioDataOverride?.length ?? 0) > 0 ||
    (allocationDataOverride?.length ?? 0) > 0 ||
    (drawdownDataOverride?.length ?? 0) > 0 ||
    (sharpeDataOverride?.length ?? 0) > 0 ||
    (volatilityDataOverride?.length ?? 0) > 0 ||
    (underwaterDataOverride?.length ?? 0) > 0;

  const isExternalLoading = Boolean(isLoading);
  const normalizedError =
    error == null
      ? null
      : typeof error === "string"
        ? error
        : (error.message ?? "Failed to load portfolio analytics");

  // Combine all loading states
  const isLoadingData =
    !normalizedError &&
    (isExternalLoading ||
      (!hasPreloadedData &&
        (portfolioLoading ||
          sharpeLoading ||
          volatilityLoading ||
          drawdownLoading ||
          underwaterLoading ||
          allocationLoading)));

  if (process.env.NODE_ENV === "test") {
    logger.debug(
      "PortfolioChart state",
      {
        hasPreloadedData,
        isExternalLoading,
        normalizedError,
        isLoadingData,
        overrides: [
          portfolioDataOverride?.length ?? 0,
          allocationDataOverride?.length ?? 0,
          drawdownDataOverride?.length ?? 0,
          sharpeDataOverride?.length ?? 0,
          volatilityDataOverride?.length ?? 0,
          underwaterDataOverride?.length ?? 0,
        ],
        activeTab,
        selectedChart,
      },
      "PortfolioChart"
    );
  }

  // Portfolio history with fallback logic
  const portfolioHistory: PortfolioDataPoint[] = useMemo(() => {
    if (portfolioDataOverride?.length) {
      return portfolioDataOverride;
    }

    return apiPortfolioHistory;
  }, [apiPortfolioHistory, portfolioDataOverride]);

  // Reference data for drawdown peak calculations
  const drawdownReferenceData = useMemo(
    () =>
      portfolioHistory.map(point => ({
        date: point.date,
        portfolio_value: Number(point.value ?? 0),
      })),
    [portfolioHistory]
  );

  // Allocation history for AllocationChart component
  const allocationHistory: AssetAllocationPoint[] = useMemo(() => {
    if (allocationDataOverride?.length) {
      const firstOverride = allocationDataOverride[0] as
        | AllocationTimeseriesInputPoint
        | AssetAllocationPoint;

      const looksLikeAggregated =
        typeof (firstOverride as AssetAllocationPoint)?.btc === "number" ||
        typeof (firstOverride as AssetAllocationPoint)?.eth === "number" ||
        typeof (firstOverride as AssetAllocationPoint)?.stablecoin ===
          "number" ||
        typeof (firstOverride as AssetAllocationPoint)?.altcoin === "number";

      const looksLikeTimeseries =
        "category" in (firstOverride as AllocationTimeseriesInputPoint) ||
        "protocol" in (firstOverride as AllocationTimeseriesInputPoint) ||
        "percentage" in (firstOverride as AllocationTimeseriesInputPoint) ||
        "percentage_of_portfolio" in
          (firstOverride as AllocationTimeseriesInputPoint) ||
        "allocation_percentage" in
          (firstOverride as AllocationTimeseriesInputPoint) ||
        "category_value" in (firstOverride as AllocationTimeseriesInputPoint) ||
        "category_value_usd" in
          (firstOverride as AllocationTimeseriesInputPoint);

      if (looksLikeAggregated && !looksLikeTimeseries) {
        return (allocationDataOverride as AssetAllocationPoint[]).map(
          point => ({
            date: point.date,
            btc: Number(point.btc ?? 0),
            eth: Number(point.eth ?? 0),
            stablecoin: Number(point.stablecoin ?? 0),
            altcoin: Number(point.altcoin ?? 0),
          })
        );
      }

      return buildAllocationHistory(
        allocationDataOverride as AllocationTimeseriesInputPoint[]
      );
    }
    return buildAllocationHistory(
      allocationTimeseriesData?.allocation_data ?? []
    );
  }, [allocationDataOverride, allocationTimeseriesData]);

  const currentValue =
    portfolioHistory[portfolioHistory.length - 1]?.value || 0;
  const firstValue = portfolioHistory[0]?.value || 0;
  const totalReturn = ((currentValue - firstValue) / firstValue) * 100;
  const isPositive = totalReturn >= 0;

  // Stacked portfolio data with DeFi and Wallet breakdown
  const stackedPortfolioData = useMemo(
    () => buildStackedPortfolioData(portfolioHistory),
    [portfolioHistory]
  );

  // Drawdown data for DrawdownChart component
  const drawdownData = useMemo(() => {
    if (drawdownDataOverride?.length) {
      return drawdownDataOverride.map(point => ({
        date: point.date,
        drawdown: Number(point.drawdown ?? point.drawdown_pct ?? 0),
      }));
    }

    if (
      !enhancedDrawdownData?.drawdown_data ||
      enhancedDrawdownData.drawdown_data.length === 0
    ) {
      return calculateDrawdownData(portfolioHistory);
    }

    return enhancedDrawdownData.drawdown_data.map(point => ({
      date: point.date,
      drawdown: Number(point.drawdown_pct ?? 0),
    }));
  }, [drawdownDataOverride, enhancedDrawdownData, portfolioHistory]);

  // Real data for Rolling Sharpe Ratio
  const sharpeData = useMemo(() => {
    if (sharpeDataOverride?.length) {
      return sharpeDataOverride
        .filter(point => point.rolling_sharpe_ratio != null)
        .map(point => ({
          date: point.date,
          sharpe: Number(point.rolling_sharpe_ratio ?? 0),
        }));
    }

    if (
      !rollingSharpeData?.rolling_sharpe_data ||
      rollingSharpeData.rolling_sharpe_data.length === 0
    ) {
      return [];
    }

    return rollingSharpeData.rolling_sharpe_data
      .filter(point => point.rolling_sharpe_ratio != null)
      .map(point => ({
        date: point.date,
        sharpe: Number(point.rolling_sharpe_ratio ?? 0),
      }));
  }, [rollingSharpeData, sharpeDataOverride]);

  // Real data for Rolling Volatility
  const volatilityData = useMemo(() => {
    if (volatilityDataOverride?.length) {
      return volatilityDataOverride
        .filter(
          point =>
            point.annualized_volatility_pct != null ||
            point.rolling_volatility_daily_pct != null
        )
        .map(point => ({
          date: point.date,
          volatility: Number(
            point.annualized_volatility_pct ??
              point.rolling_volatility_daily_pct ??
              0
          ),
        }));
    }

    if (
      !rollingVolatilityData?.rolling_volatility_data ||
      rollingVolatilityData.rolling_volatility_data.length === 0
    ) {
      return [];
    }

    return rollingVolatilityData.rolling_volatility_data
      .filter(
        point =>
          point.annualized_volatility_pct != null ||
          point.rolling_volatility_daily_pct != null
      )
      .map(point => ({
        date: point.date,
        volatility: Number(
          point.annualized_volatility_pct ??
            point.rolling_volatility_daily_pct ??
            0
        ),
      }));
  }, [rollingVolatilityData, volatilityDataOverride]);

  // Real data for Underwater Chart (enhanced drawdown)
  const underwaterData = useMemo(() => {
    if (underwaterDataOverride?.length) {
      return underwaterDataOverride.map(point => ({
        date: point.date,
        underwater: Number(point.underwater_pct ?? 0),
        ...(point.recovery_point !== undefined && {
          recovery: point.recovery_point,
        }),
      }));
    }

    if (
      !underwaterRecoveryData?.underwater_data ||
      underwaterRecoveryData.underwater_data.length === 0
    ) {
      return [];
    }

    return underwaterRecoveryData.underwater_data.map(point => ({
      date: point.date,
      underwater: Number(point.underwater_pct ?? 0),
      ...(point.recovery_point !== undefined && {
        recovery: point.recovery_point,
      }),
    }));
  }, [underwaterDataOverride, underwaterRecoveryData]);

  if (normalizedError) {
    return (
      <GlassCard className="p-6" role="alert" ariaLive="assertive">
        <div className="text-lg font-semibold text-red-400">
          Error loading portfolio analytics
        </div>
        <p className="text-sm text-gray-300 mt-2">{normalizedError}</p>
      </GlassCard>
    );
  }

  if (isLoadingData) {
    return <PortfolioChartSkeleton />;
  }

  if (portfolioHistory.length === 0) {
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
                className={`font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}
              >
                {formatPercentage(totalReturn, true, 2)}
                <span className="text-gray-400 ml-1">({selectedPeriod})</span>
              </div>
              <div className="text-gray-400">
                ${(currentValue / 1000).toFixed(1)}k Current Value
              </div>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div
            className="flex flex-wrap gap-2 mb-4 lg:mb-0"
            role="tablist"
            aria-label="Select chart type"
          >
            {[
              {
                key: "performance",
                label: "Portfolio Value",
                icon: TrendingUp,
              },
              { key: "allocation", label: "Allocation", icon: PieChart },
              { key: "drawdown", label: "Drawdown", icon: Activity },
              { key: "sharpe", label: "Sharpe Ratio", icon: Target },
              { key: "volatility", label: "Volatility", icon: BarChart3 },
              { key: "underwater", label: "Underwater", icon: Activity },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setSelectedChart(
                    key as
                      | "performance"
                      | "allocation"
                      | "drawdown"
                      | "sharpe"
                      | "volatility"
                      | "underwater"
                  )
                }
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
              data={stackedPortfolioData}
              selectedPeriod={selectedPeriod}
            />
          )}
          {selectedChart === "allocation" && (
            <AllocationChart data={allocationHistory} />
          )}
          {selectedChart === "drawdown" && (
            <DrawdownChart
              data={drawdownData}
              referenceData={drawdownReferenceData}
            />
          )}
          {selectedChart === "sharpe" && <SharpeChart data={sharpeData} />}
          {selectedChart === "volatility" && (
            <VolatilityChart data={volatilityData} />
          )}
          {selectedChart === "underwater" && (
            <UnderwaterChart data={underwaterData} />
          )}
        </div>

        {/* Chart Summary */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedChart === "sharpe" && (
            <>
              <div className="text-center">
                <div className="text-sm text-gray-400">Current Sharpe</div>
                <div className="text-lg font-bold text-green-400">
                  {sharpeData[sharpeData.length - 1]?.sharpe.toFixed(2) ||
                    "0.00"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Best Sharpe</div>
                <div className="text-lg font-bold text-green-400">
                  {Math.max(...sharpeData.map(d => d.sharpe)).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Avg Sharpe</div>
                <div className="text-lg font-bold text-gray-300">
                  {(
                    sharpeData.reduce((sum, d) => sum + d.sharpe, 0) /
                    sharpeData.length
                  ).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Above 1.0</div>
                <div className="text-lg font-bold text-blue-400">
                  {Math.round(
                    (sharpeData.filter(d => d.sharpe > 1.0).length /
                      sharpeData.length) *
                      100
                  )}
                  %
                </div>
              </div>
            </>
          )}

          {selectedChart === "volatility" && (
            <>
              <div className="text-center">
                <div className="text-sm text-gray-400">Current Vol</div>
                <div className="text-lg font-bold text-amber-400">
                  {volatilityData[
                    volatilityData.length - 1
                  ]?.volatility.toFixed(1) || "0.0"}
                  %
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Highest Vol</div>
                <div className="text-lg font-bold text-red-400">
                  {Math.max(...volatilityData.map(d => d.volatility)).toFixed(
                    1
                  )}
                  %
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Lowest Vol</div>
                <div className="text-lg font-bold text-green-400">
                  {Math.min(...volatilityData.map(d => d.volatility)).toFixed(
                    1
                  )}
                  %
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Avg Vol</div>
                <div className="text-lg font-bold text-gray-300">
                  {(
                    volatilityData.reduce((sum, d) => sum + d.volatility, 0) /
                    volatilityData.length
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </>
          )}

          {selectedChart === "underwater" && (
            <>
              <div className="text-center">
                <div className="text-sm text-gray-400">Max Drawdown</div>
                <div className="text-lg font-bold text-red-400">
                  {Math.min(...underwaterData.map(d => d.underwater)).toFixed(
                    1
                  )}
                  %
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Recovery Times</div>
                <div className="text-lg font-bold text-green-400">
                  {underwaterData.filter(d => d.recovery).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Time Underwater</div>
                <div className="text-lg font-bold text-blue-400">
                  {Math.round(
                    (underwaterData.filter(d => d.underwater < -0.5).length /
                      underwaterData.length) *
                      100
                  )}
                  %
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Current Status</div>
                <div className="text-lg font-bold text-gray-300">
                  {(underwaterData[underwaterData.length - 1]?.underwater ??
                    0) < -0.5
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

export const PortfolioChart = memo(PortfolioChartComponent);

export default PortfolioChart;
