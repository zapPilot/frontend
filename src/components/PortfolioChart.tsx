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
import { memo, useMemo, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { useAllocationTimeseries } from "../hooks/useAllocationTimeseries";
import { useChartHover } from "../hooks/useChartHover";
import { useEnhancedDrawdown } from "../hooks/useEnhancedDrawdown";
import { usePortfolioTrends } from "../hooks/usePortfolioTrends";
import { useRollingSharpe } from "../hooks/useRollingSharpe";
import { useRollingVolatility } from "../hooks/useRollingVolatility";
import { useUnderwaterRecovery } from "../hooks/useUnderwaterRecovery";
import {
  formatAxisLabel,
  generateAreaPath,
  generateSVGPath,
  generateYAxisLabels,
} from "../lib/chartUtils";
import {
  calculateDrawdownData,
  CHART_PERIODS,
} from "../lib/portfolio-analytics";
import { AssetAllocationPoint, PortfolioDataPoint } from "../types/portfolio";
import { ChartIndicator, ChartTooltip } from "./charts";
import { GlassCard } from "./ui";

interface AllocationTimeseriesInputPoint {
  date: string;
  category?: string;
  protocol?: string;
  percentage?: number;
  percentage_of_portfolio?: number;
  category_value?: number;
  total_value?: number;
}

export function buildAllocationHistory(
  rawPoints: AllocationTimeseriesInputPoint[]
): AssetAllocationPoint[] {
  if (!rawPoints || rawPoints.length === 0) {
    return [];
  }

  const allocationByDate = rawPoints.reduce(
    (acc, point) => {
      const dateKey = point.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          btc: 0,
          eth: 0,
          stablecoin: 0,
          defi: 0,
          altcoin: 0,
        };
      }

      const dayData = acc[dateKey]!;
      const categoryKey = (point.category ?? point.protocol ?? "")
        .toString()
        .toLowerCase();

      const percentageValue = Number(
        point.percentage_of_portfolio ?? point.percentage ?? 0
      );

      const categoryValue = Number(point.category_value ?? 0);
      const totalValue = Number(point.total_value ?? 0);

      const computedShare =
        !Number.isNaN(percentageValue) && percentageValue !== 0
          ? percentageValue
          : totalValue > 0 && !Number.isNaN(categoryValue)
            ? (categoryValue / totalValue) * 100
            : 0;

      if (Number.isNaN(computedShare) || computedShare === 0) {
        return acc;
      }

      if (categoryKey.includes("btc") || categoryKey.includes("bitcoin")) {
        dayData.btc += computedShare;
      } else if (
        categoryKey.includes("eth") ||
        categoryKey.includes("ethereum")
      ) {
        dayData.eth += computedShare;
      } else if (categoryKey.includes("stable")) {
        dayData.stablecoin += computedShare;
      } else if (categoryKey.includes("defi")) {
        dayData.defi += computedShare;
      } else {
        dayData.altcoin += computedShare;
      }

      return acc;
    },
    {} as Record<string, AssetAllocationPoint>
  );

  return Object.values(allocationByDate)
    .map(point => {
      const total =
        point.btc + point.eth + point.stablecoin + point.defi + point.altcoin;

      if (total <= 0) {
        return point;
      }

      return {
        ...point,
        btc: (point.btc / total) * 100,
        eth: (point.eth / total) * 100,
        stablecoin: (point.stablecoin / total) * 100,
        defi: (point.defi / total) * 100,
        altcoin: (point.altcoin / total) * 100,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export interface PortfolioChartProps {
  userId?: string | undefined;
}

const PortfolioChartComponent = ({ userId }: PortfolioChartProps = {}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("3M");
  const [selectedChart, setSelectedChart] = useState<
    | "performance"
    | "allocation"
    | "drawdown"
    | "sharpe"
    | "volatility"
    | "underwater"
  >("performance");

  // Get user info from context
  const { userInfo } = useUser();

  // Resolve which userId to use: provided userId or fallback to context
  const resolvedUserId = userId || userInfo?.userId;

  const selectedDays =
    CHART_PERIODS.find(p => p.value === selectedPeriod)?.days || 90;

  // Fetch real portfolio trends data
  const { data: apiPortfolioHistory } = usePortfolioTrends({
    userId: resolvedUserId,
    days: selectedDays,
    enabled: !!resolvedUserId,
  });

  // Fetch Phase 2 analytics data
  const { data: rollingSharpeData } = useRollingSharpe({
    userId: resolvedUserId,
    days: selectedDays,
    enabled: !!resolvedUserId,
  });

  const { data: rollingVolatilityData } = useRollingVolatility({
    userId: resolvedUserId,
    days: selectedDays,
    enabled: !!resolvedUserId,
  });

  const { data: enhancedDrawdownData } = useEnhancedDrawdown({
    userId: resolvedUserId,
    days: selectedDays,
    enabled: !!resolvedUserId,
  });

  const { data: underwaterRecoveryData } = useUnderwaterRecovery({
    userId: resolvedUserId,
    days: selectedDays,
    enabled: !!resolvedUserId,
  });

  const { data: allocationTimeseriesData } = useAllocationTimeseries({
    userId: resolvedUserId,
    days: selectedDays,
    enabled: !!resolvedUserId,
  });
  // Portfolio history with fallback logic
  const portfolioHistory: PortfolioDataPoint[] = useMemo(() => {
    return apiPortfolioHistory;
  }, [apiPortfolioHistory]);

  const allocationHistory: AssetAllocationPoint[] = useMemo(
    () =>
      buildAllocationHistory(allocationTimeseriesData?.allocation_data ?? []),
    [allocationTimeseriesData]
  );

  const currentValue =
    portfolioHistory[portfolioHistory.length - 1]?.value || 0;
  const firstValue = portfolioHistory[0]?.value || 0;
  const totalReturn = ((currentValue - firstValue) / firstValue) * 100;
  const isPositive = totalReturn >= 0;

  const maxValue = Math.max(...portfolioHistory.map(d => d.value));
  const minValue = Math.min(...portfolioHistory.map(d => d.value));

  // Chart dimensions (match viewBox)
  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 300;
  const CHART_PADDING = 10;

  // Precompute static paths to avoid recomputing on hover
  const portfolioPath = useMemo(
    () =>
      portfolioHistory.length
        ? generateSVGPath(
            portfolioHistory,
            p => p.value,
            CHART_WIDTH,
            CHART_HEIGHT,
            CHART_PADDING
          )
        : "",
    [portfolioHistory]
  );

  const benchmarkPath = useMemo(
    () =>
      portfolioHistory.length
        ? generateSVGPath(
            portfolioHistory,
            p => p.benchmark || 0,
            CHART_WIDTH,
            CHART_HEIGHT,
            CHART_PADDING
          )
        : "",
    [portfolioHistory]
  );

  const portfolioAreaPath = useMemo(
    () =>
      portfolioHistory.length
        ? generateAreaPath(
            portfolioHistory,
            p => p.value,
            CHART_WIDTH,
            CHART_HEIGHT,
            CHART_PADDING
          )
        : "",
    [portfolioHistory]
  );

  const drawdownData = useMemo(() => {
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
  }, [enhancedDrawdownData, portfolioHistory]);

  // Real data for Rolling Sharpe Ratio
  const sharpeData = useMemo(() => {
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
  }, [rollingSharpeData]);

  // Real data for Rolling Volatility
  const volatilityData = useMemo(() => {
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
        ), // Already in percentage terms
      }));
  }, [rollingVolatilityData]);

  // Real data for Underwater Chart (enhanced drawdown)
  const underwaterData = useMemo(() => {
    if (
      !underwaterRecoveryData?.underwater_data ||
      underwaterRecoveryData.underwater_data.length === 0
    ) {
      return [];
    }

    return underwaterRecoveryData.underwater_data.map(point => ({
      date: point.date,
      underwater: Number(point.underwater_pct ?? 0),
      recovery: point.recovery_point,
    }));
  }, [underwaterRecoveryData]);

  // Prepare data for chart-specific calculations
  const drawdownHistory = useMemo(() => {
    if (
      !enhancedDrawdownData?.drawdown_data ||
      enhancedDrawdownData.drawdown_data.length === 0
    ) {
      return drawdownData.map(point => ({
        date: point.date,
        drawdown_pct: point.drawdown,
        portfolio_value: 0,
      }));
    }
    return enhancedDrawdownData.drawdown_data.map(point => ({
      date: point.date,
      drawdown_pct: Number(point.drawdown_pct ?? 0),
      portfolio_value: Number(point.portfolio_value ?? 0),
    }));
  }, [enhancedDrawdownData, drawdownData]);

  const sharpeHistory = useMemo(() => {
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
        rolling_sharpe_ratio: Number(point.rolling_sharpe_ratio ?? 0),
      }));
  }, [rollingSharpeData]);

  const volatilityHistory = useMemo(() => {
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
        annualized_volatility_pct: Number(
          point.annualized_volatility_pct ??
            point.rolling_volatility_daily_pct ??
            0
        ),
      }));
  }, [rollingVolatilityData]);

  const underwaterHistory = useMemo(() => {
    if (
      !underwaterRecoveryData?.underwater_data ||
      underwaterRecoveryData.underwater_data.length === 0
    ) {
      return [];
    }
    return underwaterRecoveryData.underwater_data.map(point => ({
      date: point.date,
      underwater_pct: Number(point.underwater_pct ?? 0),
      recovery_point: point.recovery_point,
    }));
  }, [underwaterRecoveryData]);

  // Performance chart hover
  const performanceHover = useChartHover(portfolioHistory, {
    chartType: "performance",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue,
    maxValue,
    getYValue: point => point.value,
    buildHoverData: (point, x, y) => ({
      chartType: "performance" as const,
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      value: point.value,
      benchmark: point.benchmark || 0,
    }),
  });

  // Allocation chart hover
  const allocationHover = useChartHover(allocationHistory, {
    chartType: "allocation",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue: 0,
    maxValue: 100,
    getYValue: () => 50, // Mid-point for stacked chart
    buildHoverData: (point, x, y) => {
      const total =
        point.btc + point.eth + point.stablecoin + point.defi + point.altcoin;
      return {
        chartType: "allocation" as const,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        btc: total > 0 ? (point.btc / total) * 100 : 0,
        eth: total > 0 ? (point.eth / total) * 100 : 0,
        stablecoin: total > 0 ? (point.stablecoin / total) * 100 : 0,
        defi: total > 0 ? (point.defi / total) * 100 : 0,
        altcoin: total > 0 ? (point.altcoin / total) * 100 : 0,
      };
    },
  });

  // Drawdown chart hover
  const drawdownHover = useChartHover(drawdownHistory, {
    chartType: "drawdown",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue: -20,
    maxValue: 0,
    getYValue: point => point.drawdown_pct,
    buildHoverData: (point, x, y, index) => {
      // Find peak value before this point
      const priorData = drawdownHistory.slice(0, index + 1);
      const peak = Math.max(...priorData.map(p => p.portfolio_value || 0));
      const peakIndex = priorData.findIndex(p => p.portfolio_value === peak);
      const peakDate = priorData[peakIndex]?.date || point.date;

      return {
        chartType: "drawdown" as const,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        drawdown: point.drawdown_pct,
        peakDate: new Date(peakDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        distanceFromPeak: index - peakIndex,
      };
    },
  });

  // Sharpe chart hover (5-level system)
  const sharpeHover = useChartHover(sharpeHistory, {
    chartType: "sharpe",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue: 0,
    maxValue: 2.5,
    getYValue: point => point.rolling_sharpe_ratio,
    buildHoverData: (point, x, y) => {
      const sharpe = point.rolling_sharpe_ratio || 0;
      let interpretation: "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";
      if (sharpe > 2.0) interpretation = "Excellent";
      else if (sharpe > 1.0) interpretation = "Good";
      else if (sharpe > 0.5) interpretation = "Fair";
      else if (sharpe > 0) interpretation = "Poor";
      else interpretation = "Very Poor";

      return {
        chartType: "sharpe" as const,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        sharpe,
        interpretation,
      };
    },
  });

  // Volatility chart hover with risk levels
  const volatilityHover = useChartHover(volatilityHistory, {
    chartType: "volatility",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue: 10,
    maxValue: 40,
    getYValue: point => point.annualized_volatility_pct,
    buildHoverData: (point, x, y) => {
      const vol = point.annualized_volatility_pct || 0;
      let riskLevel: "Low" | "Moderate" | "High" | "Very High";
      if (vol < 15) riskLevel = "Low";
      else if (vol < 25) riskLevel = "Moderate";
      else if (vol < 35) riskLevel = "High";
      else riskLevel = "Very High";

      return {
        chartType: "volatility" as const,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        volatility: vol,
        riskLevel,
      };
    },
  });

  // Underwater chart hover
  const underwaterHover = useChartHover(underwaterHistory, {
    chartType: "underwater",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue: -20,
    maxValue: 0,
    getYValue: point => point.underwater_pct,
    buildHoverData: (point, x, y) => {
      const isRecovery = point.recovery_point || false;
      let recoveryStatus: "Recovered" | "Underwater" | "Near Peak";
      if (point.underwater_pct === 0) recoveryStatus = "Recovered";
      else if (point.underwater_pct > -0.5) recoveryStatus = "Near Peak";
      else recoveryStatus = "Underwater";

      return {
        chartType: "underwater" as const,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        underwater: point.underwater_pct,
        isRecoveryPoint: isRecovery,
        recoveryStatus,
      };
    },
  });

  const renderPerformanceChart = useMemo(
    () => (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-800/50" />
          ))}
        </div>

        {/* Chart area */}
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={performanceHover.handleMouseMove}
          onMouseLeave={performanceHover.handleMouseLeave}
        >
          <defs>
            <linearGradient
              id="portfolioGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="benchmarkGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Portfolio line */}
          {portfolioPath && (
            <path
              d={portfolioPath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="3"
              className="drop-shadow-lg"
            />
          )}

          {/* Benchmark line */}
          {benchmarkPath && (
            <path
              d={benchmarkPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          )}

          {/* Fill area under portfolio curve */}
          {portfolioAreaPath && (
            <path d={portfolioAreaPath} fill="url(#portfolioGradient)" />
          )}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={performanceHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          {generateYAxisLabels(minValue, maxValue, 3).map((value, index) => (
            <span key={index}>{formatAxisLabel(value)}</span>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 flex items-center space-x-4 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-purple-500"></div>
            <span className="text-white">Portfolio</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-0.5 bg-blue-500 opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #3b82f6, #3b82f6 3px, transparent 3px, transparent 6px)",
              }}
            ></div>
            <span className="text-gray-400">Benchmark</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={performanceHover.hoveredPoint}
          chartWidth={CHART_WIDTH}
          chartHeight={CHART_HEIGHT}
        />
      </div>
    ),
    [
      minValue,
      maxValue,
      performanceHover.hoveredPoint,
      performanceHover.handleMouseMove,
      performanceHover.handleMouseLeave,
      portfolioPath,
      benchmarkPath,
      portfolioAreaPath,
    ]
  );

  const renderAllocationChart = useMemo(() => {
    if (allocationHistory.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-sm text-gray-500">
          No allocation history available for the selected period.
        </div>
      );
    }

    return (
      <div className="h-80">
        <div className="relative h-full">
          <svg
            viewBox="0 0 800 300"
            className="w-full h-full"
            onMouseMove={allocationHover.handleMouseMove}
            onMouseLeave={allocationHover.handleMouseLeave}
          >
            {allocationHistory.map((point, index) => {
              const total =
                point.btc +
                point.eth +
                point.stablecoin +
                point.defi +
                point.altcoin;

              if (total <= 0) {
                return null;
              }

              const x =
                allocationHistory.length <= 1
                  ? 400
                  : (index / (allocationHistory.length - 1)) * 800;

              let yOffset = 300;

              // Stack areas
              const assets = [
                { value: point.btc, color: "#f59e0b" },
                { value: point.eth, color: "#6366f1" },
                { value: point.stablecoin, color: "#10b981" },
                { value: point.defi, color: "#8b5cf6" },
                { value: point.altcoin, color: "#ef4444" },
              ];

              return (
                <g key={index}>
                  {assets.map((asset, assetIndex) => {
                    const height = total > 0 ? (asset.value / total) * 280 : 0;
                    const y = yOffset - height;
                    yOffset -= height;

                    return (
                      <rect
                        key={assetIndex}
                        x={x - 2}
                        y={y}
                        width="4"
                        height={height}
                        fill={asset.color}
                        opacity="0.8"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Hover indicator */}
            <ChartIndicator hoveredPoint={allocationHover.hoveredPoint} />
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 space-y-1 text-xs pointer-events-none">
            {[
              { label: "BTC", color: "#f59e0b" },
              { label: "ETH", color: "#6366f1" },
              { label: "Stablecoin", color: "#10b981" },
              { label: "DeFi", color: "#8b5cf6" },
              { label: "Altcoin", color: "#ef4444" },
            ].map(asset => (
              <div key={asset.label} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: asset.color }}
                ></div>
                <span className="text-gray-300">{asset.label}</span>
              </div>
            ))}
          </div>

          {/* Hover Tooltip */}
          <ChartTooltip
            hoveredPoint={allocationHover.hoveredPoint}
            chartWidth={CHART_WIDTH}
            chartHeight={CHART_HEIGHT}
          />
        </div>
      </div>
    );
  }, [
    allocationHistory,
    allocationHover.hoveredPoint,
    allocationHover.handleMouseMove,
    allocationHover.handleMouseLeave,
  ]);

  const renderDrawdownChart = useMemo(
    () => (
      <div className="relative h-80">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          onMouseMove={drawdownHover.handleMouseMove}
          onMouseLeave={drawdownHover.handleMouseLeave}
        >
          <defs>
            <linearGradient
              id="drawdownGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Zero line */}
          <line
            x1="0"
            y1="50"
            x2="800"
            y2="50"
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Drawdown area */}
          <path
            d={`M 0 50 ${drawdownData
              .map((point, index) => {
                const x = (index / (drawdownData.length - 1)) * 800;
                const y = 50 - (point.drawdown / -20) * 250; // Scale to -20% max
                return `L ${x} ${y}`;
              })
              .join(" ")} L 800 50 Z`}
            fill="url(#drawdownGradient)"
          />

          {/* Drawdown line */}
          <path
            d={`M ${drawdownData
              .map((point, index) => {
                const x = (index / (drawdownData.length - 1)) * 800;
                const y = 50 - (point.drawdown / -20) * 250;
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          />

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={drawdownHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>0%</span>
          <span>-5%</span>
          <span>-10%</span>
          <span>-15%</span>
          <span>-20%</span>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={drawdownHover.hoveredPoint}
          chartWidth={CHART_WIDTH}
          chartHeight={CHART_HEIGHT}
        />
      </div>
    ),
    [
      drawdownData,
      drawdownHover.hoveredPoint,
      drawdownHover.handleMouseMove,
      drawdownHover.handleMouseLeave,
    ]
  );

  const renderSharpeChart = useMemo(
    () => (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-800/50" />
          ))}
        </div>

        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          onMouseMove={sharpeHover.handleMouseMove}
          onMouseLeave={sharpeHover.handleMouseLeave}
        >
          <defs>
            <linearGradient
              id="sharpeGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Sharpe ratio line */}
          <path
            d={`M ${sharpeData
              .map((point, index) => {
                const x = (index / (sharpeData.length - 1)) * 800;
                const y = 250 - (point.sharpe / 2.5) * 200; // Scale 0-2.5
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            className="drop-shadow-lg"
          />

          {/* Fill area under curve */}
          <path
            d={`M 0 250 ${sharpeData
              .map((point, index) => {
                const x = (index / (sharpeData.length - 1)) * 800;
                const y = 250 - (point.sharpe / 2.5) * 200;
                return `L ${x} ${y}`;
              })
              .join(" ")} L 800 250 Z`}
            fill="url(#sharpeGradient)"
          />

          {/* Reference line at Sharpe = 1.0 */}
          <line
            x1="0"
            y1={250 - (1.0 / 2.5) * 200}
            x2="800"
            y2={250 - (1.0 / 2.5) * 200}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.5"
          />

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={sharpeHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>2.5</span>
          <span>2.0</span>
          <span>1.5</span>
          <span>1.0</span>
          <span>0.5</span>
          <span>0.0</span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-emerald-500"></div>
            <span className="text-white">Rolling Sharpe Ratio</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div
              className="w-3 h-0.5 bg-gray-500 opacity-50"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #6b7280, #6b7280 2px, transparent 2px, transparent 4px)",
              }}
            ></div>
            <span className="text-gray-400">Sharpe = 1.0</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={sharpeHover.hoveredPoint}
          chartWidth={CHART_WIDTH}
          chartHeight={CHART_HEIGHT}
        />
      </div>
    ),
    [
      sharpeData,
      sharpeHover.hoveredPoint,
      sharpeHover.handleMouseMove,
      sharpeHover.handleMouseLeave,
    ]
  );

  const renderVolatilityChart = useMemo(
    () => (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-800/50" />
          ))}
        </div>

        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          onMouseMove={volatilityHover.handleMouseMove}
          onMouseLeave={volatilityHover.handleMouseLeave}
        >
          <defs>
            <linearGradient
              id="volatilityGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Volatility line */}
          <path
            d={`M ${volatilityData
              .map((point, index) => {
                const x = (index / (volatilityData.length - 1)) * 800;
                const y = 250 - ((point.volatility - 10) / 30) * 200; // Scale 10-40%
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            className="drop-shadow-lg"
          />

          {/* Fill area under curve */}
          <path
            d={`M 0 250 ${volatilityData
              .map((point, index) => {
                const x = (index / (volatilityData.length - 1)) * 800;
                const y = 250 - ((point.volatility - 10) / 30) * 200;
                return `L ${x} ${y}`;
              })
              .join(" ")} L 800 250 Z`}
            fill="url(#volatilityGradient)"
          />

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={volatilityHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>40%</span>
          <span>32%</span>
          <span>25%</span>
          <span>18%</span>
          <span>10%</span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-amber-500"></div>
            <span className="text-white">30-Day Volatility</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={volatilityHover.hoveredPoint}
          chartWidth={CHART_WIDTH}
          chartHeight={CHART_HEIGHT}
        />
      </div>
    ),
    [
      volatilityData,
      volatilityHover.hoveredPoint,
      volatilityHover.handleMouseMove,
      volatilityHover.handleMouseLeave,
    ]
  );

  const renderUnderwaterChart = useMemo(
    () => (
      <div className="relative h-80">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          onMouseMove={underwaterHover.handleMouseMove}
          onMouseLeave={underwaterHover.handleMouseLeave}
        >
          <defs>
            <linearGradient
              id="underwaterGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient
              id="recoveryGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Zero line */}
          <line
            x1="0"
            y1="50"
            x2="800"
            y2="50"
            stroke="#374151"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* Underwater area */}
          <path
            d={`M 0 50 ${underwaterData
              .map((point, index) => {
                const x = (index / (underwaterData.length - 1)) * 800;
                const y = 50 - (point.underwater / -20) * 250; // Scale to -20% max
                return `L ${x} ${y}`;
              })
              .join(" ")} L 800 50 Z`}
            fill="url(#underwaterGradient)"
          />

          {/* Underwater line */}
          <path
            d={`M ${underwaterData
              .map((point, index) => {
                const x = (index / (underwaterData.length - 1)) * 800;
                const y = 50 - (point.underwater / -20) * 250;
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
          />

          {/* Recovery indicators */}
          {underwaterData.map((point, index) => {
            if (!point.recovery) return null;
            const x = (index / (underwaterData.length - 1)) * 800;
            return (
              <circle
                key={index}
                cx={x}
                cy="45"
                r="3"
                fill="#10b981"
                opacity="0.8"
              />
            );
          })}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={underwaterHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>0%</span>
          <span>-5%</span>
          <span>-10%</span>
          <span>-15%</span>
          <span>-20%</span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 space-y-1 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-white">Underwater Periods</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-400">Recovery Points</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={underwaterHover.hoveredPoint}
          chartWidth={CHART_WIDTH}
          chartHeight={CHART_HEIGHT}
        />
      </div>
    ),
    [
      underwaterData,
      underwaterHover.hoveredPoint,
      underwaterHover.handleMouseMove,
      underwaterHover.handleMouseLeave,
    ]
  );

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
              <Calendar className="w-5 h-5 mr-2 text-purple-400" />
              Historical Performance
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div
                className={`font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}
              >
                {isPositive ? "+" : ""}
                {totalReturn.toFixed(2)}%
                <span className="text-gray-400 ml-1">({selectedPeriod})</span>
              </div>
              <div className="text-gray-400">
                ${(currentValue / 1000).toFixed(1)}k Current Value
              </div>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="flex flex-wrap gap-2 mb-4 lg:mb-0">
            {[
              { key: "performance", label: "Performance", icon: TrendingUp },
              { key: "allocation", label: "Allocation", icon: PieChart },
              { key: "drawdown", label: "Drawdown", icon: Activity },
              { key: "sharpe", label: "Sharpe Ratio", icon: Target },
              { key: "volatility", label: "Volatility", icon: BarChart3 },
              { key: "underwater", label: "Underwater", icon: Activity },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
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
              >
                <Icon className="w-4 h-4" />
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
        <div className="relative">
          {selectedChart === "performance" && renderPerformanceChart}
          {selectedChart === "allocation" && renderAllocationChart}
          {selectedChart === "drawdown" && renderDrawdownChart}
          {selectedChart === "sharpe" && renderSharpeChart}
          {selectedChart === "volatility" && renderVolatilityChart}
          {selectedChart === "underwater" && renderUnderwaterChart}
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
