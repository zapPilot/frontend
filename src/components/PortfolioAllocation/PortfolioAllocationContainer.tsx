"use client";

import {
  DEFAULT_CATEGORY_WEIGHTS,
  DEFAULT_PORTFOLIO_TOTAL_VALUE,
  MAX_ALLOCATION_PERCENT,
  MIN_ALLOCATION_PERCENT,
} from "@/constants/portfolio-allocation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EnhancedOverview, SwapControls } from "./components";
import type { SwapControlsRef } from "./components/SwapControls";
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
  const swapControlsRef = useRef<SwapControlsRef>(null);
  const [swapSettings, setSwapSettings] = useState<SwapSettings>({
    amount: "",
    slippageTolerance: 0.5, // Default 0.5%
  });

  const getInitialAllocations = useMemo(() => {
    if (assetCategories.length === 0) {
      return {} as Record<string, number>;
    }

    const curatedEntries = assetCategories.map(category => {
      const curated = DEFAULT_CATEGORY_WEIGHTS[category.id];
      return [category.id, curated] as const;
    });

    const allocations: Record<string, number> = {};
    let curatedTotal = 0;
    curatedEntries.forEach(([id, value]) => {
      if (value !== undefined) {
        allocations[id] = value;
        curatedTotal += value;
      }
    });

    const remainingCategories = assetCategories.filter(
      category => allocations[category.id] === undefined
    );

    const remainingBudget = Math.max(0, 100 - curatedTotal);
    const fallbackValue =
      remainingCategories.length > 0
        ? remainingBudget / remainingCategories.length
        : 0;

    remainingCategories.forEach(category => {
      allocations[category.id] = fallbackValue;
    });

    const total = Object.values(allocations).reduce(
      (sum, value) => sum + value,
      0
    );
    if (total === 0) {
      const equalShare = 100 / Math.max(assetCategories.length, 1);
      assetCategories.forEach(category => {
        allocations[category.id] = equalShare;
      });
      return allocations;
    }

    // Normalize allocations to sum to 100
    return Object.entries(allocations).reduce(
      (acc, [id, value]) => {
        acc[id] = (value / total) * 100;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [assetCategories]);

  const [categoryAllocations, setCategoryAllocations] = useState<
    Record<string, number>
  >(getInitialAllocations);

  useEffect(() => {
    setCategoryAllocations(getInitialAllocations);
  }, [getInitialAllocations]);

  const portfolioDataOptions = useMemo(
    () => ({
      allocationOverrides: categoryAllocations,
      totalPortfolioValue: DEFAULT_PORTFOLIO_TOTAL_VALUE,
    }),
    [categoryAllocations]
  );

  const { processedCategories, chartData } = usePortfolioData(
    assetCategories,
    excludedCategoryIds,
    portfolioDataOptions
  );

  const rebalanceData = useRebalanceData(processedCategories, isRebalanceMode);

  const handleAllocationChange = (categoryId: string, value: number) => {
    setCategoryAllocations(prev => {
      const next = { ...prev };
      next[categoryId] = Math.max(
        MIN_ALLOCATION_PERCENT,
        Math.min(MAX_ALLOCATION_PERCENT, value)
      );
      return next;
    });
  };

  // Enhanced zap action handler
  const handleEnhancedZapAction = () => {
    // Trigger validation attempt first
    swapControlsRef.current?.attemptValidation();

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

  const parsedAmount = Number.parseFloat(swapSettings.amount || "");
  const hasPositiveAmount =
    operationMode === "rebalance"
      ? true
      : Number.isFinite(parsedAmount) && parsedAmount > 0;

  const hasRequiredToken = (() => {
    if (operationMode === "zapIn") {
      return Boolean(swapSettings.fromToken);
    }

    if (operationMode === "zapOut") {
      return Boolean(swapSettings.toToken);
    }

    return true;
  })();

  const isActionEnabled = hasRequiredToken && hasPositiveAmount;

  let actionDisabledReason: string | undefined;
  if (!isActionEnabled && operationMode !== "rebalance") {
    const needsTokenMessage = !hasRequiredToken
      ? operationMode === "zapOut"
        ? "select a token to receive"
        : "select a token to zap in"
      : undefined;
    const needsAmountMessage = !hasPositiveAmount
      ? "enter an amount"
      : undefined;

    const missingMessages = [needsTokenMessage, needsAmountMessage].filter(
      Boolean
    ) as string[];

    if (missingMessages.length > 0) {
      actionDisabledReason = `Please ${missingMessages.join(" and ")}.`;
    }
  }

  // Common SwapControls props
  const swapControlsProps = {
    ref: swapControlsRef,
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
        allocations={categoryAllocations}
        onAllocationChange={handleAllocationChange}
        actionEnabled={isActionEnabled}
        {...(actionDisabledReason ? { actionDisabledReason } : {})}
      />
    </div>
  );
};
