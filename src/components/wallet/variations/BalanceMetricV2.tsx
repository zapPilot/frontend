/**
 * Balance Metric V2 - Integrated Actions
 *
 * Variation 2: Adds Zap In/Out buttons directly into balance card
 * for contextual placement near portfolio value.
 */

import { ArrowDownLeft,ArrowUpRight } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

interface BalanceMetricV2Props {
  balance: number;
  positions: number;
  protocols: number;
  chains: number;
}

export function BalanceMetricV2({ balance, positions, protocols, chains }: BalanceMetricV2Props) {
  return (
    <div className="relative bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 inline-block">
          <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">
            Portfolio Balance
          </span>
        </div>

        {/* Balance */}
        <div className="text-center">
          <div className="text-2xl font-bold text-white tracking-tight mb-1">
            ${balance.toLocaleString()}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Positions</p>
              <p className="text-xs font-medium text-gray-300">{positions}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Protocols</p>
              <p className="text-xs font-medium text-gray-300">{protocols}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Chains</p>
              <p className="text-xs font-medium text-gray-300">{chains}</p>
            </div>
          </div>
        </div>

        {/* Integrated Zap Buttons */}
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
  );
}
