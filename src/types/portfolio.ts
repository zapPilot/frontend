interface AssetDetail {
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

// Chart and Analytics types
export interface PortfolioDataPoint {
  date: string;
  value: number;
  change: number;
  benchmark?: number;
  protocols?: {
    protocol: string;
    chain: string;
    value: number;
    pnl: number;
    sourceType?: "defi" | "wallet" | string;
    category?: string;
  }[];
  categories?: {
    category: string;
    sourceType?: "defi" | "wallet" | string;
    value: number;
    pnl: number;
  }[];
  chainsCount?: number;
}

export interface AssetAllocationPoint {
  date: string;
  btc: number;
  eth: number;
  stablecoin: number;
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
