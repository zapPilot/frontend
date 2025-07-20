"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { MOCK_TOKENS } from "../../constants/swap";
import { mockInvestmentOpportunities } from "../../data/mockInvestments";
import { useStrategyPortfolio } from "../../hooks/useStrategyPortfolio";
import { InvestmentOpportunity } from "../../types/investment";
import { SwapToken } from "../../types/swap";
import { PortfolioAllocationContainer } from "../PortfolioAllocation";
import type {
  AssetCategory,
  ProcessedAssetCategory,
} from "../PortfolioAllocation/types";
import { DetailsTab } from "./DetailsTab";
import { OptimizeTab } from "./OptimizeTab";
import { PerformanceTab } from "./PerformanceTab";
import { StrategySelectorModal } from "./StrategySelectorModal";
import { SwapPageHeader } from "./SwapPageHeader";
import { TabNavigation, TabType } from "./TabNavigation";
import { TokenSelectorModal } from "./TokenSelectorModal";

// Mock asset categories for portfolio allocation
const MOCK_ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: "btc",
    name: "BTC",
    color: "#F59E0B",
    protocols: [
      {
        id: "btc-1",
        name: "Compound BTC",
        allocationPercentage: 40,
        chain: "Ethereum",
        apy: 3.2,
        tvl: 120000,
      },
      {
        id: "btc-2",
        name: "Aave WBTC",
        allocationPercentage: 35,
        chain: "Ethereum",
        apy: 2.8,
        tvl: 85000,
      },
      {
        id: "btc-3",
        name: "Curve WBTC",
        allocationPercentage: 25,
        chain: "Polygon",
        apy: 4.1,
        tvl: 65000,
      },
    ],
  },
  {
    id: "eth",
    name: "ETH",
    color: "#8B5CF6",
    protocols: [
      {
        id: "eth-1",
        name: "Lido Staking",
        allocationPercentage: 50,
        chain: "Ethereum",
        apy: 5.2,
        tvl: 250000,
      },
      {
        id: "eth-2",
        name: "Rocket Pool",
        allocationPercentage: 30,
        chain: "Ethereum",
        apy: 4.8,
        tvl: 180000,
      },
      {
        id: "eth-3",
        name: "Frax ETH",
        allocationPercentage: 20,
        chain: "Arbitrum",
        apy: 5.5,
        tvl: 95000,
      },
    ],
  },
  {
    id: "stablecoins",
    name: "Stablecoins",
    color: "#10B981",
    protocols: [
      {
        id: "stable-1",
        name: "USDC Compound",
        allocationPercentage: 45,
        chain: "Ethereum",
        apy: 2.5,
        tvl: 320000,
      },
      {
        id: "stable-2",
        name: "DAI Aave",
        allocationPercentage: 30,
        chain: "Polygon",
        apy: 3.1,
        tvl: 210000,
      },
      {
        id: "stable-3",
        name: "USDT Curve",
        allocationPercentage: 25,
        chain: "Arbitrum",
        apy: 2.8,
        tvl: 175000,
      },
    ],
  },
];

interface SwapPageProps {
  strategy: InvestmentOpportunity;
  onBack: () => void;
}

export function SwapPage({ strategy, onBack }: SwapPageProps) {
  const [fromToken, setFromToken] = useState<SwapToken>(MOCK_TOKENS[0]!);
  console.log("fromToken", fromToken);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(
    strategy.id === "optimize-portfolio" ? "optimize" : "allocation"
  );

  const { portfolioData, expandedCategory, toggleCategoryExpansion } =
    useStrategyPortfolio(strategy.id);

  const handleTokenSelect = (token: SwapToken) => {
    setFromToken(token);
    setShowTokenSelector(false);
  };

  const handleStrategySelect = (selectedStrategy: InvestmentOpportunity) => {
    // Strategy selection logic - for now just log and close modal
    // In a real app, this would update the selected strategy state
    // eslint-disable-next-line no-console
    console.log("Strategy selected:", selectedStrategy);
    setShowStrategySelector(false);
  };

  const handleZapAction = (includedCategories: ProcessedAssetCategory[]) => {
    // eslint-disable-next-line no-console
    console.log("Zap action triggered with categories:", includedCategories);

    // In a real implementation, this would:
    // 1. Validate user has sufficient balance
    // 2. Calculate optimal protocol routing
    // 3. Execute multi-protocol transactions
    // 4. Update portfolio state

    // For demo purposes, show an alert with the action details
    const categoryNames = includedCategories.map(cat => cat.name).join(", ");
    const totalValue = includedCategories.reduce(
      (sum, cat) => sum + cat.totalValue,
      0
    );

    alert(
      `🚀 Zap Operation Initiated!\n\nCategories: ${categoryNames}\nTotal Value: $${totalValue.toLocaleString()}\nProtocols: ${includedCategories.reduce((sum, cat) => sum + cat.protocols.length, 0)}`
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "allocation":
        return (
          <div className="space-y-6">
            {/* Portfolio Allocation Component */}
            <PortfolioAllocationContainer
              assetCategories={MOCK_ASSET_CATEGORIES}
              onZapAction={handleZapAction}
            />
          </div>
        );
      case "performance":
        return <PerformanceTab />;
      case "details":
        return (
          <DetailsTab
            strategy={strategy}
            portfolioData={portfolioData}
            expandedCategory={expandedCategory}
            onCategoryToggle={toggleCategoryExpansion}
          />
        );
      case "optimize":
        return <OptimizeTab strategy={strategy} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="swap-page">
      <SwapPageHeader strategy={strategy} onBack={onBack} />

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[600px]"
        data-testid="tab-content"
      >
        {renderTabContent()}
      </motion.div>

      {showTokenSelector && (
        <TokenSelectorModal
          tokens={MOCK_TOKENS}
          onTokenSelect={handleTokenSelect}
          onClose={() => setShowTokenSelector(false)}
        />
      )}

      {showStrategySelector && (
        <StrategySelectorModal
          strategies={mockInvestmentOpportunities}
          onStrategySelect={handleStrategySelect}
          onClose={() => setShowStrategySelector(false)}
          title={
            strategy.navigationContext === "zapOut"
              ? "Select Position to Exit"
              : "Select Strategy to Invest"
          }
          description={
            strategy.navigationContext === "zapOut"
              ? "Choose a vault position to withdraw from"
              : "Choose a vault strategy to invest in"
          }
        />
      )}
    </div>
  );
}
