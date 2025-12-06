"use client";

import { motion } from "framer-motion";
import { ArrowRight,Maximize2, Settings, TrendingUp, Zap } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, regimes } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV12() {
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl aspect-[16/9] max-h-[800px] grid grid-cols-12 grid-rows-6 gap-4">
        
        {/* BLOCK 1: BALANCE (Top Left - 4x2) */}
        <div className="col-span-12 md:col-span-4 row-span-2 bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
           <div>
             <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Net Worth</div>
             <div className="text-4xl font-bold text-white tracking-tight">${MOCK_DATA.balance.toLocaleString()}</div>
           </div>
           <div className="flex items-center gap-2">
             <div className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold flex items-center gap-1">
               <TrendingUp className="w-3 h-3" /> {MOCK_DATA.roi}%
             </div>
             <div className="text-xs text-gray-500">vs Last Month</div>
           </div>
        </div>

        {/* BLOCK 2: REGIME (Top Center - 5x2) */}
        <div className="col-span-12 md:col-span-5 row-span-2 bg-gray-900/40 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Active Strategy</div>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentRegime.fillColor }} />
                    {currentRegime.label}
                  </div>
                </div>
                <div className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 font-mono">
                  IDX: {MOCK_DATA.sentimentValue}
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                "{currentRegime.philosophy}"
              </p>
           </div>
        </div>

        {/* BLOCK 3: ACTIONS (Top Right - 3x2) */}
        <div className="col-span-12 md:col-span-3 row-span-2 bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center gap-3">
           <GradientButton gradient={GRADIENTS.PRIMARY} className="w-full" icon={Zap}>Optimize</GradientButton>
           <div className="grid grid-cols-2 gap-2">
             <button className="py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-xs text-gray-300 transition-colors">Zap In</button>
             <button className="py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-xs text-gray-300 transition-colors">Zap Out</button>
           </div>
        </div>

        {/* BLOCK 4: ALLOCATION TREEMAP (Bottom Main - 8x4) */}
        <div className="col-span-12 md:col-span-8 row-span-4 bg-gray-900/20 border border-gray-800 rounded-2xl p-6 flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-white">Asset Composition</h3>
             <div className="flex gap-4 text-xs text-gray-500">
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Crypto</span>
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Stable</span>
             </div>
           </div>

           {/* Treemap / Stacked Bar Hybrid */}
           <div className="flex-1 flex gap-1">
              {/* Crypto Stack */}
              <div className="flex-1 flex flex-col gap-1">
                 {MOCK_DATA.currentAllocation.constituents.crypto.map((asset) => (
                   <div 
                    key={asset.symbol}
                    className="w-full bg-gray-800 rounded-lg relative group overflow-hidden transition-all hover:scale-[1.02]"
                    style={{ flex: asset.value, backgroundColor: `${asset.color}20`, borderColor: `${asset.color}40`, border: '1px solid' }}
                   >
                      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className="font-bold text-white">{asset.symbol}</span>
                        <span className="font-mono text-white/60">{asset.value}%</span>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Stable Stack */}
              <div className="w-1/3 flex flex-col gap-1">
                 {MOCK_DATA.currentAllocation.constituents.stable.map((asset) => (
                   <div 
                    key={asset.symbol}
                    className="w-full bg-gray-800 rounded-lg relative group overflow-hidden transition-all hover:scale-[1.02]"
                    style={{ flex: asset.value, backgroundColor: `${asset.color}20`, borderColor: `${asset.color}40`, border: '1px solid' }}
                   >
                      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className="font-bold text-white">{asset.symbol}</span>
                        <span className="font-mono text-white/60">{asset.value}%</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* BLOCK 5: TARGET COMPARISON (Bottom Right - 4x4) */}
        <div className="col-span-12 md:col-span-4 row-span-4 bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Strategy Target</h3>
           
           <div className="flex-1 flex flex-col justify-center gap-8">
              {/* Current Gauge */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Your Allocation</span>
                  <span className="text-white font-bold">{MOCK_DATA.currentAllocation.crypto}% Crypto</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${MOCK_DATA.currentAllocation.crypto}%` }} />
                </div>
              </div>

              {/* Target Gauge */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Target ({currentRegime.label})</span>
                  <span style={{ color: currentRegime.fillColor }} className="font-bold">{currentRegime.allocation.crypto}% Crypto</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-700" style={{ width: '100%' }}>
                     <div className="h-full" style={{ width: `${currentRegime.allocation.crypto}%`, backgroundColor: currentRegime.fillColor }} />
                  </div>
                </div>
              </div>

              {/* Drift Warning */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mt-auto">
                 <div className="text-orange-400 text-xs font-bold uppercase mb-1">Drift Detected</div>
                 <div className="text-white text-lg font-bold mb-1">{MOCK_DATA.delta}% Deviation</div>
                 <p className="text-xs text-gray-500">Rebalance recommended to align with {currentRegime.label} strategy.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}


