"use client";

import { useState, useCallback, useMemo } from "react";
import { Settings, Zap, TrendingUp, ArrowDownLeft } from "lucide-react";
import { InvestmentOpportunity } from "../../types/investment";
import { GlassCard, GradientButton } from "../ui";
import { OptimizationSelector } from "./OptimizationSelector";
import { OptimizationPreview } from "./OptimizationPreview";
import { OptimizationProgress } from "./OptimizationProgress";
import { SlippageSelector } from "./SlippageSelector";

interface OptimizeTabProps {
  strategy: InvestmentOpportunity;
}

export interface OptimizationOptions {
  convertDust: boolean;
  rebalancePortfolio: boolean;
  slippage: number;
}

export type OptimizeUIVariation = "unified" | "wizard" | "cards";

export function OptimizeTab({ strategy }: OptimizeTabProps) {
  // UI Variation Control - can be changed to test different layouts
  const [uiVariation] = useState<OptimizeUIVariation>("unified");

  // State for optimization options
  const [optimizationOptions, setOptimizationOptions] =
    useState<OptimizationOptions>({
      convertDust: true, // Default: both selected
      rebalancePortfolio: true,
      slippage: 30,
    });

  // State for workflow
  const [currentStep, setCurrentStep] = useState<
    "selection" | "preview" | "execution"
  >("selection");
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

  const handleOptimizationChange = useCallback(
    (options: OptimizationOptions) => {
      setOptimizationOptions(options);
    },
    []
  );

  const handleOptimize = useCallback(() => {
    if (
      !optimizationOptions.convertDust &&
      !optimizationOptions.rebalancePortfolio
    ) {
      return;
    }

    if (uiVariation === "wizard") {
      setCurrentStep("preview");
    } else {
      setIsOptimizing(true);
      // In real app, this would trigger the optimization flow
      // Extended duration to show progress
      setTimeout(() => {
        setIsOptimizing(false);
      }, 12000);
    }
  }, [optimizationOptions, uiVariation]);

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

  // Variation 1: Unified Optimization Panel (Recommended)
  const renderUnifiedVariation = () => (
    <GlassCard testId="optimize-tab">
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold gradient-text">
              {strategy.name}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <div className="text-2xl font-bold text-blue-500">
                ${mockOptimizationData.dustValue}
              </div>
              <div className="text-sm text-gray-400">Dust Value</div>
              <div className="text-xs text-gray-500 mt-1">
                {mockOptimizationData.dustTokenCount} tokens
              </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <div className="text-2xl font-bold text-purple-500">
                {mockOptimizationData.rebalanceActions}
              </div>
              <div className="text-sm text-gray-400">Rebalance Actions</div>
              <div className="text-xs text-gray-500 mt-1">
                {mockOptimizationData.chainCount} chains
              </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <div className="text-2xl font-bold text-green-500">
                ${mockOptimizationData.totalSavings}
              </div>
              <div className="text-sm text-gray-400">Est. Savings</div>
              <div className="text-xs text-gray-500 mt-1">
                {mockOptimizationData.estimatedGasSavings} ETH gas
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Selection */}
        <OptimizationSelector
          options={optimizationOptions}
          onChange={handleOptimizationChange}
          mockData={mockOptimizationData}
        />

        {/* Slippage Control */}
        <SlippageSelector
          slippage={optimizationOptions.slippage}
          onChange={slippage =>
            setOptimizationOptions(prev => ({ ...prev, slippage }))
          }
        />

        {/* Action Button or Progress */}
        {isOptimizing ? (
          <OptimizationProgress
            options={optimizationOptions}
            mockData={mockOptimizationData}
          />
        ) : (
          <GradientButton
            disabled={selectedCount === 0}
            gradient="from-purple-600 to-blue-600"
            className="w-full py-4"
            testId="optimize-button"
            onClick={handleOptimize}
          >
            {getOptimizeButtonText()}
          </GradientButton>
        )}

        {/* Additional Info */}
        <div className="flex justify-center space-x-6 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>0.01% fee</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span>Gas optimized</span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowDownLeft className="w-4 h-4 text-purple-500" />
            <span>Instant execution</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  // Variation 2: Stepped Optimization Wizard
  const renderWizardVariation = () => (
    <GlassCard testId="optimize-tab-wizard">
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === "selection"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            1
          </div>
          <div className="w-12 h-0.5 bg-gray-700"></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === "preview"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            2
          </div>
          <div className="w-12 h-0.5 bg-gray-700"></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === "execution"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            3
          </div>
        </div>

        {currentStep === "selection" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-center">
              Choose Optimizations
            </h3>
            <OptimizationSelector
              options={optimizationOptions}
              onChange={handleOptimizationChange}
              mockData={mockOptimizationData}
            />
            <GradientButton
              disabled={selectedCount === 0}
              gradient="from-purple-600 to-blue-600"
              className="w-full py-3"
              onClick={handleOptimize}
            >
              Next: Preview Changes
            </GradientButton>
          </div>
        )}

        {currentStep === "preview" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-center">
              Preview Optimization
            </h3>
            <OptimizationPreview
              options={optimizationOptions}
              mockData={mockOptimizationData}
            />
            <div className="flex space-x-3">
              <GradientButton
                gradient="from-gray-600 to-gray-700"
                className="flex-1 py-3"
                onClick={() => setCurrentStep("selection")}
              >
                Back
              </GradientButton>
              <GradientButton
                gradient="from-purple-600 to-blue-600"
                className="flex-1 py-3"
                onClick={() => setCurrentStep("execution")}
              >
                Execute Optimization
              </GradientButton>
            </div>
          </div>
        )}

        {currentStep === "execution" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-center">
              Optimizing Portfolio
            </h3>
            <OptimizationProgress
              options={optimizationOptions}
              mockData={mockOptimizationData}
            />
          </div>
        )}
      </div>
    </GlassCard>
  );

  // Variation 3: Card-Based Selection
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

  // Render based on selected variation
  switch (uiVariation) {
    case "wizard":
      return renderWizardVariation();
    case "cards":
      return renderCardsVariation();
    case "unified":
    default:
      return renderUnifiedVariation();
  }
}
