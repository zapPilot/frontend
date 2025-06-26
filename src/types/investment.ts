import { RiskLevel } from "./portfolio";

export interface InvestmentOpportunity {
  id: string;
  name: string;
  apr: number;
  risk: RiskLevel;
  category: string;
  description: string;
  tvl: string;
  color: string;
}

export interface InvestmentStat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}
