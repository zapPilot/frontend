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
}

export type RiskLevel = "Low" | "Medium" | "High";
export type AssetType =
  | "Staking"
  | "Lending"
  | "Liquidity Pool"
  | "Holding"
  | "Safety Module"
  | "Liquid Staking";
