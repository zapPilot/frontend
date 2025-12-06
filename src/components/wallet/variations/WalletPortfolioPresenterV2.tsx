/**
 * Portfolio Layout - Variation 2: Integrated Strategy Panel
 *
 * DEMO COMPONENT - DELETE AFTER SELECTION
 *
 * Layout:
 * [Balance + Zap Buttons] [ROI Performance]   ← 2-col grid
 * [Unified Strategy Panel]                     ← Full width merged section
 *
 * Changes from original:
 * - Merged sentiment into regime section as unified "Strategy Panel"
 * - Zap buttons integrated into Balance card (contextual placement)
 * - 2-card top row instead of 3 (better mobile performance)
 * - Optimize button integrated into strategy panel footer
 */

"use client";

import { BalanceMetricV2 } from "./BalanceMetricV2";
import { MOCK_DATA } from "./mockPortfolioData";
import { StrategyPanel } from "./StrategyPanel";

/**
 * Simplified ROI Card
 */
function ROICard() {
  return (
    <div className="relative bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500" />
      <div className="p-4 space-y-2">
        <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 inline-block">
          <span className="text-[10px] text-green-400 uppercase tracking-wider font-medium">
            Performance
          </span>
        </div>

        <div className="text-center space-y-2">
          <div>
            <div className="text-2xl font-bold text-green-400 tracking-tight">
              +{MOCK_DATA.roi}%
            </div>
            <p className="text-xs text-gray-400">30-day ROI</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800">
            <div className="text-center">
              <p className="text-[9px] text-gray-500 uppercase mb-1">7 Days</p>
              <p className="text-sm font-medium text-green-400">+{MOCK_DATA.roiChange7d}%</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-gray-500 uppercase mb-1">30 Days</p>
              <p className="text-sm font-medium text-green-400">+{MOCK_DATA.roiChange30d}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletPortfolioPresenterV2() {
  return (
    <div className="space-y-6">
      {/* Top Row - 2 Cards (Balance with Zap + ROI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BalanceMetricV2
          balance={MOCK_DATA.balance}
          positions={MOCK_DATA.positions}
          protocols={MOCK_DATA.protocols}
          chains={MOCK_DATA.chains}
        />
        <ROICard />
      </div>

      {/* Unified Strategy Panel */}
      <StrategyPanel
        sentimentValue={MOCK_DATA.sentimentValue}
        sentimentStatus={MOCK_DATA.sentimentStatus}
        currentRegimeId={MOCK_DATA.currentRegime}
        currentAllocation={MOCK_DATA.currentAllocation}
        targetAllocation={MOCK_DATA.targetAllocation}
        delta={MOCK_DATA.delta}
      />
    </div>
  );
}
