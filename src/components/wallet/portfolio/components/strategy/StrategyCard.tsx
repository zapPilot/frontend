import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Gauge } from "lucide-react";
import {
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";

import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { type Regime, regimes } from "@/components/wallet/regime/regimeData";
import { type StrategyDirection } from "@/components/wallet/regime/strategyLabels";
import { ANIMATIONS } from "@/constants/design-system";
import { getRegimeConfig } from "@/constants/regimeDisplay";
import { cn } from "@/lib/ui/classNames";
import type { SectionState, SentimentData } from "@/types";

import { StrategyCardSkeleton } from "../../views/DashboardSkeleton";
import { RegimeSelector } from "./RegimeSelector";
import { StrategyAllocationDisplay } from "./StrategyAllocationDisplay";
import {
  determineActiveDirection,
  resolveDisplayRegime,
  resolveEffectiveRegime,
  resolveTargetAllocation,
} from "./strategyCardResolvers";
import { StrategyDirectionTabs } from "./StrategyDirectionTabs";

/** StrategyCard styling constants */
const STYLES = {
  cardBase:
    "bg-gray-900/40 backdrop-blur-sm border rounded-2xl p-6 relative overflow-hidden group cursor-pointer transition-all duration-200",
  cardExpanded:
    "row-span-2 md:col-span-2 border-purple-500/30 shadow-lg shadow-purple-500/10",
  cardCollapsed:
    "border-gray-800 hover:border-purple-500/20 hover:bg-gray-900/60",
  regimeBadge:
    "w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold border shadow-inner flex-shrink-0",
} as const;

function getCardClassName(isExpanded: boolean): string {
  return `${STYLES.cardBase} ${isExpanded ? STYLES.cardExpanded : STYLES.cardCollapsed}`;
}

function renderSentimentDisplay(
  sentimentSection: SectionState<SentimentData> | undefined,
  fallbackValue: string | number | undefined
): ReactElement {
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
}

function getDisplayConfig(
  regime: Regime | undefined
): ReturnType<typeof getRegimeConfig> | null {
  if (!regime) {
    return null;
  }

  return getRegimeConfig(regime.id);
}

function resolveActiveStrategy(
  displayRegime: Regime | undefined,
  activeDirection: StrategyDirection
) {
  if (!displayRegime) {
    return;
  }

  return (
    displayRegime.strategies[activeDirection] ||
    displayRegime.strategies.default
  );
}

function resolveStrategyCardData(
  data: WalletPortfolioDataWithDirection,
  currentRegime: Regime | undefined,
  sentimentSection: SectionState<SentimentData> | undefined,
  selectedRegimeId: string | null,
  selectedDirection: StrategyDirection | null
) {
  const effectiveRegime = resolveEffectiveRegime(
    currentRegime,
    sentimentSection
  );
  if (!effectiveRegime && !sentimentSection) {
    return null;
  }

  const displayRegime = resolveDisplayRegime(selectedRegimeId, effectiveRegime);
  const isViewingCurrent =
    displayRegime?.id !== undefined &&
    effectiveRegime?.id !== undefined &&
    displayRegime.id === effectiveRegime.id;
  const activeDirection = determineActiveDirection(
    displayRegime,
    selectedDirection,
    isViewingCurrent,
    data
  );
  const activeStrategy = resolveActiveStrategy(displayRegime, activeDirection);

  return {
    effectiveRegime,
    displayRegime,
    activeDirection,
    activeStrategy,
    targetAllocation: resolveTargetAllocation(activeStrategy, displayRegime),
    sentimentDisplay: renderSentimentDisplay(
      sentimentSection,
      data.sentimentValue
    ),
    displayConfig: getDisplayConfig(effectiveRegime),
  };
}

function handleCardToggle(
  event: MouseEvent<HTMLElement>,
  displayRegime: Regime | undefined,
  setIsStrategyExpanded: (value: (previous: boolean) => boolean) => void
): void {
  if (!displayRegime) {
    return;
  }

  if (event.target instanceof HTMLElement) {
    const isInteractiveElement = event.target.closest(
      '[data-interactive="true"]'
    );
    if (isInteractiveElement) {
      return;
    }
  }

  setIsStrategyExpanded(previous => !previous);
}

function getActiveStrategyDetails(
  activeStrategy:
    | {
        philosophy?: string;
        author?: string;
        useCase?: { zapAction?: string; hideAllocationTarget?: boolean };
      }
    | undefined
): {
  philosophy: string | undefined;
  author: string | undefined;
  zapAction: string | undefined;
  hideAllocationTarget: boolean | undefined;
} {
  return {
    philosophy: activeStrategy?.philosophy,
    author: activeStrategy?.author,
    zapAction: activeStrategy?.useCase?.zapAction,
    hideAllocationTarget: activeStrategy?.useCase?.hideAllocationTarget,
  };
}

interface ExpandedSectionRenderParams {
  isStrategyExpanded: boolean;
  displayRegime: Regime | undefined;
  effectiveRegime: Regime | undefined;
  activeDirection: StrategyDirection;
  strategyDetails: ReturnType<typeof getActiveStrategyDetails>;
  targetAllocation: ReturnType<typeof resolveTargetAllocation>;
  onSelectRegime: (regimeId: string) => void;
  onSelectDirection: (direction: StrategyDirection) => void;
}

function renderExpandedSection({
  isStrategyExpanded,
  displayRegime,
  effectiveRegime,
  activeDirection,
  strategyDetails,
  targetAllocation,
  onSelectRegime,
  onSelectDirection,
}: ExpandedSectionRenderParams): ReactElement | null {
  if (!isStrategyExpanded || !displayRegime) {
    return null;
  }

  return (
    <StrategyCardExpandedContent
      effectiveRegime={effectiveRegime}
      displayRegime={displayRegime}
      activeDirection={activeDirection}
      strategyPhilosophy={strategyDetails.philosophy}
      strategyAuthor={strategyDetails.author}
      zapAction={strategyDetails.zapAction}
      targetAllocation={targetAllocation}
      hideAllocationTarget={strategyDetails.hideAllocationTarget}
      onSelectRegime={onSelectRegime}
      onSelectDirection={onSelectDirection}
    />
  );
}

interface StrategyCardHeaderProps {
  effectiveRegime: Regime | undefined;
  displayRegime: Regime | undefined;
  displayConfig: ReturnType<typeof getDisplayConfig>;
  sentimentDisplay: ReactNode;
  strategyPhilosophy: string | undefined;
  isStrategyExpanded: boolean;
}

function StrategyCardHeader({
  effectiveRegime,
  displayRegime,
  displayConfig,
  sentimentDisplay,
  strategyPhilosophy,
  isStrategyExpanded,
}: StrategyCardHeaderProps): ReactElement {
  return (
    <motion.div
      layout="position"
      className="relative z-10 flex items-start justify-between"
    >
      <div className="flex items-center gap-6">
        <div
          className={cn(
            STYLES.regimeBadge,
            displayConfig?.bg,
            displayConfig?.border
          )}
        >
          {effectiveRegime && displayConfig ? (
            <span className={displayConfig.color} data-testid="regime-badge">
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
            {sentimentDisplay}
          </div>
          <div className="text-sm text-gray-400 italic mb-2 min-h-[1.25rem] flex items-center">
            {strategyPhilosophy ? (
              <span>&ldquo;{strategyPhilosophy}&rdquo;</span>
            ) : (
              <div className="w-48 h-4 bg-gray-700/50 rounded animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {displayRegime && (
        <div
          className={`p-2 rounded-full bg-gray-800 text-gray-400 transition-transform duration-300 ${
            isStrategyExpanded ? "rotate-180" : ""
          }`}
          role="button"
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
}

interface StrategyCardExpandedContentProps {
  effectiveRegime: Regime | undefined;
  displayRegime: Regime;
  activeDirection: StrategyDirection;
  strategyPhilosophy: string | undefined;
  strategyAuthor: string | undefined;
  zapAction: string | undefined;
  targetAllocation: ReturnType<typeof resolveTargetAllocation>;
  hideAllocationTarget: boolean | undefined;
  onSelectRegime: (regimeId: string) => void;
  onSelectDirection: (direction: StrategyDirection) => void;
}

function StrategyCardExpandedContent({
  effectiveRegime,
  displayRegime,
  activeDirection,
  strategyPhilosophy,
  strategyAuthor,
  zapAction,
  targetAllocation,
  hideAllocationTarget,
  onSelectRegime,
  onSelectDirection,
}: StrategyCardExpandedContentProps): ReactElement {
  return (
    <motion.div
      {...ANIMATIONS.EXPAND_COLLAPSE}
      className="relative z-10 mt-8 pt-8 border-t border-gray-800"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <RegimeSelector
          currentRegime={effectiveRegime}
          selectedRegime={displayRegime}
          onSelectRegime={onSelectRegime}
          regimes={regimes}
        />

        <div>
          <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            <span>Why this allocation?</span>
            <StrategyDirectionTabs
              regime={displayRegime}
              activeDirection={activeDirection}
              onSelectDirection={onSelectDirection}
            />
          </h4>
          <div className="space-y-6 text-sm text-gray-400">
            <div className="relative pl-4 border-l-2 border-purple-500/30">
              <p className="italic text-gray-300 mb-1">
                &ldquo;{strategyPhilosophy}&rdquo;
              </p>
              {strategyAuthor && (
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  — {strategyAuthor}
                </p>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Smart Execution
              </div>
              <p className="leading-relaxed">
                {zapAction ||
                  "Zap Pilot automatically rebalances your portfolio to optimize for the current market regime."}
              </p>
            </div>

            <StrategyAllocationDisplay
              targetAllocation={targetAllocation}
              hideAllocationTarget={hideAllocationTarget}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export interface StrategyCardProps {
  data: WalletPortfolioDataWithDirection;
  currentRegime: Regime | undefined;
  isLoading?: boolean;
  /** Independent sentiment section for progressive loading */
  sentimentSection?: SectionState<SentimentData>;
}

export function StrategyCard({
  data,
  currentRegime,
  isLoading = false,
  sentimentSection,
}: StrategyCardProps): ReactElement | null {
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(false);
  const [selectedRegimeId, setSelectedRegimeId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] =
    useState<StrategyDirection | null>(null);

  if (isLoading) {
    return <StrategyCardSkeleton />;
  }

  const strategyCardData = resolveStrategyCardData(
    data,
    currentRegime,
    sentimentSection,
    selectedRegimeId,
    selectedDirection
  );
  if (!strategyCardData) {
    return null;
  }

  const {
    effectiveRegime,
    displayRegime,
    activeDirection,
    activeStrategy,
    targetAllocation,
    sentimentDisplay,
    displayConfig,
  } = strategyCardData;
  const strategyDetails = getActiveStrategyDetails(activeStrategy);

  function handleStrategyCardClick(event: MouseEvent<HTMLDivElement>): void {
    handleCardToggle(event, displayRegime, setIsStrategyExpanded);
  }

  function handleSelectRegime(regimeId: string): void {
    setSelectedRegimeId(regimeId);
    setSelectedDirection(null);
  }

  function handleSelectDirection(direction: StrategyDirection): void {
    setSelectedDirection(direction);
  }

  return (
    <motion.div
      data-testid="strategy-card"
      layout
      className={getCardClassName(isStrategyExpanded)}
      onClick={handleStrategyCardClick}
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Gauge
          className={cn(
            "w-32 h-32",
            displayConfig ? displayConfig.color : "text-purple-500"
          )}
        />
      </div>

      <StrategyCardHeader
        effectiveRegime={effectiveRegime}
        displayRegime={displayRegime}
        displayConfig={displayConfig}
        sentimentDisplay={sentimentDisplay}
        strategyPhilosophy={strategyDetails.philosophy}
        isStrategyExpanded={isStrategyExpanded}
      />

      <AnimatePresence>
        {renderExpandedSection({
          isStrategyExpanded,
          displayRegime,
          effectiveRegime,
          activeDirection,
          strategyDetails,
          targetAllocation,
          onSelectRegime: handleSelectRegime,
          onSelectDirection: handleSelectDirection,
        })}
      </AnimatePresence>
    </motion.div>
  );
}
