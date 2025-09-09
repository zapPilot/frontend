/**
 * Drawdown Status Component
 *
 * Shows current drawdown status with historical context
 */

import { formatCurrency, formatDate, isInDrawdown } from "../../../utils/risk";

interface DrawdownStatusProps {
  currentDrawdownPct: number;
  peakValue: number;
  troughValue: number;
  maxDrawdownDate: string;
  recoveryNeededPct: number;
  className?: string;
}

export function DrawdownStatus({
  currentDrawdownPct,
  peakValue,
  troughValue,
  maxDrawdownDate,
  recoveryNeededPct,
  className = "",
}: DrawdownStatusProps) {
  const inDrawdown = isInDrawdown(currentDrawdownPct);

  return (
    <div className="space-y-4">
      {/* Historical Context */}
      <div className="text-gray-300 text-sm leading-relaxed">
        <p className="mb-3">
          <strong>Historical context:</strong> Your portfolio peaked at{" "}
          <span className="text-green-400 font-semibold">
            {formatCurrency(peakValue)}
          </span>{" "}
          and declined to{" "}
          <span className="text-red-400 font-semibold">
            {formatCurrency(troughValue)}
          </span>
          {recoveryNeededPct > 0 && (
            <span>
              {", "}requiring a{" "}
              <span className="text-orange-400 font-semibold">
                {recoveryNeededPct.toFixed(1)}%
              </span>{" "}
              gain to fully recover
            </span>
          )}
          .
        </p>
        <p className="mb-3">
          This maximum drawdown occurred on {formatDate(maxDrawdownDate)}.
        </p>
      </div>

      {/* Current Status */}
      <div
        className={`p-4 rounded-lg ${
          inDrawdown
            ? "bg-red-900/20 border border-red-800/30"
            : "bg-green-900/20 border border-green-800/30"
        } ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">
            Current Status
          </span>
          <span
            className={`text-sm font-semibold ${
              inDrawdown ? "text-red-300" : "text-green-300"
            }`}
            role="status"
            aria-live="polite"
          >
            {inDrawdown
              ? `In Drawdown (${currentDrawdownPct.toFixed(1)}%)`
              : "Above Previous Peak"}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {inDrawdown
            ? "Portfolio is currently below its previous peak value"
            : "Portfolio has recovered from maximum drawdown"}
        </div>
      </div>
    </div>
  );
}
