/**
 * Regime Status Card - Variation 3
 *
 * Compact sentiment + regime visualization.
 * Shows current market status with mini timeline.
 */

"use client";

import { motion } from "framer-motion";

import { getRegimeById, type RegimeId,regimes } from "../regime/regimeData";

interface RegimeStatusCardProps {
  sentimentValue: number;
  sentimentStatus: string;
  currentRegimeId: RegimeId;
}

const SENTIMENT_COLOR_MAP: Record<string, string> = {
  "Extreme Fear": "text-emerald-400",
  Fear: "text-lime-400",
  Neutral: "text-amber-300",
  Greed: "text-orange-400",
  "Extreme Greed": "text-rose-400",
};

function getSentimentColor(status: string): string {
  return SENTIMENT_COLOR_MAP[status] ?? "text-gray-300";
}

/**
 * Mini Regime Node
 */
function MiniRegimeNode({ regime, isActive }: { regime: { id: RegimeId; fillColor: string }; isActive: boolean }) {
  return (
    <circle
      r={isActive ? 8 : 5}
      fill={regime.fillColor}
      stroke="white"
      strokeWidth={isActive ? "2" : "1"}
      opacity={isActive ? 1 : 0.5}
    />
  );
}

export function RegimeStatusCard({ sentimentValue, sentimentStatus, currentRegimeId }: RegimeStatusCardProps) {
  const currentRegime = getRegimeById(currentRegimeId);
  const sentimentColor = getSentimentColor(sentimentStatus);

  return (
    <div className="relative bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition-colors">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          sentimentValue >= 50
            ? "bg-gradient-to-b from-orange-500 to-rose-500"
            : "bg-gradient-to-b from-emerald-500 to-lime-500"
        }`}
      />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className={`px-2 py-0.5 rounded-full bg-${sentimentColor.replace('text-', '')}/10 border border-${sentimentColor.replace('text-', '')}/20 inline-block`}>
          <span className={`text-[10px] ${sentimentColor} uppercase tracking-wider font-medium`}>
            Market Regime
          </span>
        </div>

        {/* Sentiment Score */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Sentiment</p>
          <div className="flex items-end justify-center gap-1.5 mb-1">
            <span className={`text-2xl font-bold ${sentimentColor}`}>{sentimentValue}</span>
            <span className="text-sm text-gray-400 mb-0.5">/100</span>
          </div>
          <p className={`text-xs font-medium ${sentimentColor} uppercase`}>{sentimentStatus}</p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mt-2">
            <motion.div
              className={
                sentimentValue >= 50
                  ? "h-full bg-gradient-to-r from-orange-500 to-rose-500"
                  : "h-full bg-gradient-to-r from-emerald-500 to-lime-500"
              }
              initial={{ width: 0 }}
              animate={{ width: `${sentimentValue}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Active Regime */}
        <div className="bg-gray-800/30 rounded-lg p-2 text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Active</p>
          <p className="text-sm font-bold" style={{ color: currentRegime.fillColor }}>
            {currentRegime.label}
          </p>
        </div>

        {/* Mini Timeline */}
        <svg viewBox="0 0 200 30" className="w-full h-auto">
          <line x1="20" y1="15" x2="180" y2="15" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2" />
          {regimes.map((regime, index) => {
            const x = 20 + (index * 160) / (regimes.length - 1);
            return (
              <g key={regime.id} transform={`translate(${x}, 15)`}>
                <MiniRegimeNode regime={regime} isActive={regime.id === currentRegimeId} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
