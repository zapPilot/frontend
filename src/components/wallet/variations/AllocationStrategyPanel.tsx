/**
 * Allocation Strategy Panel - Variation 3
 *
 * Focuses on allocation state with prominent Optimize button.
 * Timeline moved to bottom (secondary detail).
 */

"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, type RegimeId,regimes } from "../regime/regimeData";
import { ALLOCATION_GRADIENTS,AllocationProgressBar } from "../regime/RegimeUtils";

interface AllocationStrategyPanelProps {
  currentRegimeId: RegimeId;
  currentAllocation: { crypto: number; stable: number };
  targetAllocation: { crypto: number; stable: number };
  delta: number;
  philosophy: string;
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

export function AllocationStrategyPanel({
  currentRegimeId,
  currentAllocation,
  targetAllocation,
  delta,
  philosophy,
}: AllocationStrategyPanelProps) {
  const [previewRegime, setPreviewRegime] = useState<RegimeId | null>(null);

  const currentRegime = getRegimeById(currentRegimeId);
  const displayRegime = previewRegime ? getRegimeById(previewRegime) : currentRegime;

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
      <h2 className="text-xl font-bold mb-6">Portfolio Positioning</h2>

      {/* Allocation Bars + Optimize Button Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6 mb-6">
        {/* Allocation Bars */}
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

          {/* Delta - Prominent */}
          <div className="flex items-center justify-between pt-2 px-2">
            <span className="text-sm text-gray-400">Distance from target:</span>
            <span className={`text-lg font-bold ${delta > 0 ? "text-blue-400" : "text-orange-400"}`}>
              {delta > 0 ? "↗" : "↘"} {Math.abs(delta)}%
            </span>
          </div>
        </div>

        {/* Optimize Button - Prominent placement */}
        <div className="flex items-center justify-center lg:items-start">
          <GradientButton
            gradient={GRADIENTS.PRIMARY}
            shadowColor="purple-500"
            icon={Settings}
            disabled={isOptimal}
            className="w-full lg:h-full min-h-[100px]"
          >
            <div className="flex flex-col items-center gap-1">
              <Settings className="w-6 h-6" />
              <span className="text-sm font-medium">{isOptimal ? "Optimal" : "Rebalance Now"}</span>
            </div>
          </GradientButton>
        </div>
      </div>

      {/* Regime Philosophy */}
      <div className="mb-6 bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Regime Philosophy:</h4>
        <blockquote className="text-sm italic text-gray-300">&ldquo;{philosophy}&rdquo;</blockquote>
      </div>

      {/* Timeline - Bottom (secondary detail) */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Market Regimes:</h4>
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
    </motion.div>
  );
}
