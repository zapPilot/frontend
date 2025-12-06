/**
 * Portfolio Layout - Variation 3: Action-Oriented Layout
 *
 * DEMO COMPONENT - DELETE AFTER SELECTION
 *
 * Layout:
 * [Portfolio Overview] [Market Regime Status]  ← 2-col grid
 *   Balance + ROI        Sentiment + Timeline
 *   Zap In/Out          Regime name
 *
 * [Allocation Strategy]                         ← Full width
 *   Current/Target bars
 *   Delta indicator  [Optimize Button] ← Prominent
 *   Philosophy quote
 *   Timeline (bottom)
 *
 * Changes from original:
 * - Combined Portfolio card (Balance + ROI + Zap buttons)
 * - Compact Regime card (Sentiment + current regime status + mini timeline)
 * - Optimize button next to allocation gap for high conversion
 * - Full timeline moved to bottom of allocation section
 */

"use client";

import { getRegimeById } from "../regime/regimeData";
import { AllocationStrategyPanel } from "./AllocationStrategyPanel";
import { MOCK_DATA } from "./mockPortfolioData";
import { PortfolioOverviewCard } from "./PortfolioOverviewCard";
import { RegimeStatusCard } from "./RegimeStatusCard";

export function WalletPortfolioPresenterV3() {
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  return (
    <div className="space-y-6">
      {/* Top Row - 2 Cards (Portfolio Overview + Regime Status) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PortfolioOverviewCard
          balance={MOCK_DATA.balance}
          roi={MOCK_DATA.roi}
          roiChange7d={MOCK_DATA.roiChange7d}
          positions={MOCK_DATA.positions}
          protocols={MOCK_DATA.protocols}
          chains={MOCK_DATA.chains}
        />
        <RegimeStatusCard
          sentimentValue={MOCK_DATA.sentimentValue}
          sentimentStatus={MOCK_DATA.sentimentStatus}
          currentRegimeId={MOCK_DATA.currentRegime}
        />
      </div>

      {/* Allocation Strategy Panel - Optimize button prominent */}
      <AllocationStrategyPanel
        currentRegimeId={MOCK_DATA.currentRegime}
        currentAllocation={MOCK_DATA.currentAllocation}
        targetAllocation={MOCK_DATA.targetAllocation}
        delta={MOCK_DATA.delta}
        philosophy={currentRegime.philosophy}
      />
    </div>
  );
}
