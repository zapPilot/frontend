"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { InvestmentOpportunity } from "../../types/investment";
import { PortfolioAllocationContainer } from "../PortfolioAllocation";
import type {
  OperationMode,
  PortfolioSwapAction,
} from "../PortfolioAllocation/types";
import { SwapPageHeader } from "./SwapPageHeader";
import { TabNavigation } from "./TabNavigation";
import { useStrategiesWithPortfolioData } from "../../hooks/queries/useStrategiesQuery";
import { useUser } from "../../contexts/UserContext";


export interface SwapPageProps {
  strategy: InvestmentOpportunity;
  onBack: () => void;
}

export function SwapPage({ strategy, onBack }: SwapPageProps) {
  // Get current user for portfolio data
  const { userInfo } = useUser();

  // Fetch strategies data with real portfolio data from API
  const {
    strategies,
    isError,
    error,
    isInitialLoading,
    refetch,
    hasPoolData,
    totalProtocols,
  } = useStrategiesWithPortfolioData(userInfo?.id);

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

    // Use real protocol count data from API instead of mock protocols array
    const totalProtocolCount = action.includedCategories.reduce(
      (sum, cat) => sum + (cat.enabledProtocolCount || 0), 
      0
    );

    alert(
      `🚀 Zap Operation Initiated!\n\nMode: ${action.operationMode}\nCategories: ${categoryNames}\nTotal Value: $${totalValue.toLocaleString()}\nProtocols: ${totalProtocolCount}`
    );
  };

  const renderTabContent = () => {
    // Show loading state
    if (isInitialLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading strategies...</p>
            </div>
          </div>
        </div>
      );
    }

    // Show error state
    if (isError) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to Load Strategies
              </h3>
              <p className="text-gray-600 mb-4">
                {error?.message || "Unable to fetch portfolio strategies"}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Show strategies content
    return (
      <div className="space-y-6">
        {/* Rebalance Operation with Optimization */}
        {activeOperationMode === "rebalance" ? (
          <>
            {/* Portfolio Allocation Container */}
            <PortfolioAllocationContainer
              assetCategories={strategies}
              operationMode={activeOperationMode}
              isRebalanceMode={isRebalanceMode}
              onZapAction={handleZapAction}
              excludedCategoryIds={excludedCategoryIds}
              onToggleCategoryExclusion={toggleCategoryExclusion}
            />
          </>
        ) : (
          /* Zap In/Out Operations */
          <>
            {/* Portfolio Allocation Container */}
            <PortfolioAllocationContainer
              assetCategories={strategies}
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
