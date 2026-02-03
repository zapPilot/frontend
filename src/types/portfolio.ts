import {
  BarChart3,
  Compass,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

/**
 * Available tabs in the portfolio view
 */
export type TabType = "dashboard" | "analytics" | "strategy";

/**
 * Sub-tabs within the Strategy view
 */
export type StrategySubTab = "suggestion" | "backtesting";

/**
 * Modal types for portfolio actions
 */
export type ModalType = "deposit" | "withdraw" | "rebalance";

/**
 * Tab configuration
 */
export const TABS: { id: TabType; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "strategy", label: "Strategy", icon: Compass },
];
