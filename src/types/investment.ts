import { RiskLevel } from "./portfolio";

/**
 * Navigation context determines how the SwapPage behaves based on entry point
 * - 'invest': Default behavior, strategy is pre-selected (from InvestTab)
 * - 'zapIn': Shows strategy selector, user chooses where to invest
 * - 'zapOut': Shows position selector, user chooses what to exit from
 */
export type NavigationContext = "invest" | "zapIn" | "zapOut";

export interface InvestmentOpportunity {
  id: string;
  name: string;
  apr: number;
  risk: RiskLevel;
  category: string;
  description: string;
  tvl: string;
  color: string;
  /** Optional context for navigation behavior in SwapPage */
  navigationContext?: NavigationContext;
}

export interface InvestmentStat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}
