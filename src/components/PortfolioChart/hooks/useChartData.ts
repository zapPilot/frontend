import { useMemo } from "react";
import { useAllocationTimeseries } from "../../../hooks/useAllocationTimeseries";
import { useAnalyticsData } from "../../../hooks/useAnalyticsData";
import { usePortfolioTrends } from "../../../hooks/usePortfolioTrends";
import {
  CHART_PERIODS,
  calculateDrawdownData,
} from "../../../lib/portfolio-analytics";
import {
  getEnhancedDrawdown,
  getRollingSharpe,
  getRollingVolatility,
  getUnderwaterRecovery,
} from "../../../services/analyticsService";
import type {
  AssetAllocationPoint,
  PortfolioDataPoint,
} from "../../../types/portfolio";
import type {
  AllocationTimeseriesInputPoint,
  DrawdownOverridePoint,
  SharpeOverridePoint,
  VolatilityOverridePoint,
  UnderwaterOverridePoint,
  PortfolioStackedDataPoint,
} from "../types";
import { buildAllocationHistory, buildStackedPortfolioData } from "../utils";

/**
 * Interface for override data that can be passed to useChartData
 */
interface ChartDataOverrides {
  portfolioData?: PortfolioDataPoint[] | undefined;
  allocationData?:
    | AllocationTimeseriesInputPoint[]
    | AssetAllocationPoint[]
    | undefined;
  drawdownData?: DrawdownOverridePoint[] | undefined;
  sharpeData?: SharpeOverridePoint[] | undefined;
  volatilityData?: VolatilityOverridePoint[] | undefined;
  underwaterData?: UnderwaterOverridePoint[] | undefined;
}

/**
 * Return type for useChartData hook
 */
interface ChartData {
  // Processed data for each chart type
  stackedPortfolioData: PortfolioStackedDataPoint[];
  allocationHistory: AssetAllocationPoint[];
  drawdownData: Array<{ date: string; drawdown: number }>;
  sharpeData: Array<{ date: string; sharpe: number }>;
  volatilityData: Array<{ date: string; volatility: number }>;
  underwaterData: Array<{
    date: string;
    underwater: number;
    recovery?: boolean;
  }>;

  // Raw portfolio history for reference
  portfolioHistory: PortfolioDataPoint[];

  // Drawdown reference data
  drawdownReferenceData: Array<{ date: string; portfolio_value: number }>;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Portfolio metrics
  currentValue: number;
  firstValue: number;
  totalReturn: number;
  isPositive: boolean;
}

/**
 * Custom hook for fetching and processing all chart data.
 * Handles data fetching, processing, and provides loading/error states.
 *
 * @param userId - User identifier for fetching portfolio data
 * @param selectedPeriod - Time period for data fetching (e.g., "3M", "1Y")
 * @param overrides - Optional override data for testing or preloaded data
 * @param externalLoading - Optional external loading state
 * @param externalError - Optional external error state
 * @returns Processed chart data with loading and error states
 */
