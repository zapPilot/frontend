"use client";

import { ArrowDownCircle, ArrowUpCircle, LayoutGrid } from "lucide-react";
import { useState } from "react";

import type {
  BorrowingSummary,
  RiskMetrics,
} from "@/services/analyticsService";
import type { ModalType } from "@/types/portfolio";

import { BalanceCardSkeleton } from "../../views/DashboardSkeleton";
import { BorrowingHealthPill } from "./BorrowingHealthPill";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { HealthFactorPill } from "./HealthFactorPill";
import { HealthWarningBanner } from "./HealthWarningBanner";

/** BalanceCard styling constants */
const STYLES = {
  card: "relative bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 flex flex-col justify-center",
  label: "text-xs text-gray-500 font-bold uppercase tracking-widest mb-1",
  netWorthActive: "text-4xl font-bold tracking-tight mb-2 text-white",
  netWorthEmpty: "text-4xl font-bold tracking-tight mb-2 text-gray-600",
  buttonBase:
    "flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors border",
  buttonDisabled:
    "bg-gray-800/30 text-gray-600 border-gray-800 cursor-not-allowed",
  depositEnabled:
    "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20",
  withdrawEnabled:
    "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20",
} as const;

/** Get button className based on action type and disabled state */
const getButtonClassName = (
  type: "deposit" | "withdraw",
  isDisabled: boolean
): string => {
  if (isDisabled) return `${STYLES.buttonBase} ${STYLES.buttonDisabled}`;
  return `${STYLES.buttonBase} ${type === "deposit" ? STYLES.depositEnabled : STYLES.withdrawEnabled}`;
};

interface BalanceCardProps {
  balance: number;
  isEmptyState?: boolean;
  /** Whether user is viewing their own bundle (enables wallet actions) */
  isOwnBundle?: boolean;
  isLoading?: boolean;
  onOpenModal: (type: Extract<ModalType, "deposit" | "withdraw">) => void;
  lastUpdated?: string | null;
  /** Risk metrics for leveraged positions (null if no leverage) */
  riskMetrics?: RiskMetrics | null;
  /** Borrowing summary for debt positions (null if no debt) */
  borrowingSummary?: BorrowingSummary | null;
  /** Optional handler for viewing detailed risk breakdown (future enhancement) */
  onViewRiskDetails?: () => void;
}

