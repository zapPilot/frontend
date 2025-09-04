import { InvestmentOpportunity } from "../types/investment";

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
  {
    id: "zap-in",
    name: "ZapIn Strategy",
    apr: 0,
    risk: "Low",
    category: "Zap",
    description:
      "Quickly deposit funds into multiple DeFi protocols with optimal routing",
    tvl: "$0",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "zap-out",
    name: "ZapOut Strategy",
    apr: 0,
    risk: "Low",
    category: "Zap",
    description:
      "Efficiently withdraw and consolidate funds from multiple DeFi positions",
    tvl: "$0",
    color: "from-red-500 to-rose-600",
  },
];
