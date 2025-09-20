"use client";

import { useState } from "react";
import { EnhancedOverview, SwapControls } from "./components";
import { usePortfolioData, useRebalanceData } from "./hooks";
import {
  PortfolioAllocationContainerProps,
  PortfolioSwapAction,
  SwapSettings,
} from "./types";

export const PortfolioAllocationContainer: React.FC<
  PortfolioAllocationContainerProps
> = ({
  assetCategories,
  operationMode = "zapIn",
  isRebalanceMode = false,
  onZapAction,
  excludedCategoryIds,
  onToggleCategoryExclusion,
  chainId,
}) => {
  const [swapSettings, setSwapSettings] = useState<SwapSettings>({
    amount: "",
    slippageTolerance: 0.5, // Default 0.5%
  });

  const { processedCategories, chartData } = usePortfolioData(
    assetCategories,
    excludedCategoryIds
  );

  const rebalanceData = useRebalanceData(processedCategories, isRebalanceMode);

  // Enhanced zap action handler
  const handleEnhancedZapAction = () => {
    const includedCategories = processedCategories.filter(
      cat => !cat.isExcluded
    );

    const portfolioSwapAction: PortfolioSwapAction = {
      operationMode,
      includedCategories,
      swapSettings,
      ...(isRebalanceMode && rebalanceData ? { rebalanceData } : {}),
    };

    onZapAction?.(portfolioSwapAction);
  };

  // Prepare data for EnhancedOverview
  const rebalanceMode = {
    isEnabled: isRebalanceMode,
    ...(rebalanceData ? { data: rebalanceData } : {}),
  };

  const includedCategories = processedCategories.filter(cat => !cat.isExcluded);

  // Common SwapControls props
  const swapControlsProps = {
    operationMode,
    swapSettings,
    onSwapSettingsChange: setSwapSettings,
    includedCategories,
    ...(chainId !== undefined ? { chainId } : {}),
  };

  return (
    <div data-testid="portfolio-allocation-container" className="space-y-4">
      <EnhancedOverview
        processedCategories={processedCategories}
        chartData={chartData}
        rebalanceMode={rebalanceMode}
        onZapAction={handleEnhancedZapAction}
        swapControls={<SwapControls {...swapControlsProps} />}
        operationMode={operationMode}
        excludedCategoryIds={excludedCategoryIds}
        onToggleCategoryExclusion={onToggleCategoryExclusion}
      />
    </div>
  );
};
