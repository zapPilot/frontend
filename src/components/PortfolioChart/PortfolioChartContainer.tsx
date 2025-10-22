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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ASSET_CATEGORIES, CHART_COLORS } from "../../constants/portfolio";
import { useUser } from "../../contexts/UserContext";
import { useAllocationTimeseries } from "../../hooks/useAllocationTimeseries";
import { useAnalyticsData } from "../../hooks/useAnalyticsData";
import { useChartHover } from "../../hooks/useChartHover";
import { usePortfolioTrends } from "../../hooks/usePortfolioTrends";
import {
  calculateDaysSincePeak,
  findPeakDate,
  getRecoveryStatus,
  getSharpeInterpretation,
  getVolatilityRiskLevel,
} from "../../lib/chartHoverUtils";
import {
  formatAxisLabel,
  generateAreaPath,
  generateSVGPath,
  generateYAxisLabels,
} from "../../lib/chartUtils";
import { ensureNonNegative } from "../../lib/mathUtils";
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
import { ChartIndicator, ChartTooltip } from "../charts";
import { GlassCard } from "../ui";
import { ButtonSkeleton, Skeleton } from "../ui/LoadingSystem";
import type {
  AllocationTimeseriesInputPoint,
  PortfolioChartProps,
  PortfolioStackedDataPoint,
} from "./types";
import {
  buildStackedPortfolioData,
  getStackedTotalValue,
  buildAllocationHistory,
  getChartInteractionProps,
  CHART_LABELS,
  CHART_CONTENT_ID,
  ENABLE_TEST_AUTO_HOVER,
} from "./utils";

/**
 * Loading skeleton for PortfolioChart
 * Matches the layout of the actual chart component
 */
function PortfolioChartSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      role="status"
      aria-live="polite"
    >
      <GlassCard className="p-6">
        <div className="text-sm font-medium text-gray-300 mb-4">
          Loading portfolio analytics...
        </div>
        {/* Header skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <Skeleton
              variant="text"
              width={250}
              height={28}
              className="mb-2"
              aria-label="Fetching heading"
            />
            <Skeleton
              variant="text"
              width={200}
              height={20}
              aria-label="Fetching subheading"
            />
          </div>

          {/* Chart type selector skeleton */}
          <div className="flex flex-wrap gap-2 mb-4 lg:mb-0">
            {[...Array(6)].map((_, i) => (
              <ButtonSkeleton
                key={i}
                width={120}
                height={40}
                ariaLabel="Fetching chart option"
              />
            ))}
          </div>
        </div>

        {/* Period selector skeleton */}
        <div className="flex space-x-2 mb-6">
          {[...Array(6)].map((_, i) => (
            <ButtonSkeleton
              key={i}
              width={60}
              height={32}
              ariaLabel="Fetching period option"
            />
          ))}
        </div>

        {/* Chart area skeleton */}
        <Skeleton
          variant="rectangular"
          width="100%"
          height={320}
          className="mb-6"
          aria-label="Fetching chart visualization"
        />

        {/* Summary metrics skeleton */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton
                variant="text"
                width="60%"
                height={16}
                className="mx-auto mb-1"
                aria-label="Fetching summary label"
              />
              <Skeleton
                variant="text"
                width="80%"
                height={24}
                className="mx-auto"
                aria-label="Fetching summary value"
              />
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

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

  const drawdownReferenceData = useMemo(
    () =>
      portfolioHistory.map(point => ({
        date: point.date,
        portfolio_value: Number(point.value ?? 0),
      })),
    [portfolioHistory]
  );

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

  // Chart dimensions (match viewBox)
  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 300;
  const CHART_PADDING = 10;
  const DRAWDOWN_TOP_OFFSET = 50;
  const DRAWDOWN_CHART_HEIGHT = CHART_HEIGHT - DRAWDOWN_TOP_OFFSET;
  const DRAWDOWN_DEFAULT_MIN = -20;
  const DRAWDOWN_DEFAULT_MAX = 0;

  // Stacked portfolio data with DeFi and Wallet breakdown
  const stackedPortfolioData = useMemo(
    () => buildStackedPortfolioData(portfolioHistory),
    [portfolioHistory]
  );

  const { minValue, maxValue } = useMemo(() => {
    const stackedTotals = stackedPortfolioData
      .map(getStackedTotalValue)
      .filter(value => Number.isFinite(value));

    if (stackedTotals.length > 0) {
      return {
        minValue: Math.min(...stackedTotals),
        maxValue: Math.max(...stackedTotals),
      };
    }

    const fallbackValues = portfolioHistory
      .map(point => (Number.isFinite(point.value) ? point.value : 0))
      .filter(value => Number.isFinite(value));

    if (fallbackValues.length > 0) {
      return {
        minValue: Math.min(...fallbackValues),
        maxValue: Math.max(...fallbackValues),
      };
    }

    return { minValue: 0, maxValue: 0 };
  }, [stackedPortfolioData, portfolioHistory]);

  // Generate stacked area paths for DeFi and Wallet visualization
  const { defiAreaPath, walletAreaPath, defiLinePath, totalPath } =
    useMemo(() => {
      if (stackedPortfolioData.length === 0) {
        return {
          defiAreaPath: "",
          walletAreaPath: "",
          defiLinePath: "",
          totalPath: "",
        };
      }

      const totals = stackedPortfolioData.map(getStackedTotalValue);
      const minStackedValue = Math.min(...totals);
      const maxStackedValue = Math.max(...totals);
      const valueRange = Math.max(maxStackedValue - minStackedValue, 1);

      // DeFi area: from baseline (bottom of chart) to defiValue
      const defiPath = generateAreaPath(
        stackedPortfolioData,
        p => (p as PortfolioStackedDataPoint).defiValue,
        CHART_WIDTH,
        CHART_HEIGHT,
        CHART_PADDING
      );

      const walletSegments = stackedPortfolioData.map((point, index) => {
        const x =
          stackedPortfolioData.length <= 1
            ? CHART_WIDTH / 2
            : (index / (stackedPortfolioData.length - 1)) * CHART_WIDTH;

        const defiBoundary = ensureNonNegative(point.defiValue);
        const totalValue = getStackedTotalValue(point);

        const defiY =
          CHART_HEIGHT -
          CHART_PADDING -
          ((defiBoundary - minStackedValue) / valueRange) *
            (CHART_HEIGHT - 2 * CHART_PADDING);

        const totalY =
          CHART_HEIGHT -
          CHART_PADDING -
          ((totalValue - minStackedValue) / valueRange) *
            (CHART_HEIGHT - 2 * CHART_PADDING);

        return { x, defiY, totalY };
      });

      const forwardPath = walletSegments
        .map((seg, i) => `${i === 0 ? "M" : "L"} ${seg.x} ${seg.totalY}`)
        .join(" ");

      const reversePath = walletSegments
        .slice()
        .reverse()
        .map(seg => `L ${seg.x} ${seg.defiY}`)
        .join(" ");

      const walletPath = walletSegments.length
        ? `${forwardPath} ${reversePath} Z`
        : "";

      // Generate boundary line between DeFi and Wallet regions
      const defiLine = walletSegments.length
        ? walletSegments
            .map((seg, i) => `${i === 0 ? "M" : "L"} ${seg.x} ${seg.defiY}`)
            .join(" ")
        : "";

      const totalOutline = generateSVGPath(
        stackedPortfolioData,
        p => getStackedTotalValue(p as PortfolioStackedDataPoint),
        CHART_WIDTH,
        CHART_HEIGHT,
        CHART_PADDING
      );

      return {
        defiAreaPath: defiPath,
        walletAreaPath: walletPath,
        defiLinePath: defiLine,
        totalPath: totalOutline,
      };
    }, [stackedPortfolioData]);

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

  const drawdownMinValue = useMemo(() => {
    if (drawdownData.length === 0) {
      return DRAWDOWN_DEFAULT_MIN;
    }

    const values = drawdownData.map(point => point.drawdown ?? 0);
    const rawMin = Math.min(...values);

    if (!Number.isFinite(rawMin)) {
      return DRAWDOWN_DEFAULT_MIN;
    }
    const roundedMin = Math.floor(rawMin / 5) * 5;
    return Math.min(roundedMin, DRAWDOWN_DEFAULT_MIN);
  }, [DRAWDOWN_DEFAULT_MIN, drawdownData]);

  const drawdownScaleDenominator = useMemo(() => {
    const denominator = drawdownMinValue - DRAWDOWN_DEFAULT_MAX;
    return denominator !== 0 ? denominator : DRAWDOWN_DEFAULT_MIN;
  }, [DRAWDOWN_DEFAULT_MAX, DRAWDOWN_DEFAULT_MIN, drawdownMinValue]);

  const getDrawdownY = useCallback(
    (value: number) => {
      if (!Number.isFinite(value)) {
        return DRAWDOWN_TOP_OFFSET + DRAWDOWN_CHART_HEIGHT;
      }

      const normalized =
        drawdownScaleDenominator !== 0
          ? (value - DRAWDOWN_DEFAULT_MAX) / drawdownScaleDenominator
          : 0;

      const rawY = DRAWDOWN_TOP_OFFSET + normalized * DRAWDOWN_CHART_HEIGHT;

      return Math.min(
        DRAWDOWN_TOP_OFFSET + DRAWDOWN_CHART_HEIGHT,
        Math.max(DRAWDOWN_TOP_OFFSET, rawY)
      );
    },
    [
      DRAWDOWN_CHART_HEIGHT,
      DRAWDOWN_DEFAULT_MAX,
      DRAWDOWN_TOP_OFFSET,
      drawdownScaleDenominator,
    ]
  );

  const drawdownZeroLineY = useMemo(
    () => getDrawdownY(DRAWDOWN_DEFAULT_MAX),
    [getDrawdownY]
  );

  const drawdownLinePath = useMemo(() => {
    if (drawdownData.length === 0) {
      return "";
    }

    return drawdownData
      .map((point, index) => {
        const x =
          drawdownData.length <= 1
            ? CHART_WIDTH / 2
            : (index / (drawdownData.length - 1)) * CHART_WIDTH;
        const y = getDrawdownY(point.drawdown);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [drawdownData, getDrawdownY]);

  const drawdownAreaPath = useMemo(() => {
    if (drawdownData.length === 0) {
      return "";
    }

    const baselineY = drawdownZeroLineY;
    const segments = drawdownData
      .map((point, index) => {
        const x =
          drawdownData.length <= 1
            ? CHART_WIDTH / 2
            : (index / (drawdownData.length - 1)) * CHART_WIDTH;
        const y = getDrawdownY(point.drawdown);
        return `L ${x} ${y}`;
      })
      .join(" ");

    return `M 0 ${baselineY} ${segments} L ${CHART_WIDTH} ${baselineY} Z`;
  }, [drawdownData, drawdownZeroLineY, getDrawdownY]);

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
        ), // Already in percentage terms
      }));
  }, [rollingVolatilityData, volatilityDataOverride]);

  // Real data for Underwater Chart (enhanced drawdown)
  const underwaterData = useMemo(() => {
    if (underwaterDataOverride?.length) {
      return underwaterDataOverride.map(point => ({
        date: point.date,
        underwater: Number(point.underwater_pct ?? 0),
        recovery: point.recovery_point,
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
      recovery: point.recovery_point,
    }));
  }, [underwaterDataOverride, underwaterRecoveryData]);

  // Performance chart hover
  const performanceHover = useChartHover(stackedPortfolioData, {
    chartType: "performance",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue,
    maxValue,
    getYValue: point => getStackedTotalValue(point),
    buildHoverData: (point, x, y) => ({
      chartType: "performance" as const,
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      value: getStackedTotalValue(point),
      benchmark: point.benchmark || 0,
      defiValue: point.defiValue,
      walletValue: point.walletValue,
    }),
    testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
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
      const total = point.btc + point.eth + point.stablecoin + point.altcoin;
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
        altcoin: total > 0 ? (point.altcoin / total) * 100 : 0,
      };
    },
    testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
  });

  // Drawdown chart hover
  const drawdownHover = useChartHover(drawdownData, {
    chartType: "drawdown",
    chartWidth: CHART_WIDTH,
    chartHeight: DRAWDOWN_CHART_HEIGHT,
    chartPadding: 0,
    minValue: drawdownMinValue,
    maxValue: DRAWDOWN_DEFAULT_MAX,
    getYValue: point => point.drawdown,
    buildHoverData: (point, x, _y, index) => {
      const yPosition = getDrawdownY(point.drawdown);

      return {
        chartType: "drawdown" as const,
        x,
        y: yPosition,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        drawdown: point.drawdown,
        peakDate: findPeakDate(drawdownReferenceData, index),
        distanceFromPeak: calculateDaysSincePeak(drawdownReferenceData, index),
      };
    },
    testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
  });

  // Sharpe chart hover (5-level system)
  const sharpeHover = useChartHover(sharpeData, {
    chartType: "sharpe",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue: 0,
    maxValue: 2.5,
    getYValue: point => point.sharpe,
    buildHoverData: (point, x, y) => {
      const sharpe = point.sharpe ?? 0;

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
        interpretation: getSharpeInterpretation(sharpe),
      };
    },
    testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
  });

  // Volatility chart hover with risk levels
  const volatilityHover = useChartHover(volatilityData, {
    chartType: "volatility",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue: 10,
    maxValue: 40,
    getYValue: point => point.volatility,
    buildHoverData: (point, x, y) => {
      const vol = point.volatility ?? 0;

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
        riskLevel: getVolatilityRiskLevel(vol),
      };
    },
    testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
  });

  // Underwater chart hover
  const underwaterHover = useChartHover(underwaterData, {
    chartType: "underwater",
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    chartPadding: CHART_PADDING,
    minValue: -20,
    maxValue: 0,
    getYValue: point => point.underwater,
    buildHoverData: (point, x, y) => {
      const isRecovery = point.recovery ?? false;

      return {
        chartType: "underwater" as const,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        underwater: point.underwater,
        isRecoveryPoint: isRecovery,
        recoveryStatus: getRecoveryStatus(point.underwater),
      };
    },
    testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
  });

  const renderPerformanceChart = useMemo(
    () => (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-700/60" />
          ))}
        </div>

        {/* Chart area */}
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          data-chart-type="performance"
          aria-label={CHART_LABELS.performance}
          {...getChartInteractionProps(performanceHover)}
        >
          <text x="16" y="20" opacity="0">
            Portfolio performance data over the selected period {selectedPeriod}
          </text>
          <defs>
            {/* DeFi gradient - Purple with enhanced contrast */}
            <linearGradient id="defiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
            </linearGradient>

            {/* Wallet gradient - Cyan with enhanced contrast */}
            <linearGradient
              id="walletGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Stacked Areas: DeFi (bottom) + Wallet (top) */}
          {defiAreaPath && <path d={defiAreaPath} fill="url(#defiGradient)" />}

          {walletAreaPath && (
            <path d={walletAreaPath} fill="url(#walletGradient)" />
          )}

          {/* Separation line between DeFi and Wallet */}
          {defiLinePath && (
            <path
              d={defiLinePath}
              fill="none"
              stroke="#64748b"
              strokeWidth="1"
              opacity="0.4"
            />
          )}

          {/* Total portfolio outline with glow effect */}
          {totalPath && (
            <>
              {/* White glow layer for contrast */}
              <path
                d={totalPath}
                fill="none"
                stroke="white"
                strokeWidth="4"
                opacity="0.15"
                className="blur-sm"
              />
              {/* Main outline in lighter purple */}
              <path
                d={totalPath}
                fill="none"
                stroke="#c4b5fd"
                strokeWidth="2.5"
                className="drop-shadow-lg"
              />
            </>
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
        <div className="absolute top-4 right-4 flex items-center space-x-3 text-xs pointer-events-none">
          <div className="flex items-center space-x-1.5">
            <div
              className="w-3 h-2 rounded-sm"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(139, 92, 246, 0.6), rgba(139, 92, 246, 0.25))",
              }}
            ></div>
            <span className="text-white">DeFi</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div
              className="w-3 h-2 rounded-sm"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(6, 182, 212, 0.7), rgba(6, 182, 212, 0.3))",
              }}
            ></div>
            <span className="text-white">Wallet</span>
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
      selectedPeriod,
      performanceHover,
      defiAreaPath,
      walletAreaPath,
      defiLinePath,
      totalPath,
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
            data-chart-type="allocation"
            aria-label={CHART_LABELS.allocation}
            {...getChartInteractionProps(allocationHover)}
          >
            <text x="16" y="20" opacity="0">
              Asset allocation percentages across core holdings
            </text>
            {allocationHistory.map((point, index) => {
              const total =
                point.btc + point.eth + point.stablecoin + point.altcoin;

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
                { value: point.btc, color: CHART_COLORS.btc },
                { value: point.eth, color: CHART_COLORS.eth },
                { value: point.stablecoin, color: CHART_COLORS.stablecoin },
                { value: point.altcoin, color: CHART_COLORS.altcoin },
              ];

              return (
                <g key={index}>
                  {assets.map((asset, assetIndex) => {
                    const height = total > 0 ? (asset.value / total) * 280 : 0;
                    const y = yOffset - height;
                    yOffset -= height;

                    const left = x - 2;
                    const right = x + 2;
                    const bottom = y + height;

                    return (
                      <path
                        key={assetIndex}
                        d={`M ${left} ${y} L ${right} ${y} L ${right} ${bottom} L ${left} ${bottom} Z`}
                        fill={asset.color}
                        opacity="0.8"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Vertical line indicator for stacked chart */}
            {allocationHover.hoveredPoint && (
              <motion.line
                x1={allocationHover.hoveredPoint.x}
                y1={10}
                x2={allocationHover.hoveredPoint.x}
                y2={290}
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ pointerEvents: "none" }}
                aria-hidden="true"
              />
            )}
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 space-y-1 text-xs pointer-events-none">
            {["btc", "eth", "stablecoin", "altcoin"].map(key => {
              const category =
                ASSET_CATEGORIES[key as keyof typeof ASSET_CATEGORIES];
              return (
                <div key={key} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: category.chartColor }}
                  ></div>
                  <span className="text-gray-300">{category.shortLabel}</span>
                </div>
              );
            })}
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
  }, [allocationHistory, allocationHover]);

  const renderDrawdownChart = useMemo(
    () => (
      <div className="relative h-80">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          data-chart-type="drawdown"
          aria-label={CHART_LABELS.drawdown}
          {...getChartInteractionProps(drawdownHover)}
        >
          <text x="16" y="20" opacity="0">
            Drawdown percentages relative to portfolio peak values
          </text>
          <defs>
            <linearGradient
              id="drawdownGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Zero line */}
          <line
            x1="0"
            y1={drawdownZeroLineY}
            x2={CHART_WIDTH}
            y2={drawdownZeroLineY}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Drawdown area */}
          {drawdownAreaPath && (
            <path d={drawdownAreaPath} fill="url(#drawdownGradient)" />
          )}

          {/* Drawdown line */}
          {drawdownLinePath && (
            <path
              d={drawdownLinePath}
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
            />
          )}

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
    [drawdownAreaPath, drawdownLinePath, drawdownZeroLineY, drawdownHover]
  );

  const renderSharpeChart = useMemo(
    () => (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-700/60" />
          ))}
        </div>

        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          data-chart-type="sharpe"
          aria-label={CHART_LABELS.sharpe}
          {...getChartInteractionProps(sharpeHover)}
        >
          <text x="16" y="20" opacity="0">
            Rolling Sharpe ratio trend for the portfolio
          </text>
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
    [sharpeData, sharpeHover]
  );

  const renderVolatilityChart = useMemo(
    () => (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-700/60" />
          ))}
        </div>

        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          data-chart-type="volatility"
          aria-label={CHART_LABELS.volatility}
          {...getChartInteractionProps(volatilityHover)}
        >
          <text x="16" y="20" opacity="0">
            Rolling volatility expressed as annualized percentage
          </text>
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
    [volatilityData, volatilityHover]
  );

  const renderUnderwaterChart = useMemo(
    () => (
      <div className="relative h-80">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          data-chart-type="underwater"
          aria-label={CHART_LABELS.underwater}
          {...getChartInteractionProps(underwaterHover)}
        >
          <text x="16" y="20" opacity="0">
            Underwater recovery status relative to peak values
          </text>
          <defs>
            <linearGradient
              id="underwaterGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
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
                const y = 50 + (point.underwater / -20) * 250; // Scale to -20% max
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
                const y = 50 + (point.underwater / -20) * 250;
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#0891b2"
            strokeWidth="2.5"
          />

          {/* Recovery indicators */}
          {underwaterData.map((point, index) => {
            if (!point.recovery) return null;
            const x = (index / (underwaterData.length - 1)) * 800;
            const y = 50 + (point.underwater / -20) * 250;
            return (
              <g key={index}>
                {/* Vertical recovery line from zero to curve */}
                <line
                  x1={x}
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  opacity="0.6"
                />
                {/* Recovery point circle at zero line */}
                <circle cx={x} cy="50" r="5" fill="#10b981" opacity="0.8" />
              </g>
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
            <div className="w-3 h-0.5 bg-cyan-600"></div>
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
    [underwaterData, underwaterHover]
  );

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

export default PortfolioChart;
