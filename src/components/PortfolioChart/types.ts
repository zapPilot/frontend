import {
  PortfolioDataPoint,
  AssetAllocationPoint,
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

export type DrawdownOverridePoint = {
  date: string;
  drawdown_pct?: number;
  drawdown?: number;
  portfolio_value?: number;
};

export type SharpeOverridePoint = {
  date: string;
  rolling_sharpe_ratio?: number;
};

export type VolatilityOverridePoint = {
  date: string;
  annualized_volatility_pct?: number;
  rolling_volatility_daily_pct?: number;
};

export type UnderwaterOverridePoint = {
  date: string;
  underwater_pct?: number;
  recovery_point?: boolean;
};

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
  underwaterData?: UnderwaterOverridePoint[];
  activeTab?:
    | "performance"
    | "allocation"
    | "drawdown"
    | "sharpe"
    | "volatility"
    | "underwater";
  isLoading?: boolean;
  error?: Error | string | null;
}
