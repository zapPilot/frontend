export interface AssetDetail {
  name: string;
  symbol: string;
  protocol: string;
  amount: number;
  value: number;
  apr: number;
  type: string; // e.g., "Staking", "Lending", "Liquidity Pool"
}

export interface AssetCategory {
  id: string;
  name: string;
  color: string;
  totalValue: number;
  percentage: number;
  change24h: number;
  assets: AssetDetail[];
}

export interface PieChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalChange24h: number;
  totalChangePercentage: number;
  annualAPR?: number;
  monthlyReturn?: number;
}

export type RiskLevel = "Low" | "Medium" | "High";
export type AssetType =
  | "Staking"
  | "Lending"
  | "Liquidity Pool"
  | "Holding"
  | "Safety Module"
  | "Liquid Staking";

// Chart and Analytics types
export interface PortfolioDataPoint {
  date: string;
  value: number;
  change: number;
  benchmark?: number;
}

export interface AssetAllocationPoint {
  date: string;
  btc: number;
  eth: number;
  stablecoin: number;
  defi: number;
  altcoin: number;
}

export interface ChartPeriod {
  label: string;
  value: string;
  days: number;
}

export interface AnalyticsMetric {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface PerformancePeriod {
  period: string;
  return: number;
  volatility: number;
  sharpe: number;
  maxDrawdown: number;
}

export interface AssetAttribution {
  asset: string;
  contribution: number;
  allocation: number;
  performance: number;
  color: string;
}

export type APRMetricsSize = "small" | "medium" | "large";
