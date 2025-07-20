// src/components/PortfolioAllocation/types.ts

export interface Protocol {
  id: string;
  name: string;
  allocationPercentage: number; // Percentage within its parent category
  chain: string; // e.g., 'Ethereum', 'Polygon', 'Arbitrum'
  tvl?: number; // Total Value Locked
  apy?: number; // Annual Percentage Yield
  riskScore?: number; // Risk assessment score (1-10)
}

export interface AssetCategory {
  id: string;
  name: string;
  protocols: Protocol[];
  color: string; // For consistent theming across charts
}

// Interface for the processed data that UI components will consume
export interface ProcessedAssetCategory extends AssetCategory {
  isExcluded: boolean;
  totalAllocationPercentage: number; // Overall percentage in the portfolio
  activeAllocationPercentage: number; // Percentage only among included categories
  totalValue: number; // Dollar value of this category
}

// Interface for chart data points (e.g., for Recharts PieChart)
export interface ChartDataPoint {
  name: string;
  value: number; // Allocation percentage
  id: string;
  color: string;
  isExcluded?: boolean; // Useful for visual styling in charts
}

// Context type for clarity
export interface ExcludedCategoriesContextType {
  excludedCategoryIds: string[];
  toggleCategoryExclusion: (categoryId: string) => void;
  addCategoryExclusion: (categoryId: string) => void;
  removeCategoryExclusion: (categoryId: string) => void;
  isExcluded: (categoryId: string) => boolean;
}

// UI Variation types
export type PortfolioVariationType =
  | "enhancedOverview"
  | "allocationBuilder"
  | "dashboardCards";

// Rebalance mode interfaces
export interface CategoryShift {
  categoryId: string;
  categoryName: string;
  currentPercentage: number;
  targetPercentage: number;
  changeAmount: number; // +/- percentage points
  changePercentage: number; // percentage of change relative to current
  action: "increase" | "decrease" | "maintain";
  actionDescription: string; // "Buy more", "Sell", "Maintain"
}

export interface RebalanceData {
  current: ProcessedAssetCategory[];
  target: ProcessedAssetCategory[];
  shifts: CategoryShift[];
  totalRebalanceValue: number; // Total dollar amount being rebalanced
}

export interface RebalanceMode {
  isEnabled: boolean;
  data?: RebalanceData;
}

export interface PortfolioAllocationContainerProps {
  variationType?: PortfolioVariationType;
  assetCategories: AssetCategory[];
  onZapAction?: (includedCategories: ProcessedAssetCategory[]) => void;
}
