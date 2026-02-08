"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  BarChart2,
  Circle,
  GripVertical,
  Layout,
  PieChart,
  X,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import type { TradeSuggestion } from "@/types/strategy";
import { cn } from "@/lib/ui/classNames";

type ReviewVariation = "bars" | "radial" | "slider";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeSuggestion[];
  totalValue: number;
}

// --- Helpers ---

// Mock portfolio state generator based on trades
const usePortfolioState = (trades: TradeSuggestion[], totalValue: number) => {
  // We infer "Current" state by reverse-engineering the trades relative to a target
  // Or just mock a plausible starting point for visualization
  const current = {
    spot: 0.45,
    lp: 0.15,
    stable: 0.4,
  };

  // Calculate target based on trades (mock logic for visual)
  // In reality, this would come from the API response
  const target = {
    spot: 0.55, // Buying spot
    lp: 0.35, // Buying LP
    stable: 0.1, // Selling stable
  };

  return { current, target };
};

const COLORS = {
  spot: "bg-orange-500",
  lp: "bg-purple-500",
  stable: "bg-emerald-500",
  spotRing: "stroke-orange-500",
  lpRing: "stroke-purple-500",
  stableRing: "stroke-emerald-500",
};

// --- Variation 1: Stacked Bars ---
function ImpactBarView({
  trades,
  totalValue,
}: {
  trades: TradeSuggestion[];
  totalValue: number;
}) {
  const { current, target } = usePortfolioState(trades, totalValue);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 py-4">
      <div className="flex justify-center gap-12 items-end h-64 px-8">
        {/* Current Bar */}
        <div className="w-24 h-full flex flex-col justify-end group">
          <div className="text-xs text-center text-gray-500 mb-2 font-medium uppercase tracking-wider">
            Before
          </div>
          <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col-reverse shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
            <div
              style={{ height: `${current.spot * 100}%` }}
              className="bg-orange-500/80 w-full relative group/segment"
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 group-hover/segment:opacity-100 transition-opacity">
                SPOT
              </span>
            </div>
            <div
              style={{ height: `${current.lp * 100}%` }}
              className="bg-purple-500/80 w-full relative group/segment"
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 group-hover/segment:opacity-100 transition-opacity">
                LP
              </span>
            </div>
            <div
              style={{ height: `${current.stable * 100}%` }}
              className="bg-emerald-500/80 w-full relative group/segment"
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 group-hover/segment:opacity-100 transition-opacity">
                USD
              </span>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center justify-center pb-12 opacity-30">
          <ArrowRight className="w-8 h-8 text-gray-400" />
        </div>

        {/* Target Bar */}
        <div className="w-24 h-full flex flex-col justify-end group">
          <div className="text-xs text-center text-indigo-500 mb-2 font-bold uppercase tracking-wider">
            After
          </div>
          <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col-reverse shadow-lg ring-2 ring-indigo-500/20">
            <div
              style={{ height: `${target.spot * 100}%` }}
              className="bg-orange-500 w-full relative group/segment"
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {(target.spot * 100).toFixed(0)}%
              </span>
            </div>
            <div
              style={{ height: `${target.lp * 100}%` }}
              className="bg-purple-500 w-full relative group/segment"
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {(target.lp * 100).toFixed(0)}%
              </span>
            </div>
            <div
              style={{ height: `${target.stable * 100}%` }}
              className="bg-emerald-500 w-full relative group/segment"
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {(target.stable * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-[10px] uppercase text-gray-500 font-bold">
            Spot Exposure
          </div>
          <div className="text-sm font-mono font-bold text-green-500">+10%</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-[10px] uppercase text-gray-500 font-bold">
            Yield Assets
          </div>
          <div className="text-sm font-mono font-bold text-green-500">+20%</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-[10px] uppercase text-gray-500 font-bold">
            Idle Cash
          </div>
          <div className="text-sm font-mono font-bold text-red-500">-30%</div>
        </div>
      </div>
    </div>
  );
}

// --- Variation 2: Radial Overlay ---
function ImpactRadialView({
  trades,
  totalValue,
}: {
  trades: TradeSuggestion[];
  totalValue: number;
}) {
  const { current, target } = usePortfolioState(trades, totalValue);

  // SVG Helpers
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  const renderSegment = (
    pct: number,
    offsetPct: number,
    color: string,
    ringRadius: number,
    opacity: number = 1
  ) => {
    const ringCircumference = 2 * Math.PI * ringRadius;
    const strokeDasharray = `${pct * ringCircumference} ${ringCircumference}`;
    const strokeDashoffset = -offsetPct * ringCircumference;
    return (
      <circle
        cx="100"
        cy="100"
        r={ringRadius}
        fill="transparent"
        strokeWidth="12"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        className={cn("transition-all duration-1000 ease-out", color)}
        strokeLinecap="round"
        style={{ opacity }}
        transform="rotate(-90 100 100)"
      />
    );
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500 flex flex-col items-center">
      <div className="relative w-64 h-64">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Inner Ring (Current) - Faded */}
          {renderSegment(current.spot, 0, COLORS.spotRing, 60, 0.3)}
          {renderSegment(current.lp, current.spot, COLORS.lpRing, 60, 0.3)}
          {renderSegment(
            current.stable,
            current.spot + current.lp,
            COLORS.stableRing,
            60,
            0.3
          )}

          {/* Outer Ring (Target) - Solid */}
          {renderSegment(target.spot, 0, COLORS.spotRing, 85)}
          {renderSegment(target.lp, target.spot, COLORS.lpRing, 85)}
          {renderSegment(
            target.stable,
            target.spot + target.lp,
            COLORS.stableRing,
            85
          )}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {(target.lp * 100).toFixed(0)}%
          </span>
          <span className="text-xs text-purple-500 font-bold uppercase tracking-wider">
            Target LP
          </span>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Spot{" "}
            <span className="text-gray-400">
              ({(current.spot * 100).toFixed(0)}% →{" "}
              <strong>{(target.spot * 100).toFixed(0)}%</strong>)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="text-xs text-gray-600 dark:text-gray-300">
            LP{" "}
            <span className="text-gray-400">
              ({(current.lp * 100).toFixed(0)}% →{" "}
              <strong>{(target.lp * 100).toFixed(0)}%</strong>)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Variation 3: Interactive Slider ---
function ImpactSliderView({
  trades,
  totalValue,
}: {
  trades: TradeSuggestion[];
  totalValue: number;
}) {
  const { current, target } = usePortfolioState(trades, totalValue);
  const [sliderValue, setSliderValue] = useState(50); // 0 = Before, 100 = After
  const isDragging = useRef(false);

  // Interpolate values based on slider
  const interp = (start: number, end: number) =>
    start + (end - start) * (sliderValue / 100);

  const spotPct = interp(current.spot, target.spot);
  const lpPct = interp(current.lp, target.lp);
  const stablePct = interp(current.stable, target.stable);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 py-4">
      {/* Visualizer */}
      <div className="h-48 flex items-end gap-1 px-8 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Bars */}
        <div
          style={{ width: "33%", height: `${spotPct * 100}%` }}
          className="bg-orange-500 rounded-t-xl transition-all duration-75 relative group"
        >
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-orange-500">
            {(spotPct * 100).toFixed(0)}%
          </span>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-orange-900/50 uppercase">
            Spot
          </div>
        </div>
        <div
          style={{ width: "33%", height: `${lpPct * 100}%` }}
          className="bg-purple-500 rounded-t-xl transition-all duration-75 relative group"
        >
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-purple-500">
            {(lpPct * 100).toFixed(0)}%
          </span>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-900/50 uppercase">
            LP
          </div>
        </div>
        <div
          style={{ width: "33%", height: `${stablePct * 100}%` }}
          className="bg-emerald-500 rounded-t-xl transition-all duration-75 relative group"
        >
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-500">
            {(stablePct * 100).toFixed(0)}%
          </span>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-900/50 uppercase">
            Cash
          </div>
        </div>
      </div>

      {/* Slider Control */}
      <div className="px-4">
        <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center px-2 select-none touch-none">
          <div className="absolute left-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Before
          </div>
          <div className="absolute right-4 text-xs font-bold text-indigo-500 uppercase tracking-wider">
            After
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={e => setSliderValue(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />

          <div
            className="absolute h-8 w-12 bg-white dark:bg-black rounded-full shadow-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center z-10 transition-all duration-75 ease-linear pointer-events-none"
            style={{ left: `calc(${sliderValue}% - 24px + 12px)` }} // simple centering adjustment
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          Drag to simulate the rebalancing effect
        </p>
      </div>
    </div>
  );
}

// --- Main Modal ---

export function ReviewModal({
  isOpen,
  onClose,
  trades,
  totalValue,
}: ReviewModalProps) {
  const [variation, setVariation] = useState<ReviewVariation>("bars");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-black w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-black z-20">
          <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Confirm Strategy
            </h3>
            <p className="text-sm text-gray-500">
              Executing {trades.length} bundle actions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variation Switcher */}
        <div className="px-6 pt-4 flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-lg inline-flex gap-1">
            {[
              { id: "bars", icon: BarChart2, label: "Bars" },
              { id: "radial", icon: PieChart, label: "Radial" },
              { id: "slider", icon: Layout, label: "Slider" },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setVariation(v.id as ReviewVariation)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  variation === v.id
                    ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                )}
              >
                <v.icon className="w-3 h-3" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-[350px]">
          {variation === "bars" && (
            <ImpactBarView trades={trades} totalValue={totalValue} />
          )}
          {variation === "radial" && (
            <ImpactRadialView trades={trades} totalValue={totalValue} />
          )}
          {variation === "slider" && (
            <ImpactSliderView trades={trades} totalValue={totalValue} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <button className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2">
            Confirm & Sign Bundle
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
