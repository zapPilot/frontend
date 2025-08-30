"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { InvestmentOpportunity } from "../../types/investment";
import { PortfolioAllocationContainer } from "../PortfolioAllocation";
import type {
  AssetCategory,
  OperationMode,
  PortfolioSwapAction,
} from "../PortfolioAllocation/types";
import { OptimizeTab } from "./OptimizeTab";
import { SwapPageHeader } from "./SwapPageHeader";
import { TabNavigation } from "./TabNavigation";

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

export interface SwapPageProps {
  strategy: InvestmentOpportunity;
  onBack: () => void;
}

export function SwapPage({ strategy, onBack }: SwapPageProps) {
  // Initialize operation mode based on navigation context
  const getInitialOperationMode = (): OperationMode => {
    if (strategy.navigationContext === "zapIn") return "zapIn";
    if (strategy.navigationContext === "zapOut") return "zapOut";
    if (strategy.navigationContext === "invest") return "rebalance";
    return "zapIn";
  };

  const [activeOperationMode, setActiveOperationMode] = useState<OperationMode>(
    getInitialOperationMode()
  );

  // Auto-enable rebalance mode when on optimize tab
  const [isRebalanceMode, setIsRebalanceMode] = useState(
    getInitialOperationMode() === "rebalance"
  );

  // Excluded categories state management
  const [excludedCategoryIds, setExcludedCategoryIds] = useState<string[]>([]);

  const toggleCategoryExclusion = useCallback((categoryId: string) => {
    setExcludedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  // Single-level navigation handler
  const handleOperationModeChange = (mode: OperationMode) => {
    setActiveOperationMode(mode);
    // Auto-enable rebalance mode for optimize tab, disable for others
    setIsRebalanceMode(mode === "rebalance");
  };

  const handleZapAction = (action: PortfolioSwapAction) => {
    // In a real implementation, this would:
    // 1. Validate user has sufficient balance
    // 2. Calculate optimal protocol routing
    // 3. Execute multi-protocol transactions
    // 4. Update portfolio state

    // For demo purposes, show an alert with the action details
    const categoryNames = action.includedCategories
      .map(cat => cat.name)
      .join(", ");
    const totalValue = action.includedCategories.reduce(
      (sum, cat) => sum + cat.totalValue,
      0
    );

    alert(
      `🚀 Zap Operation Initiated!\n\nMode: ${action.operationMode}\nCategories: ${categoryNames}\nTotal Value: $${totalValue.toLocaleString()}\nProtocols: ${action.includedCategories.reduce((sum, cat) => sum + cat.protocols.length, 0)}`
    );
  };

  const renderTabContent = () => {
    return (
      <div className="space-y-6">
        {/* Rebalance Operation with Optimization */}
        {activeOperationMode === "rebalance" ? (
          <>
            {/* Portfolio Allocation Container */}
            <PortfolioAllocationContainer
              assetCategories={MOCK_ASSET_CATEGORIES}
              operationMode={activeOperationMode}
              isRebalanceMode={isRebalanceMode}
              onZapAction={handleZapAction}
              excludedCategoryIds={excludedCategoryIds}
              onToggleCategoryExclusion={toggleCategoryExclusion}
            />

            {/* Integrated Optimization Tools */}
            <OptimizeTab />
          </>
        ) : (
          /* Zap In/Out Operations */
          <>
            {/* Portfolio Allocation Container */}
            <PortfolioAllocationContainer
              assetCategories={MOCK_ASSET_CATEGORIES}
              operationMode={activeOperationMode}
              isRebalanceMode={isRebalanceMode}
              onZapAction={handleZapAction}
              excludedCategoryIds={excludedCategoryIds}
              onToggleCategoryExclusion={toggleCategoryExclusion}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="swap-page">
      <SwapPageHeader strategy={strategy} onBack={onBack} />

      <TabNavigation
        activeOperationMode={activeOperationMode}
        onOperationModeChange={handleOperationModeChange}
      />

      <motion.div
        key={activeOperationMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[600px]"
        data-testid="tab-content"
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
}
