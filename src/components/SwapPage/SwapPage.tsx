"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { InvestmentOpportunity } from "../../types/investment";
import { PortfolioAllocationContainer } from "../PortfolioAllocation";
import type {
  AssetCategory,
  OperationMode,
  PortfolioSwapAction,
} from "../PortfolioAllocation/types";
import { SwapPageHeader } from "./SwapPageHeader";
import { TabNavigation } from "./TabNavigation";
import { RebalanceOptimizationPanel } from "./RebalanceOptimizationPanel";

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
  // Single-layer state management
  const [activeOperationMode, setActiveOperationMode] =
    useState<OperationMode>("zapIn");
  const [isRebalanceMode, setIsRebalanceMode] = useState(false);
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(false);

  // Single-level navigation handler
  const handleOperationModeChange = (mode: OperationMode) => {
    setActiveOperationMode(mode);
    // Reset rebalance and optimization modes when changing operation mode
    if (mode !== "rebalance") {
      setIsRebalanceMode(false);
      setIsOptimizationEnabled(false);
    }
  };

  const handleZapAction = (action: PortfolioSwapAction) => {
    // eslint-disable-next-line no-console
    console.log("Zap action triggered:", action);

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
        {/* Rebalance Mode Controls (only for rebalance operation) */}
        {activeOperationMode === "rebalance" && (
          <div className="space-y-4">
            {/* Basic Rebalance Toggle */}
            <div className="bg-gray-900/30 rounded-2xl border border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-medium text-white">
                    Show Rebalance Preview
                  </h5>
                  <p className="text-xs text-gray-400 mt-1">
                    Compare current vs. target allocations
                  </p>
                </div>
                <button
                  onClick={() => setIsRebalanceMode(!isRebalanceMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isRebalanceMode ? "bg-purple-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isRebalanceMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Advanced Optimization Panel */}
            <RebalanceOptimizationPanel
              isEnabled={isOptimizationEnabled}
              onToggle={setIsOptimizationEnabled}
            />
          </div>
        )}

        {/* Portfolio Allocation Container */}
        <PortfolioAllocationContainer
          assetCategories={MOCK_ASSET_CATEGORIES}
          operationMode={activeOperationMode}
          isRebalanceMode={isRebalanceMode}
          onZapAction={handleZapAction}
        />
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
