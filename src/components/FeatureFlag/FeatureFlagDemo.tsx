"use client";

import {
  FeatureFlag,
  ABTest,
  useFeatureFlag,
  useFeatureFlagValue,
} from "./index";

/**
 * Demo component showcasing feature flag usage patterns
 * Only shown in development mode
 */
export function FeatureFlagDemo() {
  const maxPortfolioSize = useFeatureFlagValue<number>("MAX_PORTFOLIO_SIZE");
  const apiEndpoints =
    useFeatureFlagValue<Record<string, string>>("API_ENDPOINTS");
  const showOptimisticUpdates = useFeatureFlag("OPTIMISTIC_UPDATES");

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        🚩 Feature Flag Demo
      </h3>

      {/* Basic feature flag usage */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">
          Basic Feature Flags:
        </h4>

        <FeatureFlag flag="ADVANCED_STRATEGIES">
          <div className="p-2 bg-green-900/50 border border-green-700 rounded text-green-300 text-sm">
            ✅ Advanced Strategies feature is enabled
          </div>
        </FeatureFlag>

        <FeatureFlag
          flag="YIELD_FARMING_V2"
          fallback={
            <div className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-400 text-sm">
              🚧 Yield Farming V2 is not yet available
            </div>
          }
        >
          <div className="p-2 bg-blue-900/50 border border-blue-700 rounded text-blue-300 text-sm">
            🆕 Yield Farming V2 is now available!
          </div>
        </FeatureFlag>
      </div>

      {/* A/B testing example */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">A/B Testing:</h4>
        <ABTest
          flag="NEW_DASHBOARD_LAYOUT"
          variantA={
            <div className="p-2 bg-purple-900/50 border border-purple-700 rounded text-purple-300 text-sm">
              📊 Classic Dashboard Layout (Control)
            </div>
          }
          variantB={
            <div className="p-2 bg-orange-900/50 border border-orange-700 rounded text-orange-300 text-sm">
              ✨ New Dashboard Layout (Test Variant)
            </div>
          }
          onVariantShown={variant => {
            // Console log only in development
            if (process.env.NODE_ENV === "development") {
              console.log(`A/B Test variant shown: ${variant}`);
            }
          }}
        />
      </div>

      {/* Feature flag values */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">
          Feature Flag Values:
        </h4>
        <div className="text-sm text-gray-400 space-y-1">
          <div>
            Max Portfolio Size:{" "}
            <span className="text-white">{maxPortfolioSize}</span>
          </div>
          <div>
            Optimistic Updates:{" "}
            <span className="text-white">
              {showOptimisticUpdates ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div>
            API Endpoints:{" "}
            <span className="text-white">
              {JSON.stringify(apiEndpoints, null, 2)}
            </span>
          </div>
        </div>
      </div>

      {/* Security and performance flags */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">
          Security & Performance:
        </h4>

        <FeatureFlag flag="TRANSACTION_SIMULATION">
          <div className="p-2 bg-green-900/50 border border-green-700 rounded text-green-300 text-sm">
            🛡️ Transaction simulation is active - safer trades
          </div>
        </FeatureFlag>

        <FeatureFlag flag="HARDWARE_WALLET_INTEGRATION">
          <div className="p-2 bg-blue-900/50 border border-blue-700 rounded text-blue-300 text-sm">
            🔒 Hardware wallet support available
          </div>
        </FeatureFlag>

        <FeatureFlag flag="LAZY_LOADING">
          <div className="p-2 bg-indigo-900/50 border border-indigo-700 rounded text-indigo-300 text-sm">
            ⚡ Lazy loading enabled for better performance
          </div>
        </FeatureFlag>
      </div>

      {/* Experimental features */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">
          Experimental Features:
        </h4>

        <FeatureFlag
          flag="AI_PORTFOLIO_SUGGESTIONS"
          fallback={
            <div className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-400 text-sm">
              🤖 AI Portfolio Suggestions coming soon...
            </div>
          }
        >
          <div className="p-2 bg-cyan-900/50 border border-cyan-700 rounded text-cyan-300 text-sm">
            🤖 AI Portfolio Suggestions are live! Try them out.
          </div>
        </FeatureFlag>

        <FeatureFlag
          flag="SOCIAL_TRADING"
          fallback={
            <div className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-400 text-sm">
              👥 Social Trading is in development
            </div>
          }
        >
          <div className="p-2 bg-pink-900/50 border border-pink-700 rounded text-pink-300 text-sm">
            👥 Social Trading is now available! Follow top traders.
          </div>
        </FeatureFlag>
      </div>

      <div className="text-xs text-gray-500 mt-4">
        💡 This demo is only visible in development mode. Feature flags can be
        controlled via the debug panel (🚩 button).
      </div>
    </div>
  );
}

export default FeatureFlagDemo;
