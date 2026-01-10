import { Info } from "lucide-react";
import { useState } from "react";

import { getRiskConfig } from "@/constants/riskThresholds";

/**
 * Health Rate Indicator Component
 *
 * Displays portfolio health rate for leveraged positions with color-coded risk levels.
 * Only shown when user has active leverage (conditional rendering in parent).
 *
 * Health Rate represents portfolio safety:
 * - Formula: (Collateral * LTV) / Debt
 * - 1.0 = 100% (at liquidation threshold)
 * - >1.0 = Safe (buffer above liquidation)
 * - <1.0 = Underwater (at risk of immediate liquidation)
 */

interface HealthRateIndicatorProps {
  /** Portfolio health rate (1.0 = 100%) */
  healthRate: number;
  /** Whether user is viewing their own bundle (affects tooltip messaging) */
  isOwnBundle?: boolean;
  /** Optional click handler for details modal */
  onClick?: () => void;
}

export function HealthRateIndicator({
  healthRate,
  isOwnBundle = true,
  onClick,
}: HealthRateIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = getRiskConfig(healthRate);

  // Format health rate as percentage (1.75 -> "175%")
  const healthRatePercent = (healthRate * 100).toFixed(0);

  return (
    <div className="relative mb-2">
      <div
        className={`
          flex items-center justify-between p-3 rounded-lg
          border ${config.colors.border} ${config.colors.bg}
          ${onClick ? "cursor-pointer hover:bg-opacity-20 transition-all" : ""}
        `}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Health Rate</span>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-400 transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={e => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            aria-label="Health rate information"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold ${config.colors.text}`}
            data-testid="health-rate-value"
          >
            {healthRatePercent}%
          </span>
          <span className="text-base" role="img" aria-label={config.label}>
            {config.emoji}
          </span>
          <span
            className={`text-xs font-medium ${config.colors.text}`}
            data-testid="health-rate-status"
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-xs">
          <div className="space-y-2">
            <p className="text-gray-300 font-medium">
              Health Rate measures your leverage position safety
            </p>
            <div className="space-y-1 text-gray-400">
              <p>
                • <span className="text-green-400">Safe ({">"} 200%)</span>:{" "}
                Large safety buffer
              </p>
              <p>
                • <span className="text-yellow-400">Moderate (150-200%)</span>:
                Comfortable buffer
              </p>
              <p>
                • <span className="text-orange-400">Risky (120-150%)</span>: Low
                buffer
              </p>
              <p>
                • <span className="text-red-400">Critical ({"<"} 120%)</span>:
                Liquidation risk
              </p>
            </div>
            {isOwnBundle && (
              <p className="text-gray-500 italic pt-1 border-t border-gray-700">
                {onClick
                  ? "Click for detailed risk breakdown"
                  : "Monitor closely if below 150%"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