export function BalanceCard({
  balance,
  isEmptyState = false,
  isOwnBundle = true,
  isLoading = false,
  onOpenModal,
  lastUpdated,
  riskMetrics,
  borrowingSummary,
  onViewRiskDetails,
}: BalanceCardProps) {
  // Disable buttons if empty state OR not own bundle (visitor mode)
  const isActionsDisabled = isEmptyState || !isOwnBundle;
  // Layout Switcher for User Review
  const [layout, setLayout] = useState<"standard" | "split" | "integrated">("standard");

  // Show health rate (leverage) if user has leverage and is not in empty state
  const showLeverageHealth =
    !isEmptyState && riskMetrics?.has_leverage && riskMetrics.health_rate;

  // Show borrowing alert if user has debt and is not in empty state
  const showBorrowingAlert = !isEmptyState && borrowingSummary?.has_debt;

  if (isLoading) {
    return <BalanceCardSkeleton />;
  }

  return (
    <>
      {/* Mobile Critical State Warning Banner (Leverage - Always Keep) */}
      {showLeverageHealth && riskMetrics && (
        <HealthWarningBanner
          riskMetrics={riskMetrics}
          onViewDetails={onViewRiskDetails}
        />
      )}

      <div className={STYLES.card}>
        {/* Dev Switcher - Top Right (Always Visible) */}
        <div className="absolute top-2 right-2 flex gap-1 z-10 bg-black/50 p-1 rounded">
          {(["standard", "split", "integrated"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`p-1 rounded ${layout === l ? "bg-purple-500 text-white" : "text-gray-400"}`}
              title={l}
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
          ))}
        </div>

        {/* ----------------- STANDARD LAYOUT (Vertical Stack) ----------------- */}
        {layout === "standard" && (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className={STYLES.label}>Net Worth</div>
              {!isEmptyState && lastUpdated && (
                <DataFreshnessIndicator
                  lastUpdated={lastUpdated}
                  size="sm"
                  variant="icon-only"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                />
              )}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <div
                  className={
                    isEmptyState ? STYLES.netWorthEmpty : STYLES.netWorthActive
                  }
                  data-testid="net-worth"
                >
                  ${balance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Risk Indicators Row */}
            {(showLeverageHealth || showBorrowingAlert) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {showLeverageHealth && (
                  <HealthFactorPill
                    riskMetrics={riskMetrics}
                    isOwnBundle={isOwnBundle}
                    size="md"
                    {...(onViewRiskDetails && {
                      onViewDetails: onViewRiskDetails,
                    })}
                  />
                )}
                {showBorrowingAlert && borrowingSummary && (
                  <BorrowingHealthPill summary={borrowingSummary} size="md" />
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                data-testid="deposit-button"
                onClick={() => onOpenModal("deposit")}
                disabled={isActionsDisabled}
                title={
                  !isOwnBundle ? "Switch to your bundle to deposit" : undefined
                }
                className={getButtonClassName("deposit", isActionsDisabled)}
              >
                <ArrowDownCircle className="w-4 h-4" /> Deposit
              </button>
              <button
                data-testid="withdraw-button"
                onClick={() => onOpenModal("withdraw")}
                disabled={isActionsDisabled}
                title={
                  !isOwnBundle ? "Switch to your bundle to withdraw" : undefined
                }
                className={getButtonClassName("withdraw", isActionsDisabled)}
              >
                <ArrowUpCircle className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </>
        )}

        {/* ----------------- SPLIT LAYOUT (Horizontal Balance + Risk) ----------------- */}
        {layout === "split" && (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className={STYLES.label}>Net Worth</div>
                <div
                  className={
                    isEmptyState ? STYLES.netWorthEmpty : STYLES.netWorthActive
                  }
                  data-testid="net-worth"
                >
                  ${balance.toLocaleString()}
                </div>
              </div>

              {/* Right Side Risk Column */}
              <div className="flex flex-col items-end gap-1.5">
                {!isEmptyState && lastUpdated && (
                   <div className="mb-1">
                      <DataFreshnessIndicator lastUpdated={lastUpdated} size="sm" variant="text-only" className="opacity-50" />
                   </div>
                )}
                {(showLeverageHealth || showBorrowingAlert) && (
                  <>
                    {showLeverageHealth && (
                      <HealthFactorPill
                        riskMetrics={riskMetrics}
                        isOwnBundle={isOwnBundle}
                        size="sm"
                        {...(onViewRiskDetails && { onViewDetails: onViewRiskDetails })}
                      />
                    )}
                    {showBorrowingAlert && borrowingSummary && (
                      <BorrowingHealthPill summary={borrowingSummary} size="sm" />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                data-testid="deposit-button"
                onClick={() => onOpenModal("deposit")}
                disabled={isActionsDisabled}
                className={getButtonClassName("deposit", isActionsDisabled)}
              >
                <ArrowDownCircle className="w-4 h-4" /> Deposit
              </button>
              <button
                data-testid="withdraw-button"
                onClick={() => onOpenModal("withdraw")}
                disabled={isActionsDisabled}
                className={getButtonClassName("withdraw", isActionsDisabled)}
              >
                <ArrowUpCircle className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </>
        )}

        {/* ----------------- INTEGRATED LAYOUT (Compact Headers) ----------------- */}
        {layout === "integrated" && (
          <>
             <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                   <div className={STYLES.label}>Net Worth</div>
                   {/* Integrated Status Dots directly next to label */}
                   {(showLeverageHealth || showBorrowingAlert) && (
                      <div className="flex gap-1">
                         {showLeverageHealth && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Leverage Active" />}
                         {showBorrowingAlert && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Borrowing Active" />}
                      </div>
                   )}
                </div>
                {!isEmptyState && lastUpdated && (
                    <DataFreshnessIndicator lastUpdated={lastUpdated} size="sm" variant="icon-only" className="opacity-40 scale-75" />
                )}
             </div>

             <div className="flex justify-between items-end mb-5">
                <div
                  className={isEmptyState ? STYLES.netWorthEmpty : "text-3xl font-bold tracking-tight text-white"}
                  data-testid="net-worth"
                >
                  ${balance.toLocaleString()}
                </div>
                
                {/* Compact Pills on the same line as value */}
                 <div className="flex gap-2 mb-1">
                    {showLeverageHealth && (
                      <HealthFactorPill
                         riskMetrics={riskMetrics}
                         isOwnBundle={isOwnBundle}
                         size="sm"
                         {...(onViewRiskDetails && { onViewDetails: onViewRiskDetails })}
                      />
                    )}
                    {showBorrowingAlert && borrowingSummary && (
                       <BorrowingHealthPill summary={borrowingSummary} size="sm" />
                    )}
                 </div>
             </div>

             {/* Smaller Actions Row */}
             <div className="flex gap-2">
              <button
                data-testid="deposit-button"
                onClick={() => onOpenModal("deposit")}
                disabled={isActionsDisabled}
                className={`flex-1 ${getButtonClassName("deposit", isActionsDisabled)} py-1.5`}
              >
                <ArrowDownCircle className="w-3.5 h-3.5" /> Deposit
              </button>
              <button
                data-testid="withdraw-button"
                onClick={() => onOpenModal("withdraw")}
                disabled={isActionsDisabled}
                className={`flex-1 ${getButtonClassName("withdraw", isActionsDisabled)} py-1.5`}
              >
                <ArrowUpCircle className="w-3.5 h-3.5" /> Withdraw
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
