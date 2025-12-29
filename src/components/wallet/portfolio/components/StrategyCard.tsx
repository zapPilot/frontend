import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Gauge } from "lucide-react";
import { useState } from "react";

import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import {
  getRegimeAllocation,
  type Regime,
  regimes,
} from "@/components/wallet/regime/regimeData";
import {
  getStrategyTabLabel,
  type StrategyDirection,
} from "@/components/wallet/regime/strategyLabels";
import { ANIMATIONS } from "@/constants/design-system";
import { getRegimeFromSentiment } from "@/lib/domain/regimeMapper";
import { getStrategyMeta } from "@/lib/domain/strategySelector";
import type {
  SectionState,
  SentimentData,
} from "@/types/portfolio-progressive";

import { StrategyCardSkeleton } from "../views/DashboardSkeleton";

/** StrategyCard styling constants */
const STYLES = {
  cardBase:
    "bg-gray-900/40 backdrop-blur-sm border rounded-2xl p-8 relative overflow-hidden group cursor-pointer transition-all duration-200",
  cardExpanded:
    "row-span-2 md:col-span-2 border-purple-500/30 shadow-lg shadow-purple-500/10",
  cardCollapsed:
    "border-gray-800 hover:border-purple-500/20 hover:bg-gray-900/60",
  regimeBadge:
    "w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl font-bold border border-gray-700 shadow-inner flex-shrink-0",
  regimeButtonSelected:
    "bg-gray-800 border border-gray-600 shadow-lg scale-102 ring-1 ring-purple-500/50",
  regimeButtonUnselected: "opacity-60 hover:opacity-100 hover:bg-gray-800/50",
  directionTabBase:
    "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer border",
  directionTabUnselected:
    "bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-gray-300",
  allocationContainer:
    "bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-4",
  progressBarTrack: "w-full bg-gray-700 h-2 rounded-full overflow-hidden",
} as const;

/** Get card className based on expanded state */
const getCardClassName = (isExpanded: boolean): string =>
  `${STYLES.cardBase} ${isExpanded ? STYLES.cardExpanded : STYLES.cardCollapsed}`;

/** Determine active direction based on user selection, data, and available strategies */
const determineActiveDirection = (
  displayRegime: Regime | undefined,
  selectedDirection: StrategyDirection | null,
  isViewingCurrent: boolean,
  data: WalletPortfolioDataWithDirection
): StrategyDirection => {
  if (!displayRegime) return "default";

  const hasStrategy = (dir: StrategyDirection) =>
    displayRegime?.strategies?.[dir as keyof typeof displayRegime.strategies];

  if (selectedDirection && hasStrategy(selectedDirection)) {
    return selectedDirection;
  }

  if (
    isViewingCurrent &&
    "strategyDirection" in data &&
    data.strategyDirection !== "default"
  ) {
    return data.strategyDirection as StrategyDirection;
  }

  if (hasStrategy("fromLeft")) {
    return "fromLeft";
  }

  if (hasStrategy("fromRight")) {
    return "fromRight";
  }

  return "default";
};

/** Render sentiment display badge */
const renderSentimentDisplay = (
  sentimentSection: SectionState<SentimentData> | undefined,
  fallbackValue: string | number | undefined
): React.ReactNode => {
  if (sentimentSection?.isLoading) {
    return (
      <span
        className="inline-block w-10 h-5 ml-2 align-middle bg-gray-800/50 rounded border border-gray-700/50 animate-pulse"
        title="Loading sentiment..."
      />
    );
  }

  return (
    <span
      className="text-sm font-mono text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-700/50 ml-2 align-middle"
      title="Market Sentiment Score"
    >
      {sentimentSection?.data?.value ?? fallbackValue ?? "—"}
    </span>
  );
};

export interface StrategyCardProps {
  data: WalletPortfolioDataWithDirection;
  currentRegime: Regime | undefined;
  isEmptyState?: boolean;
  isLoading?: boolean;
  /** Independent sentiment section for progressive loading */
  sentimentSection?: SectionState<SentimentData>;
}

