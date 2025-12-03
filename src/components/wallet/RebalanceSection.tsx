import { Settings } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";
import type { PortfolioAllocationSplit } from "@/types/domain/portfolio";

import { RebalanceSectionSkeleton } from "./RebalanceSectionSkeleton";

interface RebalanceSectionProps {
  allocation?: PortfolioAllocationSplit | null;
  onOptimizeClick?: (() => void) | undefined;
  disabled?: boolean;
  isLoading?: boolean;
}

const DEFAULT_TARGET = 50;

function formatPercentage(value?: number): string {
  if (!Number.isFinite(value ?? NaN)) {
    return "--";
  }

  return `${Math.round(value ?? 0)}%`;
}

export function RebalanceSection({
  allocation,
  onOptimizeClick,
  disabled,
  isLoading = false,
}: RebalanceSectionProps) {
  // Early return with skeleton during data fetch
  if (isLoading) {
    return <RebalanceSectionSkeleton />;
  }

  const stableWidth = Math.min(Math.max(allocation?.stable ?? 0, 0), 100);
  const cryptoWidth = Math.min(Math.max(allocation?.crypto ?? 0, 0), 100);
  const target = allocation?.target ?? DEFAULT_TARGET;

  return (
    <div className="mb-6 bg-gray-900/30 rounded-xl p-4 border border-gray-800">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Current Allocation</span>
            <span className="text-gray-400">Target: {target}%</span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex relative">
            <div
              className="h-full bg-blue-500/50 flex items-center justify-center text-[10px] text-white font-medium transition-all duration-500"
              style={{ width: `${stableWidth}%` }}
            >
              Stable {formatPercentage(allocation?.stable)}
            </div>
            <div
              className="h-full bg-purple-500/50 flex items-center justify-center text-[10px] text-white font-medium transition-all duration-500"
              style={{ width: `${cryptoWidth}%` }}
            >
              Crypto {formatPercentage(allocation?.crypto)}
            </div>

            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50 z-10 transform -translate-x-1/2" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Stablecoins</span>
            <span>BTC / ETH / Others</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* NOTE(AWP-analytics): emit sentiment_cta_displayed/clicked once Segment client hooks are ready */}
          <GradientButton
            gradient={GRADIENTS.PRIMARY}
            shadowColor="purple-500"
            icon={Settings}
            {...(onOptimizeClick ? { onClick: onOptimizeClick } : {})}
            disabled={disabled || !onOptimizeClick}
          >
            <span className="text-sm">Optimize</span>
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
