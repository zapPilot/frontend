/**
 * UnifiedProgressModal Usage Examples
 *
 * This file demonstrates how to use the UnifiedProgressModal in both modes.
 * It serves as documentation and reference implementation.
 */

import { useState } from "react";
import {
  IntentConfig,
  OptimizationConfig,
  UnifiedProgressModal,
} from "./UnifiedProgressModal";

export function UnifiedProgressModalExamples() {
  const [intentModalOpen, setIntentModalOpen] = useState(false);
  const [optimizationModalOpen, setOptimizationModalOpen] = useState(false);

  // Example Intent Configuration
  const intentConfig: IntentConfig = {
    strategy: {
      name: "Stablecoin Vault",
      color: "from-green-500 to-emerald-600",
    },
    amount: "1000",
    fromToken: "USDC",
  };

  // Example Optimization Configuration
  const optimizationConfig: OptimizationConfig = {
    options: {
      convertDust: true,
      rebalancePortfolio: true,
      slippage: 30, // 0.3%
    },
    mockData: {
      dustValue: 127.45,
      dustTokenCount: 15,
      rebalanceActions: 8,
      chainCount: 3,
      totalSavings: 89.32,
    },
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-bold text-white">
        UnifiedProgressModal Examples
      </h2>

      {/* Intent Mode Example */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300">Intent Mode</h3>
        <p className="text-sm text-gray-400">
          Used for processing investment intents with strategy-specific steps.
        </p>
        <button
          onClick={() => setIntentModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Open Intent Progress
        </button>

        <UnifiedProgressModal
          isOpen={intentModalOpen}
          onClose={() => setIntentModalOpen(false)}
          mode="intent"
          config={intentConfig}
          showDetailed={true}
        />
      </div>

      {/* Optimization Mode Example */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300">
          Optimization Mode
        </h3>
        <p className="text-sm text-gray-400">
          Used for portfolio optimization with dust conversion and rebalancing.
        </p>
        <button
          onClick={() => setOptimizationModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Open Optimization Progress
        </button>

        <UnifiedProgressModal
          isOpen={optimizationModalOpen}
          onClose={() => setOptimizationModalOpen(false)}
          mode="optimization"
          config={optimizationConfig}
          showDetailed={true}
        />
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h4 className="font-semibold text-white mb-2">Usage Instructions</h4>
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            <strong>Intent Mode:</strong> Pass mode=&quot;intent&quot; with
            IntentConfig containing strategy info, amount, and token.
          </p>
          <p>
            <strong>Optimization Mode:</strong> Pass
            mode=&quot;optimization&quot; with OptimizationConfig containing
            options and mock data.
          </p>
          <p>
            <strong>showDetailed:</strong> Controls whether to show detailed
            step-by-step progress or simple loading state.
          </p>
        </div>
      </div>
    </div>
  );
}

// Type-safe config builders for convenience
export const createIntentConfig = (
  strategyName: string,
  strategyColor: string,
  amount: string,
  fromToken: string
): IntentConfig => ({
  strategy: {
    name: strategyName,
    color: strategyColor,
  },
  amount,
  fromToken,
});

export const createOptimizationConfig = (
  convertDust: boolean,
  rebalancePortfolio: boolean,
  slippage: number,
  mockData: OptimizationConfig["mockData"]
): OptimizationConfig => ({
  options: {
    convertDust,
    rebalancePortfolio,
    slippage,
  },
  mockData,
});
