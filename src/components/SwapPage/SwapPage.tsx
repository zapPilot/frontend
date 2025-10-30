"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { isChainSupported, SUPPORTED_CHAINS } from "../../config/chains";
import { useUser } from "../../contexts/UserContext";
import { useChain } from "@/hooks/useChain";
import { useStrategiesWithPortfolioData } from "../../hooks/queries/useStrategiesQuery";
import { formatCurrency } from "../../lib/formatters";
import {
  executeUnifiedZap,
  type UnifiedZapRequest,
} from "../../services/intentService";
import { InvestmentOpportunity } from "../../types/investment";
import { swapLogger } from "../../utils/logger";
import { PortfolioAllocationContainer } from "../PortfolioAllocation";
import type {
  OperationMode,
  PortfolioSwapAction,
} from "../PortfolioAllocation/types";
import { ZapExecutionProgress } from "../shared/ZapExecutionProgress";
import { SwapPageHeader } from "./SwapPageHeader";
import { TabNavigation } from "./TabNavigation";

export interface SwapPageProps {
  strategy: InvestmentOpportunity;
  onBack: () => void;
}

export function SwapPage({ strategy, onBack }: SwapPageProps) {
  // Get current user for portfolio data
  const { userInfo, connectedWallet } = useUser();

  // Get current chain for token operations
  const { chain } = useChain();

  // Fetch strategies data with real portfolio data from API
  const { strategies, isError, error, isInitialLoading, refetch } =
    useStrategiesWithPortfolioData(userInfo?.userId);

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

  // UnifiedZap execution state management
  const [zapExecution, setZapExecution] = useState<{
    intentId: string;
    isExecuting: boolean;
    totalValue: number;
    strategyCount: number;
    chainId: number;
    error?: string;
  } | null>(null);

  // Single-level navigation handler
  const handleOperationModeChange = (mode: OperationMode) => {
    setActiveOperationMode(mode);
    // Auto-enable rebalance mode for optimize tab, disable for others
    setIsRebalanceMode(mode === "rebalance");
  };

  // Transform PortfolioSwapAction to UnifiedZapRequest
  const transformToUnifiedZapRequest = useCallback(
    (
      action: PortfolioSwapAction,
      userAddress: string,
      chainId: number
    ): UnifiedZapRequest => {
      const strategyAllocations = action.includedCategories.map(category => ({
        strategyId: category.id,
        percentage: category.activeAllocationPercentage,
      }));
      // Ensure we have a valid token address - throw error if missing
      const inputToken = action.swapSettings.fromToken?.address;
      if (!inputToken) {
        throw new Error(
          "Input token address is required for UnifiedZap execution"
        );
      }

      // Ensure inputAmount is a valid positive integer string (no decimals)
      const rawAmount = action.swapSettings.amount || "0";
      const inputAmount = rawAmount.toString();
      if (parseFloat(inputAmount) <= 0) {
        throw new Error("Input amount must be a positive value");
      }

      return {
        userAddress,
        chainId,
        params: {
          strategyAllocations,
          inputToken,
          inputAmount,
          slippage: action.swapSettings.slippageTolerance || 0.5,
        },
      };
    },
    []
  );

  const handleZapAction = useCallback(
    async (action: PortfolioSwapAction) => {
      if (!connectedWallet || !chain?.id) {
        swapLogger.error(
          "Missing connected wallet address or chain ID for UnifiedZap execution"
        );
        return;
      }

      // Calculate totals for progress tracking
      const totalValue = action.includedCategories.reduce(
        (sum, cat) => sum + cat.totalValue,
        0
      );
      const strategyCount = action.includedCategories.length;

      // Validate chain is supported before proceeding
      if (!isChainSupported(chain.id)) {
        const supportedChainNames = SUPPORTED_CHAINS.map(
          c => `${c.name} (${c.id})`
        ).join(", ");

        swapLogger.error(
          `Unsupported chain ${chain.id}. Supported: ${supportedChainNames}`
        );

        // Set error state instead of proceeding
        setZapExecution({
          intentId: "",
          isExecuting: false,
          totalValue,
          strategyCount,
          chainId: chain.id,
          error: `Chain ${chain.id} is not supported. Please switch to: ${supportedChainNames}`,
        });
        return; // Fail fast - don't call API
      }

      try {
        // Set initial executing state
        setZapExecution({
          intentId: "",
          isExecuting: true,
          totalValue,
          strategyCount,
          chainId: chain.id,
        });

        swapLogger.debug("Executing UnifiedZap with action", action);

        // Transform to API request format
        const zapRequest = transformToUnifiedZapRequest(
          action,
          connectedWallet,
          chain.id
        );

        swapLogger.debug("Sending UnifiedZap request", zapRequest);

        // Execute UnifiedZap intent
        const response = await executeUnifiedZap(zapRequest);

        swapLogger.info("UnifiedZap initiated", response);

        // Update state with intent ID for stream tracking
        setZapExecution({
          intentId: response.intentId,
          isExecuting: true,
          totalValue,
          strategyCount,
          chainId: chain.id,
        });
      } catch (error) {
        swapLogger.error("UnifiedZap execution error", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        setZapExecution({
          intentId: "",
          isExecuting: false,
          totalValue,
          strategyCount,
          chainId: chain.id,
          error: errorMessage,
        });
      }
    },
    [connectedWallet, chain?.id, transformToUnifiedZapRequest]
  );

  // Handle execution completion
  const handleExecutionComplete = useCallback(() => {
    swapLogger.info("UnifiedZap execution completed successfully");

    setZapExecution(prev => (prev ? { ...prev, isExecuting: false } : null));

    // Optionally refresh strategies data to reflect new positions
    refetch();
  }, [refetch]);

  // Handle execution error
  const handleExecutionError = useCallback((error: string) => {
    swapLogger.error("UnifiedZap execution failed", error);

    setZapExecution(prev =>
      prev ? { ...prev, isExecuting: false, error } : null
    );
  }, []);

  // Handle execution cancellation
  const handleExecutionCancel = useCallback(() => {
    swapLogger.info("UnifiedZap execution cancelled by user");

    setZapExecution(null);
  }, []);

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
        {/* UnifiedZap Execution Progress - Only render when we have valid intentId AND chainId */}
        {zapExecution?.intentId && zapExecution?.chainId && (
          <ZapExecutionProgress
            isOpen={true}
            onClose={handleExecutionCancel}
            intentId={zapExecution.intentId}
            chainId={zapExecution.chainId}
            totalValue={zapExecution.totalValue}
            strategyCount={zapExecution.strategyCount}
            onComplete={handleExecutionComplete}
            onError={handleExecutionError}
            onCancel={handleExecutionCancel}
          />
        )}

        {/* Execution Error Display (when no intent ID) */}
        {zapExecution && zapExecution.error && !zapExecution.intentId && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">❌</span>
              <h4 className="font-medium text-red-800">Execution Failed</h4>
            </div>
            <p className="text-sm text-red-700 mt-2">{zapExecution.error}</p>
            <button
              onClick={() => setZapExecution(null)}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Portfolio Allocation Interface */}
        {!zapExecution?.isExecuting && (
          <PortfolioAllocationContainer
            assetCategories={strategies}
            operationMode={activeOperationMode}
            isRebalanceMode={isRebalanceMode}
            onZapAction={handleZapAction}
            excludedCategoryIds={excludedCategoryIds}
            onToggleCategoryExclusion={toggleCategoryExclusion}
            {...(chain?.id !== undefined ? { chainId: chain.id } : {})}
          />
        )}

        {/* Execution Loading State */}
        {zapExecution?.isExecuting && !zapExecution.intentId && (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Initiating UnifiedZap execution...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {formatCurrency(zapExecution.totalValue)} •{" "}
                {zapExecution.strategyCount} strategies
              </p>
            </div>
          </div>
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
