/**
 * Dashboard Loading Skeletons
 *
 * Content-aware skeletons that show real UI labels/buttons
 * while only using pulsing placeholders for dynamic data (numbers, charts)
 */

import { ArrowDownCircle, ArrowUpCircle, ChevronDown, Info, Zap } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

/**
 * Balance Card Skeleton
 * Shows real labels and disabled buttons, skeleton only for balance value
 */
export function BalanceCardSkeleton() {
  return (
    <div
      className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 flex flex-col justify-center"
      aria-hidden="true"
    >
      {/* Real Label */}
      <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">
        Net Worth
      </div>

      {/* Skeleton: Balance Value */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <div className="h-12 w-48 bg-gray-700/50 rounded-lg mb-4 animate-pulse" />
          {/* Skeleton: ROI Badge */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-16 bg-gray-800/50 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-800/50 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Real Buttons (disabled) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border bg-gray-800/30 text-gray-600 border-gray-800 cursor-not-allowed"
        >
          <ArrowDownCircle className="w-4 h-4" /> Deposit
        </button>
        <button
          disabled
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border bg-gray-800/30 text-gray-600 border-gray-800 cursor-not-allowed"
        >
          <ArrowUpCircle className="w-4 h-4" /> Withdraw
        </button>
      </div>
    </div>
  );
}

/**
 * Strategy Card Skeleton
 * Shows real label and icons, skeleton for regime badge and text
 */
export function StrategyCardSkeleton() {
  return (
    <div
      className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          {/* Skeleton: Regime Badge */}
          <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 animate-pulse" />

          <div className="space-y-3">
            {/* Real Label */}
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
              Current Strategy
              <Info className="w-3 h-3" />
            </div>

            {/* Skeleton: Title */}
            <div className="h-8 w-40 bg-gray-700/50 rounded animate-pulse" />

            {/* Skeleton: Philosophy text */}
            <div className="h-4 w-64 bg-gray-800/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Real Chevron Icon */}
        <div className="p-2 rounded-full bg-gray-800 text-gray-400">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

/**
 * Portfolio Composition Skeleton
 * Shows real title, chips labels, and button; skeleton for bar/percentages
 */
export function PortfolioCompositionSkeleton() {
  return (
    <div
      className="bg-gray-900/20 border border-gray-800 rounded-2xl p-8"
      aria-hidden="true"
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          {/* Real Title */}
          <h2 className="text-xl font-bold text-white mb-1">
            Portfolio Composition
          </h2>
          <div className="text-sm text-gray-400">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-400 mr-2">Target:</span>
              {/* Skeleton: Allocation chips */}
              <div className="h-6 w-24 bg-gray-800/50 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-gray-800/50 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        {/* Real Button (disabled) */}
        <GradientButton
          gradient={GRADIENTS.PRIMARY}
          icon={Zap}
          className="h-8 text-xs opacity-50 cursor-not-allowed"
          disabled
        >
          Rebalance
        </GradientButton>
      </div>

      {/* Skeleton: Composition Bar */}
      <div className="h-24 w-full bg-gray-900/50 rounded-xl border border-gray-800 animate-pulse" />

      {/* Real Legend Labels + Skeleton Values */}
      <div className="flex justify-between mt-4 px-1">
        <div className="flex gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Crypto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Stablecoins</span>
          </div>
        </div>
        {/* Skeleton: Drift percentage */}
        <div className="h-4 w-20 bg-gray-800/50 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Complete Dashboard Skeleton
 * Combines all dashboard component skeletons for initial page load
 */
export function DashboardSkeleton() {
  return (
    <div
      data-testid="dashboard-loading"
      role="status"
      aria-label="Loading dashboard data"
      className="space-y-6"
    >
      {/* Hero Section: Balance + Strategy Cards (side by side on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-hidden="true">
        <BalanceCardSkeleton />
        <StrategyCardSkeleton />
      </div>

      {/* Portfolio Composition */}
      <div aria-hidden="true">
        <PortfolioCompositionSkeleton />
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading your portfolio dashboard...</span>
    </div>
  );
}