export function useChartData(
  userId: string | undefined,
  selectedPeriod: string,
  overrides?: ChartDataOverrides,
  externalLoading?: boolean,
  externalError?: string | Error | null
): ChartData {
  // Convert period to days
  const selectedDays =
    CHART_PERIODS.find(p => p.value === selectedPeriod)?.days || 90;

  // Fetch real portfolio trends data
  const { data: apiPortfolioHistory, loading: portfolioLoading } =
    usePortfolioTrends({
      userId,
      days: selectedDays,
      enabled: !!userId,
    });

  // Fetch Phase 2 analytics data
  const { data: rollingSharpeData, loading: sharpeLoading } = useAnalyticsData(
    getRollingSharpe,
    {
      userId,
      days: selectedDays,
      enabled: !!userId,
    }
  );

  const { data: rollingVolatilityData, loading: volatilityLoading } =
    useAnalyticsData(getRollingVolatility, {
      userId,
      days: selectedDays,
      enabled: !!userId,
    });

  const { data: enhancedDrawdownData, loading: drawdownLoading } =
    useAnalyticsData(getEnhancedDrawdown, {
      userId,
      days: selectedDays,
      enabled: !!userId,
    });

  const { data: underwaterRecoveryData, loading: underwaterLoading } =
    useAnalyticsData(getUnderwaterRecovery, {
      userId,
      days: selectedDays,
      enabled: !!userId,
    });

  const { data: allocationTimeseriesData, loading: allocationLoading } =
    useAllocationTimeseries({
      userId,
      days: selectedDays,
      enabled: !!userId,
    });

  // Check for preloaded data
  const hasPreloadedData =
    (overrides?.portfolioData?.length ?? 0) > 0 ||
    (overrides?.allocationData?.length ?? 0) > 0 ||
    (overrides?.drawdownData?.length ?? 0) > 0 ||
    (overrides?.sharpeData?.length ?? 0) > 0 ||
    (overrides?.volatilityData?.length ?? 0) > 0 ||
    (overrides?.underwaterData?.length ?? 0) > 0;

  // Normalize error
  const normalizedError =
    externalError == null
      ? null
      : typeof externalError === "string"
        ? externalError
        : (externalError.message ?? "Failed to load portfolio analytics");

  // Combine all loading states
  const isLoading =
    !normalizedError &&
    (Boolean(externalLoading) ||
      (!hasPreloadedData &&
        (portfolioLoading ||
          sharpeLoading ||
          volatilityLoading ||
          drawdownLoading ||
          underwaterLoading ||
          allocationLoading)));

  // Portfolio history with fallback logic
  const portfolioHistory: PortfolioDataPoint[] = useMemo(() => {
    if (overrides?.portfolioData?.length) {
      return overrides.portfolioData;
    }
    return apiPortfolioHistory || [];
  }, [apiPortfolioHistory, overrides?.portfolioData]);

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
    if (overrides?.allocationData?.length) {
      const firstOverride = overrides.allocationData[0] as
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
        return (overrides.allocationData as AssetAllocationPoint[]).map(
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
        overrides.allocationData as AllocationTimeseriesInputPoint[]
      );
    }
    return buildAllocationHistory(
      allocationTimeseriesData?.allocation_data ?? []
    );
  }, [overrides?.allocationData, allocationTimeseriesData]);

  // Calculate portfolio metrics
  const currentValue =
    portfolioHistory[portfolioHistory.length - 1]?.value || 0;
  const firstValue = portfolioHistory[0]?.value || 0;
  const totalReturn =
    firstValue > 0 ? ((currentValue - firstValue) / firstValue) * 100 : 0;
  const isPositive = totalReturn >= 0;

  // Stacked portfolio data with DeFi and Wallet breakdown
  const stackedPortfolioData = useMemo(
    () => buildStackedPortfolioData(portfolioHistory),
    [portfolioHistory]
  );

  // Drawdown data for DrawdownChart component
  const drawdownData = useMemo(() => {
    if (overrides?.drawdownData?.length) {
      return overrides.drawdownData.map(point => ({
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
  }, [overrides?.drawdownData, enhancedDrawdownData, portfolioHistory]);

  // Real data for Rolling Sharpe Ratio
  const sharpeData = useMemo(() => {
    if (overrides?.sharpeData?.length) {
      return overrides.sharpeData
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
  }, [rollingSharpeData, overrides?.sharpeData]);

  // Real data for Rolling Volatility
  const volatilityData = useMemo(() => {
    if (overrides?.volatilityData?.length) {
      return overrides.volatilityData
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
  }, [rollingVolatilityData, overrides?.volatilityData]);

  // Real data for Underwater Chart (enhanced drawdown)
  const underwaterData = useMemo(() => {
    if (overrides?.underwaterData?.length) {
      return overrides.underwaterData.map(point => ({
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
  }, [overrides?.underwaterData, underwaterRecoveryData]);

  return {
    stackedPortfolioData,
    allocationHistory,
    drawdownData,
    sharpeData,
    volatilityData,
    underwaterData,
    portfolioHistory,
    drawdownReferenceData,
    isLoading,
    error: normalizedError,
    currentValue,
    firstValue,
    totalReturn,
    isPositive,
  };
}
