"use client";

import { useCallback, useMemo, useState } from "react";
import { GlassCard, GradientButton } from "../ui";
import { SlippageSelector } from "./SlippageSelector";

export interface OptimizationOptions {
  convertDust: boolean;
  rebalancePortfolio: boolean;
  slippage: number;
}

export function OptimizeTab() {
  // State for optimization options
  const [optimizationOptions, setOptimizationOptions] =
    useState<OptimizationOptions>({
      convertDust: true, // Default: both selected
      rebalancePortfolio: true,
      slippage: 30,
    });

  // State for workflow
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Mock data - in real app this would come from API/hooks
  const mockOptimizationData = useMemo(
    () => ({
      dustValue: 42.85,
      dustTokenCount: 12,
      rebalanceActions: 3,
      chainCount: 2,
      totalSavings: 15.2,
      estimatedGasSavings: 0.003,
    }),
    []
  );

  const handleOptimize = useCallback(() => {
    if (
      !optimizationOptions.convertDust &&
      !optimizationOptions.rebalancePortfolio
    ) {
      return;
    }

    setIsOptimizing(true);
    // In real app, this would trigger the optimization flow
    // Extended duration to show progress
    setTimeout(() => {
      setIsOptimizing(false);
    }, 12000);
  }, [optimizationOptions]);

  const getOptimizeButtonText = useCallback(() => {
    const { convertDust, rebalancePortfolio } = optimizationOptions;

    if (convertDust && rebalancePortfolio) {
      return "Optimize Portfolio (Convert + Rebalance)";
    } else if (convertDust) {
      return "Convert Dust to ETH";
    } else if (rebalancePortfolio) {
      return "Rebalance Portfolio";
    }
    return "Select Optimization";
  }, [optimizationOptions]);

  const selectedCount = useMemo(() => {
    return (
      (optimizationOptions.convertDust ? 1 : 0) +
      (optimizationOptions.rebalancePortfolio ? 1 : 0)
    );
  }, [optimizationOptions]);

  const renderCardsVariation = () => (
    <div className="space-y-6" data-testid="optimize-tab-cards">
      <div className="text-center">
        <h3 className="text-2xl font-bold gradient-text mb-2">
          Portfolio Optimization
        </h3>
        <p className="text-gray-400">
          Choose optimization methods for your portfolio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dust Conversion Card */}
        <div
          className={`cursor-pointer transition-all duration-300 ${
            optimizationOptions.convertDust
              ? "ring-2 ring-blue-500"
              : "hover:ring-1 hover:ring-gray-600"
          }`}
          onClick={() =>
            setOptimizationOptions(prev => ({
              ...prev,
              convertDust: !prev.convertDust,
            }))
          }
        >
          <GlassCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">
                  Dust Conversion
                </h4>
                <div
                  className={`w-6 h-6 rounded-full border-2 ${
                    optimizationOptions.convertDust
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-600"
                  }`}
                >
                  {optimizationOptions.convertDust && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-400 text-sm">
                Convert {mockOptimizationData.dustTokenCount} small token
                balances to ETH
              </p>

              <div className="bg-gray-900/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">
                  ${mockOptimizationData.dustValue}
                </div>
                <div className="text-sm text-gray-400">Total Dust Value</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Portfolio Rebalance Card */}
        <div
          className={`cursor-pointer transition-all duration-300 ${
            optimizationOptions.rebalancePortfolio
              ? "ring-2 ring-purple-500"
              : "hover:ring-1 hover:ring-gray-600"
          }`}
          onClick={() =>
            setOptimizationOptions(prev => ({
              ...prev,
              rebalancePortfolio: !prev.rebalancePortfolio,
            }))
          }
        >
          <GlassCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">
                  Portfolio Rebalance
                </h4>
                <div
                  className={`w-6 h-6 rounded-full border-2 ${
                    optimizationOptions.rebalancePortfolio
                      ? "bg-purple-500 border-purple-500"
                      : "border-gray-600"
                  }`}
                >
                  {optimizationOptions.rebalancePortfolio && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-400 text-sm">
                Optimize allocation across {mockOptimizationData.chainCount}{" "}
                chains
              </p>

              <div className="bg-gray-900/50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-500">
                  {mockOptimizationData.rebalanceActions}
                </div>
                <div className="text-sm text-gray-400">Rebalance Actions</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Slippage and Execute */}
      <GlassCard>
        <div className="space-y-4">
          <SlippageSelector
            slippage={optimizationOptions.slippage}
            onChange={slippage =>
              setOptimizationOptions(prev => ({ ...prev, slippage }))
            }
          />

          <GradientButton
            disabled={selectedCount === 0 || isOptimizing}
            gradient="from-purple-600 to-blue-600"
            className="w-full py-4"
            onClick={handleOptimize}
          >
            {isOptimizing ? "Optimizing..." : getOptimizeButtonText()}
          </GradientButton>
        </div>
      </GlassCard>
    </div>
  );

  return renderCardsVariation();
}
