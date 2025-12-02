interface AssetBadgeProps {
  symbol: string;
  variant?: "default" | "highlight";
}

/**
 * Displays an asset symbol in a styled badge
 * Used in tables, tooltips, and selection interfaces
 */
export function AssetBadge({ symbol, variant = "default" }: AssetBadgeProps) {
  const classNames =
    variant === "default"
      ? "px-1.5 py-0.5 bg-gray-700/50 text-gray-300 text-xs rounded"
      : "px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded border border-purple-500/30";

  return <span className={classNames}>{symbol.toUpperCase()}</span>;
}
