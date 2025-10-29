// src/components/PortfolioAllocation/types.ts

import { SwapToken } from "../../types/swap";

export interface Protocol {
  id: string;
  name: string;
  allocationPercentage: number; // Percentage within its parent category
  chain: string; // e.g., 'Ethereum', 'Polygon', 'Arbitrum'
  protocol?: string; // Protocol identifier from API (e.g., 'aave-v3', 'uniswap-v3')
  tvl?: number; // Total Value Locked
  apy?: number; // Annual Percentage Yield
  riskScore?: number; // Risk assessment score (1-10)
  // Enhanced pool data
  poolSymbols?: string[]; // Token symbols in the pool
  aprConfidence?: "high" | "medium" | "low"; // APR data reliability
  aprBreakdown?: {
    base?: number; // Base APR
    reward?: number; // Reward APR
    total: number; // Total APR
    updatedAt?: string; // Last update timestamp
  };
  // Strategy protocol targets (from intent service)
  targetTokens?: string[];
}

export interface AssetCategory {
  id: string;
  name: string;
  protocols: Protocol[]; // Restored for individual pool position rows
  color: string; // For consistent theming across charts
  // Real API data from strategies endpoint
  description?: string;
  targetAssets?: string[]; // e.g., ['USDC', 'USDT', 'DAI']
  chains?: string[]; // e.g., ['arbitrum', 'base', 'optimism']
  protocolCount?: number; // Total protocols available
  enabledProtocolCount?: number; // Currently active protocols
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

// UI Variation types
export type PortfolioVariationType = "enhancedOverview";

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

// Operation mode types for enhanced swap functionality
export type OperationMode = "zapIn" | "zapOut" | "rebalance";

export interface SwapSettings {
  fromToken?: SwapToken; // For zapIn operations
  toToken?: SwapToken; // For zapOut operations
  amount: string;
  slippageTolerance: number; // Percentage (see SLIPPAGE_CONFIG in constants/slippage.ts)
  priceImpact?: number; // Calculated price impact
  minimumReceived?: string; // Minimum tokens received after slippage
  // Optimization options (only for rebalance mode)
  optimizationOptions?: {
    dustZap: boolean;
    rebalance: boolean;
  };
}

export interface OperationConfig {
  mode: OperationMode;
  swapSettings: SwapSettings;
  isEnabled: boolean;
}

// SlippagePreset interface is now exported from useSlippage hook

export interface SwapValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PortfolioSwapAction {
  operationMode: OperationMode;
  includedCategories: ProcessedAssetCategory[];
  swapSettings: SwapSettings;
  rebalanceData?: RebalanceData;
}

export interface PortfolioAllocationContainerProps {
  variationType?: PortfolioVariationType;
  assetCategories: AssetCategory[];
  operationMode?: OperationMode;
  isRebalanceMode?: boolean;
  onZapAction?: (action: PortfolioSwapAction) => void;
  excludedCategoryIds: string[];
  onToggleCategoryExclusion: (categoryId: string) => void;
  chainId?: number;
}
