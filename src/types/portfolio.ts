import { BarChart3, History, LayoutDashboard } from "lucide-react";

/**
 * Protocol definition for strategy and portfolio visualization
 */
export interface Protocol {
  id: string; // snapshot_id or constructed string
  name: string;
  allocationPercentage: number;
  chain: string;
  protocol?: string;
  tvl?: number;
  apy?: number;
  riskScore?: number;
  poolSymbols?: string[];
  aprConfidence?: string;
  aprBreakdown?: {
    total: number;
  };
  targetTokens?: string[];
}

/**
 * Asset Category for strategy and portfolio visualization
 */
export interface AssetCategory {
  id: string;
  name: string;
  color: string;
  description: string;
  targetAssets: string[];
  chains: string[];
  protocolCount: number;
  enabledProtocolCount: number;
  protocols: Protocol[];
}

/**
 * Available tabs in the portfolio view
 */
export type TabType = "dashboard" | "analytics" | "backtesting";

/**
 * Modal types for portfolio actions
 */
export type ModalType = "deposit" | "withdraw" | "rebalance";

/**
 * Tab configuration
 */
export const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "backtesting", label: "Backtesting", icon: History },
];
