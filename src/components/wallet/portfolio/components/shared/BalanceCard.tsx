import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import type { ModalType } from "@/types/portfolio";

import { BalanceCardSkeleton } from "../../views/DashboardSkeleton";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";

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
  isLoading?: boolean;
  onOpenModal: (type: Extract<ModalType, "deposit" | "withdraw">) => void;
  lastUpdated?: string | null;
}

export function BalanceCard({
  balance,
  isEmptyState = false,
  isLoading = false,
  onOpenModal,
  lastUpdated,
}: BalanceCardProps) {
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

          {/* Empty State Message */}
          {isEmptyState && (
            <div className="text-sm text-gray-500 mb-2">
              You&apos;re viewing another user&apos;s bundle.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          data-testid="deposit-button"
          onClick={() => onOpenModal("deposit")}
          disabled={isEmptyState}
          className={getButtonClassName("deposit", isEmptyState)}
        >
          <ArrowDownCircle className="w-4 h-4" /> Deposit
        </button>
        <button
          data-testid="withdraw-button"
          onClick={() => onOpenModal("withdraw")}
          disabled={isEmptyState}
          className={getButtonClassName("withdraw", isEmptyState)}
        >
          <ArrowUpCircle className="w-4 h-4" /> Withdraw
        </button>
      </div>
    </div>
  );
}
