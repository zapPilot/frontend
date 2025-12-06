"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, MousePointer2,Radio, Settings, Target, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, RegimeId,regimes } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV8() {
  const [activeRegimeId, setActiveRegimeId] = useState<RegimeId>(MOCK_DATA.currentRegime);
  const currentRegime = getRegimeById(activeRegimeId);
  const isLive = activeRegimeId === MOCK_DATA.currentRegime;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 relative overflow-hidden flex items-center justify-center perspective-[1000px]">
      
      {/* LAYER 1: BACKGROUND MAP (The World) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/50" />
         <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500/50" />
         {/* Grid Lines */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      {/* LAYER 2: REGIME NODES (Floating in Space) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         <div className="w-[80vw] max-w-4xl flex justify-between items-center">
            {regimes.map((regime) => {
              const isActive = regime.id === activeRegimeId;
              return (
                <div 
                  key={regime.id}
                  className={`transition-all duration-500 ${isActive ? 'scale-150 z-20' : 'scale-75 opacity-40 z-0'}`}
                >
                   <div 
                    className={`w-4 h-4 rounded-full shadow-[0_0_20px_currentColor]`}
                    style={{ backgroundColor: regime.fillColor, color: regime.fillColor }}
                   />
                   <div className="mt-4 text-center pointer-events-auto">
                      <button 
                        onClick={() => setActiveRegimeId(regime.id)}
                        className={`text-[10px] uppercase font-bold tracking-widest py-1 px-3 rounded-full border transition-all ${
                          isActive 
                            ? 'bg-gray-900 text-white border-white/50' 
                            : 'bg-transparent text-gray-500 border-transparent hover:border-gray-700'
                        }`}
                      >
                        {regime.label}
                      </button>
                   </div>
                </div>
              );
            })}
         </div>
      </div>

      {/* LAYER 3: HUD COMMAND CENTER (Floating Top Layer) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative z-30 w-full max-w-xl"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* HUD Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
             <div className="flex items-center gap-2">
               <Activity className="w-4 h-4 text-blue-400" />
               <span className="text-xs font-bold uppercase tracking-wider text-gray-400">System Status</span>
             </div>
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className={`text-xs font-bold ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isLive ? 'LIVE DATA' : 'SIMULATION'}
                </span>
             </div>
          </div>

          {/* Main Display */}
          <div className="p-8 text-center relative">
             <div className="absolute top-4 left-4 text-left">
                <div className="text-[10px] text-gray-500 uppercase mb-1">Sentiment</div>
                <div className="text-xl font-bold text-white">{MOCK_DATA.sentimentValue}</div>
             </div>
             
             <div className="absolute top-4 right-4 text-right">
                <div className="text-[10px] text-gray-500 uppercase mb-1">Regime</div>
                <div className="text-xl font-bold" style={{ color: currentRegime.fillColor }}>{currentRegime.id.toUpperCase()}</div>
             </div>

             {/* Central Value */}
             <div className="py-8">
                <div className="text-sm text-gray-400 font-medium mb-2 tracking-widest uppercase">Total Portfolio Value</div>
                <div className="text-5xl md:text-6xl font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  ${MOCK_DATA.balance.toLocaleString()}
                </div>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-bold">
                  +{MOCK_DATA.roi}% Yield
                </div>
             </div>

             {/* Critical Alert Area */}
             {isLive && MOCK_DATA.delta > 5 && (
               <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-center gap-3 text-left">
                  <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-red-400 uppercase">Drift Alert</div>
                    <div className="text-sm text-gray-300">Allocation off by <span className="text-white font-bold">{MOCK_DATA.delta}%</span>. Optimization recommended.</div>
                  </div>
               </div>
             )}

             {/* Primary Action */}
             <div className="grid grid-cols-1 gap-3">
                <GradientButton 
                  gradient={GRADIENTS.PRIMARY}
                  className="w-full py-4 text-lg relative overflow-hidden group"
                  icon={Zap}
                >
                  <span className="relative z-10">Initiate Optimization Sequence</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </GradientButton>
             </div>
          </div>

          {/* HUD Footer Stats */}
          <div className="grid grid-cols-3 border-t border-gray-800 divide-x divide-gray-800 bg-gray-900/50">
             <div className="p-4 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="text-[10px] text-gray-500 uppercase mb-1 group-hover:text-blue-400 transition-colors">Target Alloc</div>
                <div className="text-sm font-bold text-white">{currentRegime.allocation.crypto}% Crypto</div>
             </div>
             <div className="p-4 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="text-[10px] text-gray-500 uppercase mb-1 group-hover:text-blue-400 transition-colors">Positions</div>
                <div className="text-sm font-bold text-white">{MOCK_DATA.positions} Active</div>
             </div>
             <div className="p-4 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="text-[10px] text-gray-500 uppercase mb-1 group-hover:text-blue-400 transition-colors">Strategy</div>
                <div className="text-sm font-bold text-white truncate px-2">"{currentRegime.label}"</div>
             </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}


