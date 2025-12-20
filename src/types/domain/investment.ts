import { RiskLevel } from "./risk";

/**
 * Navigation context determines how the SwapPage behaves based on entry point
 * - 'invest': Default behavior, strategy is pre-selected (from portfolio optimization)
 * - 'zapIn': Shows strategy selector, user chooses where to invest
 * - 'zapOut': Shows position selector, user chooses what to exit from
 */
type NavigationContext = "invest" | "zapIn" | "zapOut";

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
