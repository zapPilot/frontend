/**
 * Portfolio Layout - Variation 1: Conservative Merge
 *
 * DEMO COMPONENT - DELETE AFTER SELECTION
 *
 * Layout:
 * [Balance] [ROI] [Sentiment + Regime]  ← 3-col grid
 * [RebalanceSection - Quote ONLY here]   ← Full width
 * [Zap In] [Zap Out]                     ← 2-col grid
 *
 * Changes from original:
 * - Sentiment card enhanced with regime label
 * - Quote removed from sentiment (appears only in regime section)
 * - Minimal refactoring, preserves current structure
 */

"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft,ArrowUpRight, Settings } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, type RegimeId,regimes } from "../regime/regimeData";
import { ALLOCATION_GRADIENTS,AllocationProgressBar } from "../regime/RegimeUtils";
import { MarketSentimentMetricV1 } from "./MarketSentimentMetricV1";
import { MOCK_DATA } from "./mockPortfolioData";

/**
 * Simplified Balance Card for demo
 */
function BalanceCard() {
  return (
    <div className="relative bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition-colors h-[140px]">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />
      <div className="p-3 h-full flex flex-col items-center justify-start pt-2">
        <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-0.5">
          <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">
            Portfolio Balance
          </span>
        </div>
        <div className="flex items-end gap-1 mb-0.5">
          <span className="text-lg md:text-xl font-bold text-white tracking-tight">
            ${MOCK_DATA.balance.toLocaleString()}
          </span>
        </div>
        <div className="w-full mt-auto grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-[9px] text-gray-500 uppercase">Positions</p>
            <p className="text-xs font-medium text-gray-300">{MOCK_DATA.positions}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 uppercase">Protocols</p>
            <p className="text-xs font-medium text-gray-300">{MOCK_DATA.protocols}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 uppercase">Chains</p>
            <p className="text-xs font-medium text-gray-300">{MOCK_DATA.chains}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified ROI Card for demo
 */
function ROICard() {
  return (
    <div className="relative bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition-colors h-[140px]">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500" />
      <div className="p-3 h-full flex flex-col items-center justify-start pt-2">
        <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 mb-0.5">
          <span className="text-[10px] text-green-400 uppercase tracking-wider font-medium">
            Performance
          </span>
        </div>
        <div className="flex items-end gap-1.5 mb-0.5">
          <span className="text-lg md:text-xl font-bold text-green-400 tracking-tight">
            +{MOCK_DATA.roi}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-auto">30-day ROI</p>
        <div className="w-full grid grid-cols-2 gap-2 mt-auto">
          <div className="text-center">
            <p className="text-[9px] text-gray-500 uppercase">7d</p>
            <p className="text-xs font-medium text-green-400">+{MOCK_DATA.roiChange7d}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-gray-500 uppercase">30d</p>
            <p className="text-xs font-medium text-green-400">+{MOCK_DATA.roiChange30d}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Regime Node Component (from RebalanceSection)
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

export function WalletPortfolioPresenterV1() {
  const [previewRegime, setPreviewRegime] = useState<RegimeId | null>(null);

  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);
  const displayRegime = previewRegime ? getRegimeById(previewRegime) : currentRegime;

  const isOptimal =
    MOCK_DATA.currentAllocation.crypto === MOCK_DATA.targetAllocation.crypto &&
    MOCK_DATA.currentAllocation.stable === MOCK_DATA.targetAllocation.stable;

  const handleRegimeClick = (regimeId: RegimeId) => {
    setPreviewRegime(regimeId === MOCK_DATA.currentRegime ? null : regimeId);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceCard />
        <ROICard />
        <MarketSentimentMetricV1
          value={MOCK_DATA.sentimentValue}
          status={MOCK_DATA.sentimentStatus}
          regimeLabel={currentRegime.label}
        />
      </div>

      {/* Regime Section (quote appears ONLY here) */}
      <motion.div
        className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold mb-1">
            Market Regime: <span style={{ color: currentRegime.fillColor }}>{currentRegime.label.toUpperCase()}</span>
          </h2>
          {previewRegime && (
            <p className="text-xs text-gray-400">
              Previewing: <span style={{ color: displayRegime.fillColor }}>{displayRegime.label}</span>
            </p>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            <svg viewBox="0 0 600 80" className="w-full h-auto">
              <path d="M 50 40 L 550 40" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2" fill="none" />
              {regimes.map((regime, index) => (
                <RegimeNode
                  key={regime.id}
                  regime={regime}
                  position={getNodePosition(index, false)}
                  isActive={regime.id === MOCK_DATA.currentRegime}
                  onClick={handleRegimeClick}
                  isMobile={false}
                />
              ))}
            </svg>
            <div className="space-y-3">
              <AllocationProgressBar
                label="Your Current Allocation"
                percentage={MOCK_DATA.currentAllocation.crypto}
                gradient={ALLOCATION_GRADIENTS.crypto}
                animated
              />
              <AllocationProgressBar
                label="Recommended Allocation"
                percentage={MOCK_DATA.targetAllocation.crypto}
                gradient={`linear-gradient(180deg, ${displayRegime.fillColor} 0%, ${displayRegime.fillColor}CC 100%)`}
                animated
              />
            </div>
          </div>

          {/* Detail Panel - Quote appears HERE */}
          <div className="bg-gray-800/30 backdrop-blur rounded-xl p-4 border border-gray-700 space-y-4">
            <h3 className="text-lg font-bold" style={{ color: displayRegime.fillColor }}>
              {displayRegime.label} Strategy
            </h3>
            <blockquote className="text-sm italic text-gray-300">{displayRegime.philosophy}</blockquote>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Current:</span>
                <span className="text-white">
                  {MOCK_DATA.currentAllocation.crypto}% / {MOCK_DATA.currentAllocation.stable}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target:</span>
                <span className="font-medium" style={{ color: displayRegime.fillColor }}>
                  {MOCK_DATA.targetAllocation.crypto}% / {MOCK_DATA.targetAllocation.stable}%
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-400">Delta:</span>
                <span className={MOCK_DATA.delta > 0 ? "text-blue-400" : "text-orange-400"}>
                  {MOCK_DATA.delta > 0 ? "↗" : "↘"} {Math.abs(MOCK_DATA.delta)}% crypto
                </span>
              </div>
            </div>
            <GradientButton
              gradient={GRADIENTS.PRIMARY}
              shadowColor="purple-500"
              icon={Settings}
              disabled={isOptimal}
              className="w-full"
            >
              <span className="text-sm">{isOptimal ? "Optimal" : "Optimize Portfolio"}</span>
            </GradientButton>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4">
          <div className="overflow-x-auto -mx-4 px-4">
            <svg viewBox="0 0 350 80" className="w-full min-w-[350px] h-auto">
              <path d="M 50 40 L 300 40" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2" fill="none" />
              {regimes.map((regime, index) => (
                <RegimeNode
                  key={regime.id}
                  regime={regime}
                  position={getNodePosition(index, true)}
                  isActive={regime.id === MOCK_DATA.currentRegime}
                  onClick={handleRegimeClick}
                  isMobile={true}
                />
              ))}
            </svg>
          </div>
          <div className="bg-gray-800/30 backdrop-blur rounded-xl p-4 border border-gray-700 space-y-3">
            <h3 className="text-base font-bold" style={{ color: displayRegime.fillColor }}>
              {displayRegime.label}
            </h3>
            <blockquote className="text-xs italic text-gray-300">{displayRegime.philosophy}</blockquote>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Current:</span>
                <span className="text-white">
                  {MOCK_DATA.currentAllocation.crypto}% / {MOCK_DATA.currentAllocation.stable}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target:</span>
                <span style={{ color: displayRegime.fillColor }}>
                  {MOCK_DATA.targetAllocation.crypto}% / {MOCK_DATA.targetAllocation.stable}%
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <AllocationProgressBar
              label="Current"
              percentage={MOCK_DATA.currentAllocation.crypto}
              gradient={ALLOCATION_GRADIENTS.crypto}
              animated
            />
            <AllocationProgressBar
              label="Target"
              percentage={MOCK_DATA.targetAllocation.crypto}
              gradient={`linear-gradient(180deg, ${displayRegime.fillColor} 0%, ${displayRegime.fillColor}CC 100%)`}
              animated
            />
          </div>
          <GradientButton
            gradient={GRADIENTS.PRIMARY}
            shadowColor="purple-500"
            icon={Settings}
            disabled={isOptimal}
            className="w-full"
          >
            <span className="text-sm">{isOptimal ? "Optimal" : "Optimize Portfolio"}</span>
          </GradientButton>
        </div>
      </motion.div>

      {/* Zap Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <GradientButton gradient={GRADIENTS.SUCCESS} shadowColor="green-500" icon={ArrowUpRight}>
          <span className="text-sm">Zap In</span>
        </GradientButton>
        <GradientButton gradient={GRADIENTS.DANGER} shadowColor="red-500" icon={ArrowDownLeft}>
          <span className="text-sm">Zap Out</span>
        </GradientButton>
      </div>
    </div>
  );
}
