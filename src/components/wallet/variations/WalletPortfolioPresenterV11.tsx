"use client";

import { motion } from "framer-motion";
import { Activity,ChevronDown, RotateCcw, Settings, Shield, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, regimes } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV11() {
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  // Calculate Pie Slices (Simplified math for demo)
  const cryptoDeg = (MOCK_DATA.currentAllocation.crypto / 100) * 360;
  const stableDeg = 360 - cryptoDeg;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl h-[600px] bg-gray-900/30 border border-gray-800 rounded-3xl relative overflow-hidden shadow-2xl flex">
        
        {/* LEFT: THE RADIAL COMMAND */}
        <div className="w-1/2 h-full flex items-center justify-center relative border-r border-gray-800/50">
           
           {/* Center Regime Hub */}
           <div className="absolute z-20 text-center">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Regime</div>
              <div className="text-3xl font-bold text-white mb-1">{currentRegime.label}</div>
              <div className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 inline-block">
                Score: {MOCK_DATA.sentimentValue}
              </div>
           </div>

           {/* Interactive Pie Rings */}
           <div className="relative w-96 h-96">
              {/* Crypto Arc */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="12"
                  strokeDasharray={`${cryptoDeg * 0.88} 1000`} // Approximate circumference math
                  className="cursor-pointer hover:brightness-110 transition-all"
                  onClick={() => setSelectedSlice('crypto')}
                  whileHover={{ scale: 1.05 }}
                />
              </svg>
              
              {/* Stable Arc (Offset) */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full rotate-[240deg]">
                 <motion.circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="12"
                  strokeDasharray={`${stableDeg * 0.88} 1000`}
                  className="cursor-pointer hover:brightness-110 transition-all"
                  onClick={() => setSelectedSlice('stable')}
                  whileHover={{ scale: 1.05 }}
                />
              </svg>

              {/* Outer Target Ring (Dashed) */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-700 opacity-30 scale-110" />
           </div>

           {/* Labels */}
           <div className="absolute top-12 left-12 text-left">
             <div className="text-blue-400 font-bold text-lg">{MOCK_DATA.currentAllocation.crypto}%</div>
             <div className="text-xs text-gray-500 uppercase">Crypto</div>
           </div>
           <div className="absolute bottom-12 right-12 text-right">
             <div className="text-emerald-400 font-bold text-lg">{MOCK_DATA.currentAllocation.stable}%</div>
             <div className="text-xs text-gray-500 uppercase">Stable</div>
           </div>
        </div>

        {/* RIGHT: ACTION CENTER */}
        <div className="w-1/2 h-full p-12 flex flex-col">
           {/* Contextual Header */}
           <div className="flex justify-between items-start mb-8">
             <div>
               <h2 className="text-3xl font-bold text-white mb-2">${MOCK_DATA.balance.toLocaleString()}</h2>
               <div className="flex items-center gap-2 text-sm text-gray-400">
                 <TrendingUp className="w-4 h-4 text-green-400" /> +{MOCK_DATA.roi}% Yield
               </div>
             </div>
             <GradientButton gradient={GRADIENTS.PRIMARY} icon={Zap} className="shadow-lg shadow-purple-500/20">
               Optimize
             </GradientButton>
           </div>

           {/* Dynamic Content Area */}
           <div className="flex-1 bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50 relative">
              {!selectedSlice ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-gray-500">
                  <Activity className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">Select a portfolio segment to view detailed breakdown.</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={selectedSlice}
                  className="h-full flex flex-col"
                >
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-white capitalize">{selectedSlice} Assets</h3>
                     <button onClick={() => setSelectedSlice(null)} className="text-gray-500 hover:text-white">
                       <RotateCcw className="w-4 h-4" />
                     </button>
                   </div>
                   
                   <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                     {MOCK_DATA.currentAllocation.constituents[selectedSlice as 'crypto' | 'stable'].map((asset) => (
                       <div key={asset.symbol} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-900" style={{ backgroundColor: asset.color }}>
                              {asset.symbol}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-200">{asset.name}</div>
                              <div className="text-xs text-gray-500">{asset.value}% of {selectedSlice}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">${(MOCK_DATA.balance * (asset.value / 100) * (selectedSlice === 'crypto' ? 0.65 : 0.35)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          </div>
                       </div>
                     ))}
                   </div>
                </motion.div>
              )}
           </div>

           {/* Footer Quote */}
           <div className="mt-8 text-xs text-gray-500 text-center italic">
             "{currentRegime.philosophy}"
           </div>
        </div>

      </div>
    </div>
  );
}


