/**
 * Reusable Risk Level Badge Component
 *
 * Displays risk level with appropriate styling and colors
 */

import { RiskLevel } from "../../types/risk";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const levelStyles: Record<RiskLevel, string> = {
  Low: "bg-green-900/30 text-green-400",
  Medium: "bg-yellow-900/30 text-yellow-400",
  High: "bg-red-900/30 text-red-400",
  "Very High": "bg-red-900/40 text-red-300 border border-red-800/50",
};

export function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  const levelClasses = levelStyles[level];
  const fullClassName = `${baseClasses} ${levelClasses} ${className}`.trim();

  return <span className={fullClassName}>{level}</span>;
}
