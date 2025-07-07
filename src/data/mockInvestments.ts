import { InvestmentOpportunity, InvestmentStat } from "../types/investment";
import { Shield, Target, TrendingUp } from "lucide-react";

export const mockInvestmentOpportunities: InvestmentOpportunity[] = [
  {
    id: "1",
    name: "High Yield Stablecoin Strategy",
    apr: 12.5,
    risk: "Low",
    category: "Stablecoin",
    description: "Automated yield farming across multiple stablecoin protocols",
    tvl: "$2.5M",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "2",
    name: "ETH Liquid Staking Plus",
    apr: 8.2,
    risk: "Medium",
    category: "ETH",
    description:
      "Enhanced ETH staking with additional DeFi yield opportunities",
    tvl: "$5.8M",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "3",
    name: "Multi-Chain Arbitrage",
    apr: 15.8,
    risk: "Medium",
    category: "Multi-Chain",
    description: "Cross-chain arbitrage opportunities with automated execution",
    tvl: "$1.2M",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "optimize-portfolio",
    name: "Portfolio Optimization",
    apr: 0,
    risk: "Low",
    category: "Optimization",
    description:
      "Convert dust tokens and rebalance portfolio for maximum efficiency",
    tvl: "$0",
    color: "from-purple-600 to-blue-600",
  },
];

export const mockInvestmentStats: InvestmentStat[] = [
  { label: "Available Strategies", value: "12", icon: Target },
  { label: "Avg APR", value: "11.8%", icon: TrendingUp },
  { label: "Total TVL", value: "$15.2M", icon: Shield },
];
