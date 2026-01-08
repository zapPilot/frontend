import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import type { RiskMetrics } from "@/services/analyticsService";
import type { ModalType } from "@/types/portfolio";

import { BalanceCardSkeleton } from "../../views/DashboardSkeleton";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { HealthRateIndicator } from "./HealthRateIndicator";

/** BalanceCard styling constants */
const STYLES = {
  card: "bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 flex flex-col justify-center",
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
  onViewRiskDetails,
}: BalanceCardProps) {
  // Disable buttons if empty state OR not own bundle (visitor mode)
  const isActionsDisabled = isEmptyState || !isOwnBundle;

  // Show health rate indicator if user has leverage and is not in empty state
  const showHealthRate =
    !isEmptyState && riskMetrics?.has_leverage && riskMetrics.health_rate;

  if (isLoading) {
    return <BalanceCardSkeleton />;
  }

  return (
    <div className={STYLES.card}>
      <div className="flex items-center justify-between mb-2">
        <div className={STYLES.label}>Net Worth</div>
        {!isEmptyState && lastUpdated && (
          <DataFreshnessIndicator lastUpdated={lastUpdated} size="sm" />
        )}
      </div>
      <div className={`flex items-center gap-3 ${showHealthRate ? "mb-2" : "mb-4"}`}>
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

      {/* Health Rate Indicator (conditional - only for leveraged positions) */}
      {showHealthRate && (
        <HealthRateIndicator
          healthRate={riskMetrics.health_rate}
          isOwnBundle={isOwnBundle}
          {...(onViewRiskDetails ? { onClick: onViewRiskDetails } : {})}
        />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          data-testid="deposit-button"
          onClick={() => onOpenModal("deposit")}
          disabled={isActionsDisabled}
          title={!isOwnBundle ? "Switch to your bundle to deposit" : undefined}
          className={getButtonClassName("deposit", isActionsDisabled)}
        >
          <ArrowDownCircle className="w-4 h-4" /> Deposit
        </button>
        <button
          data-testid="withdraw-button"
          onClick={() => onOpenModal("withdraw")}
          disabled={isActionsDisabled}
          title={!isOwnBundle ? "Switch to your bundle to withdraw" : undefined}
          className={getButtonClassName("withdraw", isActionsDisabled)}
        >
          <ArrowUpCircle className="w-4 h-4" /> Withdraw
        </button>
      </div>
    </div>
  );
}