export function StrategyCard({
  data,
  currentRegime,
  // isEmptyState intentionally not destructured - kept in props for API consistency
  isLoading = false,
  sentimentSection,
}: StrategyCardProps) {
  // Show skeleton during loading - must be before hooks for consistency
  // but after destructuring (which is before hooks anyway)
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(false);
  const [selectedRegimeId, setSelectedRegimeId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] =
    useState<StrategyDirection | null>(null);

  // Early return for loading state - AFTER hooks to comply with React rules
  if (isLoading) {
    return <StrategyCardSkeleton />;
  }

  // Independent Sentiment Logic:
  // If we have independent sentiment data but no explicit regime (because main data is loading),
  // we can derive the regime from the sentiment value to show the full card immediately.
  const derivedRegimeId = sentimentSection?.data
    ? getRegimeFromSentiment(sentimentSection.data.value)
    : undefined;

  const effectiveRegime =
    currentRegime ||
    (derivedRegimeId ? regimes.find(r => r.id === derivedRegimeId) : undefined);

  // Only return null if we truly have no regime info (neither explicit nor derived)
  if (!effectiveRegime && !sentimentSection) {
    return null;
  }

  // Determine which regime to display (selected or current)
  // If user selects a regime, we show that. Otherwise we show the effective regime.
  const displayRegime = selectedRegimeId
    ? regimes.find(r => r.id === selectedRegimeId) || effectiveRegime
    : effectiveRegime;

  // Use effectiveRegime for comparison
  const isViewingCurrent =
    displayRegime && effectiveRegime
      ? displayRegime.id === effectiveRegime.id
      : false;

  // Extract directional strategy metadata (safely handle missing fields)
  const strategyDirection =
    "strategyDirection" in data ? data.strategyDirection : "default";
  const previousRegime = "previousRegime" in data ? data.previousRegime : null;
  const regimeDuration = "regimeDuration" in data ? data.regimeDuration : null;
  const strategyMeta = getStrategyMeta(strategyDirection);

  // Determine the active strategy to display
  const activeDirection = determineActiveDirection(
    displayRegime,
    selectedDirection,
    isViewingCurrent,
    data
  );

  const activeStrategy = displayRegime
    ? displayRegime.strategies[activeDirection] ||
      displayRegime.strategies.default
    : undefined;

  // Calculate target allocation from strategy or regime
  // Prefer strategy-specific 'allocationAfter' if defined, otherwise use regime default
  const targetAllocation = activeStrategy?.useCase?.allocationAfter
    ? {
        spot: activeStrategy.useCase.allocationAfter.spot,
        lp: activeStrategy.useCase.allocationAfter.lp,
        stable: activeStrategy.useCase.allocationAfter.stable,
      }
    : displayRegime
      ? getRegimeAllocation(displayRegime)
      : { spot: 0, lp: 0, stable: 0 };

  const sentimentDisplay = renderSentimentDisplay(
    sentimentSection,
    data.sentimentValue
  );

  return (
    <motion.div
      data-testid="strategy-card"
      layout
      className={getCardClassName(isStrategyExpanded)}
      onClick={e => {
        // Prevent collapsing if we don't have a regime to show details for
        if (!displayRegime) return;

        // Prevent collapsing when clicking on interactive elements inside
        if ((e.target as HTMLElement).closest('[data-interactive="true"]')) {
          return;
        }
        setIsStrategyExpanded(!isStrategyExpanded);
      }}
    >
      {/* Background Icon */}
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Gauge className="w-32 h-32 text-purple-500" />
      </div>

      {/* Header / Collapsed State */}
      <motion.div
        layout="position"
        className="relative z-10 flex items-start justify-between"
      >
        <div className="flex items-center gap-6">
          <div className={STYLES.regimeBadge}>
            {effectiveRegime ? (
              <span
                style={{ color: effectiveRegime.fillColor }}
                data-testid="regime-badge"
              >
                {effectiveRegime.id.toUpperCase()}
              </span>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center border border-gray-700 shadow-inner">
                <div className="w-12 h-4 bg-gray-700/50 rounded animate-pulse" />
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              Current Strategy
            </div>
            <div className="text-2xl font-bold text-white mb-1 flex items-center">
              {effectiveRegime ? (
                effectiveRegime.label
              ) : (
                <div className="w-32 h-8 bg-gray-700/50 rounded animate-pulse mr-2" />
              )}
              {/* Sentiment value - loads independently */}
              {sentimentDisplay}
            </div>
            <div className="text-sm text-gray-400 italic mb-2 min-h-[1.25rem] flex items-center">
              {activeStrategy ? (
                <span>&ldquo;{activeStrategy.philosophy}&rdquo;</span>
              ) : (
                <div className="w-48 h-4 bg-gray-700/50 rounded animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {displayRegime && (
          <div
            className={`p-2 rounded-full bg-gray-800 text-gray-400 transition-transform duration-300 ${isStrategyExpanded ? "rotate-180" : ""}`}
            role="button"
          >
            <ChevronDown className="w-5 h-5" />
          </div>
        )}
      </motion.div>

      {/* Expanded Content (Progressive Disclosure) */}
      <AnimatePresence>
        {isStrategyExpanded && displayRegime && (
          <motion.div
            {...ANIMATIONS.EXPAND_COLLAPSE}
            className="relative z-10 mt-8 pt-8 border-t border-gray-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Regime Spectrum */}
              <div
                data-testid="regime-spectrum"
                data-interactive="true"
                className="flex flex-col"
              >
                <h4 className="text-sm font-bold text-white mb-4">
                  Market Cycle Position
                </h4>
                <div className="flex flex-col gap-2">
                  {regimes.map(regime => {
                    const isCurrent = effectiveRegime?.id === regime.id;
                    const isSelected = displayRegime.id === regime.id;

                    return (
                      <button
                        key={regime.id}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedRegimeId(regime.id);
                          setSelectedDirection(null);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all w-full text-left cursor-pointer ${
                          isSelected
                            ? STYLES.regimeButtonSelected
                            : STYLES.regimeButtonUnselected
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${isCurrent ? "animate-pulse" : ""}`}
                          style={{
                            backgroundColor: regime.fillColor,
                          }}
                        />
                        <span
                          className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-400"}`}
                        >
                          {regime.label}
                        </span>
                        {isCurrent && (
                          <span className="ml-auto text-xs font-mono text-gray-400">
                            Current
                          </span>
                        )}
                        {!isCurrent && isSelected && (
                          <span className="ml-auto text-xs font-mono text-purple-400">
                            Viewing
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Strategy Explanation */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                  <span>Why this allocation?</span>
                  {/* Strategy Tabs */}
                  <div className="flex gap-2">
                    {/* Only show tabs if we have multiple strategies (active choice) */}
                    {(
                      Object.keys(
                        displayRegime.strategies
                      ) as (keyof typeof displayRegime.strategies)[]
                    ).filter(k => k !== "default").length > 0 && (
                      <div className="flex gap-2 mb-2 overflow-x-auto">
                        {(["fromLeft", "fromRight"] as const).map(direction => {
                          if (!displayRegime.strategies[direction]) return null;

                          const isSelected = activeDirection === direction;
                          const label = getStrategyTabLabel(
                            displayRegime.id,
                            direction
                          );

                          return (
                            <button
                              key={direction}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedDirection(direction);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer border ${
                                isSelected
                                  ? `bg-gradient-to-r ${displayRegime.visual.gradient} text-white border-transparent shadow-lg`
                                  : "bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-gray-300"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </h4>
                <div className="space-y-6 text-sm text-gray-400">
                  {/* Philosophy Quote */}
                  <div className="relative pl-4 border-l-2 border-purple-500/30">
                    <p className="italic text-gray-300 mb-1">
                      &ldquo;{activeStrategy?.philosophy}&rdquo;
                    </p>
                    {activeStrategy?.author && (
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                        — {activeStrategy.author}
                      </p>
                    )}
                  </div>

                  {/* Zap Action (Dynamic based on strategy) */}
                  {displayRegime.strategies && (
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Smart Execution
                      </div>
                      <p className="leading-relaxed">
                        {activeStrategy?.useCase?.zapAction ||
                          "Zap Pilot automatically rebalances your portfolio to optimize for the current market regime."}
                      </p>
                    </div>
                  )}

                  {/* Allocation Bars */}
                  {!activeStrategy?.useCase?.hideAllocationTarget && (
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-4">
                      {/* Spot Bar */}
                      <div className="flex justify-between items-center mb-2">
                        <span>Target Spot</span>
                        <span className="text-white font-bold">
                          {targetAllocation.spot}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-4">
                        <div
                          className="bg-purple-500 h-full"
                          style={{
                            width: `${targetAllocation.spot}%`,
                          }}
                        />
                      </div>

                      {/* LP Bar */}
                      <div className="flex justify-between items-center mb-2">
                        <span>Target LP</span>
                        <span className="text-blue-400 font-bold">
                          {targetAllocation.lp}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-4">
                        <div
                          className="bg-blue-500 h-full"
                          style={{
                            width: `${targetAllocation.lp}%`,
                          }}
                        />
                      </div>

                      {/* Stable Bar */}
                      <div className="flex justify-between items-center mb-2">
                        <span>Target Stable</span>
                        <span className="text-emerald-400 font-bold">
                          {targetAllocation.stable}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${targetAllocation.stable}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {activeStrategy?.useCase?.hideAllocationTarget && (
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 mt-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-blue-200 font-medium">
                        Maintain current position
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
