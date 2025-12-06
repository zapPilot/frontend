/**
 * Unified Strategy Panel - Variation 2
 *
 * Merges sentiment and regime into single cohesive "strategy" section.
 * Includes: Sentiment metrics, regime timeline, philosophy, allocation bars, optimize button.
 */

"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, type RegimeId,regimes } from "../regime/regimeData";
import { ALLOCATION_GRADIENTS,AllocationProgressBar } from "../regime/RegimeUtils";

interface StrategyPanelProps {
  sentimentValue: number;
  sentimentStatus: string;
  currentRegimeId: RegimeId;
  currentAllocation: { crypto: number; stable: number };
  targetAllocation: { crypto: number; stable: number };
  delta: number;
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
 * Regime Node Component
 */
interface RegimeNodeProps {
  regime: { id: RegimeId; label: string; fillColor: string; allocation: { crypto: number; stable: number } };
  position: { x: number; y: number };
  isActive: boolean;
  onClick: (regimeId: RegimeId) => void;
  isMobile: boolean;
}

function RegimeNode({ regime, position, isActive, onClick, isMobile }: RegimeNodeProps) {
  const radius = isActive ? 10 : 6;

  return (
    <g className="cursor-pointer transition-all" onClick={() => onClick(regime.id)}>
      {isActive && (
        <motion.circle
          cx={position.x}
          cy={position.y}
          r={14}
          fill="none"
          stroke={regime.fillColor}
          strokeWidth="1"
          opacity="0.3"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.circle
        cx={position.x}
        cy={position.y}
        r={radius}
        fill={regime.fillColor}
        stroke="white"
        strokeWidth="2"
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
        whileHover={{ scale: 1.2 }}
      />
      {!isMobile && (
        <text
          x={position.x}
          y={position.y - 18}
          textAnchor="middle"
          className={`text-xs ${isActive ? "fill-white font-bold" : "fill-gray-400"}`}
        >
          {regime.id.toUpperCase()}
        </text>
      )}
      <text
        x={position.x}
        y={position.y + 28}
        textAnchor="middle"
        className={`text-[10px] ${isActive ? "fill-gray-200" : "fill-gray-500"}`}
      >
        {regime.allocation.crypto}/{regime.allocation.stable}
      </text>
    </g>
  );
}

function getNodePosition(index: number, isMobile: boolean): { x: number; y: number } {
  const totalWidth = isMobile ? 300 : 500;
  const spacing = totalWidth / (regimes.length - 1);
  const x = 50 + index * spacing;
  const y = 40;
  return { x, y };
}

export function StrategyPanel({
  sentimentValue,
  sentimentStatus,
  currentRegimeId,
  currentAllocation,
  targetAllocation,
  delta,
}: StrategyPanelProps) {
  const [previewRegime, setPreviewRegime] = useState<RegimeId | null>(null);

  const currentRegime = getRegimeById(currentRegimeId);
  const displayRegime = previewRegime ? getRegimeById(previewRegime) : currentRegime;
  const sentimentColor = getSentimentColor(sentimentStatus);

  const isOptimal = currentAllocation.crypto === targetAllocation.crypto && currentAllocation.stable === targetAllocation.stable;

  const handleRegimeClick = (regimeId: RegimeId) => {
    setPreviewRegime(regimeId === currentRegimeId ? null : regimeId);
  };

  return (
    <motion.div
      className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-xl font-bold mb-6">Market-Adaptive Strategy</h2>

      {/* Top Section: Sentiment + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 mb-6">
        {/* Sentiment Indicator */}
        <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Sentiment</p>
            <div className="flex items-end justify-center gap-1.5">
              <span className={`text-3xl font-bold ${sentimentColor}`}>{sentimentValue}</span>
              <span className="text-sm text-gray-400 mb-1">/100</span>
            </div>
            <p className={`text-sm font-medium ${sentimentColor} uppercase tracking-wide`}>{sentimentStatus}</p>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mt-3">
              <div
                className={`h-full ${
                  sentimentValue >= 50
                    ? "bg-gradient-to-r from-orange-500 to-rose-500"
                    : "bg-gradient-to-r from-emerald-500 to-lime-500"
                }`}
                style={{ width: `${sentimentValue}%` }}
              />
            </div>
          </div>
        </div>

        {/* Regime Timeline */}
        <div>
          <div className="hidden lg:block">
            <svg viewBox="0 0 600 80" className="w-full h-auto">
              <path d="M 50 40 L 550 40" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2" fill="none" />
              {regimes.map((regime, index) => (
                <RegimeNode
                  key={regime.id}
                  regime={regime}
                  position={getNodePosition(index, false)}
                  isActive={regime.id === currentRegimeId}
                  onClick={handleRegimeClick}
                  isMobile={false}
                />
              ))}
            </svg>
          </div>
          <div className="lg:hidden overflow-x-auto -mx-6 px-6">
            <svg viewBox="0 0 350 80" className="w-full min-w-[350px] h-auto">
              <path d="M 50 40 L 300 40" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2" fill="none" />
              {regimes.map((regime, index) => (
                <RegimeNode
                  key={regime.id}
                  regime={regime}
                  position={getNodePosition(index, true)}
                  isActive={regime.id === currentRegimeId}
                  onClick={handleRegimeClick}
                  isMobile={true}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Active Regime Info */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2" style={{ color: displayRegime.fillColor }}>
          Active Regime: {displayRegime.label}
        </h3>
        {previewRegime && (
          <p className="text-xs text-gray-400 mb-2">
            Previewing: <span style={{ color: displayRegime.fillColor }}>{displayRegime.label}</span>
          </p>
        )}
        <blockquote className="text-sm italic text-gray-300">&ldquo;{displayRegime.philosophy}&rdquo;</blockquote>
      </div>

      {/* Portfolio Alignment */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Portfolio Alignment</h4>
        <div className="space-y-3">
          <AllocationProgressBar
            label="Current"
            percentage={currentAllocation.crypto}
            gradient={ALLOCATION_GRADIENTS.crypto}
            animated
          />
          <AllocationProgressBar
            label="Target"
            percentage={targetAllocation.crypto}
            gradient={`linear-gradient(180deg, ${displayRegime.fillColor} 0%, ${displayRegime.fillColor}CC 100%)`}
            animated
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-sm">
          <span className="text-gray-400">Gap:</span>
          <span className={delta > 0 ? "text-blue-400 font-medium" : "text-orange-400 font-medium"}>
            {delta > 0 ? "↗" : "↘"} {Math.abs(delta)}% crypto needed
          </span>
        </div>
      </div>

      {/* Optimize Button - Integrated into panel */}
      <GradientButton
        gradient={GRADIENTS.PRIMARY}
        shadowColor="purple-500"
        icon={Settings}
        disabled={isOptimal}
        className="w-full"
      >
        <span className="text-sm">{isOptimal ? "Portfolio Optimal" : "Optimize Portfolio"}</span>
      </GradientButton>
    </motion.div>
  );
}
