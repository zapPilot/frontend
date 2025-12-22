export interface PieChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
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

// ChartPeriod interface removed - unused (2025-12-22)
