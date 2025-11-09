import {
  AssetAllocationPoint,
  PortfolioDataPoint,
} from "../../types/portfolio";

export interface AllocationTimeseriesInputPoint {
  date: string;
  category?: string;
  protocol?: string;
  percentage?: number;
  percentage_of_portfolio?: number;
  allocation_percentage?: number;
  category_value?: number;
  category_value_usd?: number;
  total_value?: number;
  total_portfolio_value_usd?: number;
}

export interface DrawdownOverridePoint {
  date: string;
  drawdown_pct?: number;
  drawdown?: number;
  portfolio_value?: number;
  isRecoveryPoint?: boolean;
  daysFromPeak?: number;
  peakDate?: string;
  recoveryDurationDays?: number;
  recoveryDepth?: number;
  isHistoricalPeriod?: boolean;
}

export interface DrawdownRecoveryData {
  date: string;
  drawdown: number;
  isRecoveryPoint?: boolean;
  daysFromPeak?: number;
  peakDate?: string;
  recoveryDurationDays?: number;
  recoveryDepth?: number;
  isHistoricalPeriod?: boolean;
}

export interface DrawdownRecoverySummary {
  maxDrawdown: number;
  totalRecoveries: number;
  averageRecoveryDays: number | null;
  currentDrawdown: number;
  currentStatus: "Underwater" | "At Peak";
  latestPeakDate?: string;
  latestRecoveryDurationDays?: number;
}

export interface SharpeOverridePoint {
  date: string;
  rolling_sharpe_ratio?: number;
}

export interface VolatilityOverridePoint {
  date: string;
  annualized_volatility_pct?: number;
  rolling_volatility_daily_pct?: number;
}

interface DailyYieldProtocol {
  protocol_name: string;
  chain: string;
  yield_return_usd: number;
}

export interface DailyYieldOverridePoint {
  date: string;
  total_yield_usd: number;
  protocol_count?: number;
  cumulative_yield_usd?: number;
  protocols?: DailyYieldProtocol[];
}

/**
 * Extended portfolio data point with DeFi and Wallet breakdown
 * Used for stacked area chart visualization
 */
export interface PortfolioStackedDataPoint extends PortfolioDataPoint {
  defiValue: number;
  walletValue: number;
  stackedTotalValue: number;
}

export interface PortfolioChartProps {
  userId?: string | undefined;
  portfolioData?: PortfolioDataPoint[];
  allocationData?: AllocationTimeseriesInputPoint[] | AssetAllocationPoint[];
  drawdownData?: DrawdownOverridePoint[];
  sharpeData?: SharpeOverridePoint[];
  volatilityData?: VolatilityOverridePoint[];
  dailyYieldData?: DailyYieldOverridePoint[];
  activeTab?:
    | "performance"
    | "asset-allocation"
    | "drawdown"
    | "sharpe"
    | "volatility"
    | "daily-yield";
  isLoading?: boolean;
  error?: Error | string | null;
}
