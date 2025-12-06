/**
 * Portfolio Overview Card - Variation 3
 *
 * Combines Balance + ROI + Zap buttons into single comprehensive card.
 * Action-oriented: All portfolio value data and actions in one place.
 */

import { ArrowDownLeft,ArrowUpRight } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

interface PortfolioOverviewCardProps {
  balance: number;
  roi: number;
  roiChange7d: number;
  positions: number;
  protocols: number;
  chains: number;
}

export function PortfolioOverviewCard({
  balance,
  roi,
  roiChange7d,
  positions,
  protocols,
  chains,
}: PortfolioOverviewCardProps) {
  return (
    <div className="relative bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 inline-block">
          <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">
            Portfolio Overview
          </span>
        </div>

        {/* Balance */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Balance</p>
          <div className="text-2xl font-bold text-white tracking-tight mb-0.5">
            ${balance.toLocaleString()}
          </div>
        </div>

        {/* ROI */}
        <div className="bg-gray-800/30 rounded-lg p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">ROI</span>
            <span className="text-lg font-bold text-green-400">+{roi}%</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">7d:</span>
              <span className="text-green-400">+{roiChange7d}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">30d:</span>
              <span className="text-green-400">+{roi}%</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Quick Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            <GradientButton
              gradient={GRADIENTS.SUCCESS}
              shadowColor="green-500"
              icon={ArrowUpRight}
              className="h-9"
            >
              <span className="text-xs">Zap In</span>
            </GradientButton>
            <GradientButton
              gradient={GRADIENTS.DANGER}
              shadowColor="red-500"
              icon={ArrowDownLeft}
              className="h-9"
            >
              <span className="text-xs">Zap Out</span>
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
}
