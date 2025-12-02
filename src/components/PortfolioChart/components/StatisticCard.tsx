import type { ReactNode } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

interface StatisticCardProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

/**
 * Displays a labeled statistic value in a glass-style card
 * Used for chart metrics like Sharpe Ratio, Max Drawdown, etc.
 */
export function StatisticCard({
  label,
  value,
  valueClassName = "text-gray-200",
}: StatisticCardProps) {
  return (
    <BaseCard
      variant="glass"
      padding="sm"
      borderRadius="md"
      className="border-white/10"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className={`mt-2 text-xl font-bold ${valueClassName}`}>{value}</div>
    </BaseCard>
  );
}
