import { ArrowDownCircle, ArrowUpCircle, ArrowUpRight } from "lucide-react";

import type { ModalType } from "@/types/portfolio";

import { BalanceCardSkeleton } from "../views/DashboardSkeleton";

/** BalanceCard styling constants */
const STYLES = {
  card: "bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 flex flex-col justify-center",
  label: "text-xs text-gray-500 font-bold uppercase tracking-widest mb-2",
  netWorthActive: "text-5xl font-bold tracking-tight mb-4 text-white",
  netWorthEmpty: "text-5xl font-bold tracking-tight mb-4 text-gray-600",
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
  roi: number;
  isEmptyState?: boolean;
  isLoading?: boolean;
  onOpenModal: (type: Extract<ModalType, "deposit" | "withdraw">) => void;
}

export function BalanceCard({
  balance,
  roi,
  isEmptyState = false,
  isLoading = false,
  onOpenModal,
}: BalanceCardProps) {
  if (isLoading) {
    return <BalanceCardSkeleton />;
  }

  return (
    <div className={STYLES.card}>
      <div className={STYLES.label}>Net Worth</div>
      <div className="flex items-center gap-3 mb-6">
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
            <div className="text-sm text-gray-500 mb-3">
              Connect your wallet to view your portfolio balance and performance
            </div>
          )}

          {/* ROI Badge - Hidden when empty */}
          {!isEmptyState && (
            <div className="flex items-center gap-3">
              <span
                className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded flex items-center gap-1"
                data-testid="performance-change"
              >
                <ArrowUpRight className="w-3 h-3" /> {roi}%
              </span>
              <span className="text-xs text-gray-500">All Time Return</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
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
