/**
 * Portfolio Type Definitions
 *
 * Shared types for the wallet portfolio components to ensure
 * consistency and type safety across the component tree.
 */

import { History, LayoutDashboard, LineChart, type LucideIcon } from "lucide-react";

/** Modal types for portfolio actions */
export type ModalType = "deposit" | "withdraw" | "rebalance";

/** Navigation tab identifiers */
export type TabType = "dashboard" | "analytics" | "backtesting";

/** Tab configuration for navigation */
export interface TabConfig {
  id: TabType;
  label: string;
  icon: LucideIcon;
}

/** Available tabs in the portfolio navigation */
export const TABS: TabConfig[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "backtesting", label: "Backtesting", icon: History },
];
