"use client";

import { motion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowUpRight, Settings, TrendingUp,Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, RegimeId,regimes } from "../regime/regimeData";
import { ALLOCATION_GRADIENTS,AllocationProgressBar } from "../regime/RegimeUtils";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV4() {
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);
  const [hoveredRegime, setHoveredRegime] = useState<RegimeId | null>(null);

  const displayRegime = hoveredRegime ? getRegimeById(hoveredRegime) : currentRegime;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] min-h-[calc(100vh-4rem)] bg-gray-950 font-sans">
      {/* LEFT SIDEBAR - METRICS */}
      <aside className="relative bg-gray-900/20 border-r border-gray-800/50 p-8 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 flex flex-col gap-8 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</h2>
          <div className="text-4xl xl:text-5xl font-bold text-white tracking-tight">
            ${MOCK_DATA.balance.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              {MOCK_DATA.roi}%
            </div>
            <span className="text-gray-500 text-sm">All time ROI</span>
          </div>
        </motion.div>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Neural Sentiment</h3>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                MOCK_DATA.sentimentStatus === 'Greed' ? 'bg-lime-500/10 text-lime-400' : 'text-gray-300'
              }`}>
                {MOCK_DATA.sentimentStatus}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${MOCK_DATA.sentimentValue}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fear</span>
              <span>Greed</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
            <h3 className="text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Allocation Delta
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Crypto Exposure</span>
              <span className="text-orange-400 font-bold text-sm">-{MOCK_DATA.delta}%</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Current portfolio is underweight in crypto assets relative to the target strategy for {currentRegime.label}.
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="mt-auto pt-8 border-t border-gray-800/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-800/50 text-gray-300 transition-all text-sm">
              <ArrowDownRight className="w-4 h-4" />
              Zap In
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-800/50 text-gray-300 transition-all text-sm">
              <ArrowUpRight className="w-4 h-4" />
              Zap Out
            </button>
          </div>
          <GradientButton 
            gradient={GRADIENTS.PRIMARY}
            className="w-full mt-3 py-4"
            icon={Zap}
          >
            Optimize Portfolio
          </GradientButton>
        </motion.div>
      </aside>

      {/* RIGHT MAIN CONTENT */}
      <main className="p-8 lg:p-12 flex flex-col gap-12">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent" />
            <span className="text-purple-500 font-mono text-xs tracking-[0.2em] uppercase">Current Regime Strategy</span>
            <div className="h-px w-12 bg-gray-800" />
          </div>
          
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-serif text-gray-200 leading-tight max-w-3xl"
            style={{ fontFamily: 'Times New Roman, serif' }} // Or use a custom font class if available
          >
            <span className="text-6xl block mb-4 opacity-30 font-sans">"</span>
            {displayRegime.philosophy.replace(/"/g, '')}
            <span className="text-6xl inline-block align-top opacity-30 font-sans ml-2">"</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 font-light max-w-2xl border-l-2 border-purple-500/30 pl-6">
             {displayRegime.whyThisWorks}
          </p>
        </motion.div>

        {/* Interactive Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="py-8 border-y border-gray-800/50"
        >
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-xl font-light text-white">Market Regime Timeline</h3>
            <div className="flex gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/20"></div> Past</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div> Current</span>
            </div>
          </div>

          <div className="relative h-24 flex items-center justify-between px-4 sm:px-12">
             {/* Connecting Line */}
             <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-800 -z-10" />
             
             {regimes.map((regime) => {
               const isActive = regime.id === MOCK_DATA.currentRegime;
               const isHovered = hoveredRegime === regime.id;
               
               return (
                 <div 
                  key={regime.id} 
                  className="relative group"
                  onMouseEnter={() => setHoveredRegime(regime.id)}
                  onMouseLeave={() => setHoveredRegime(null)}
                >
                   <motion.div 
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 cursor-pointer z-10 relative bg-gray-950 ${
                      isActive 
                        ? `border-[${regime.fillColor}] scale-125 shadow-[0_0_15px_${regime.fillColor}50]` 
                        : 'border-gray-600 group-hover:border-gray-400'
                    }`}
                    style={{ borderColor: isActive ? regime.fillColor : undefined }}
                    whileHover={{ scale: 1.5 }}
                   >
                     {isActive && <div className={`absolute inset-0 rounded-full animate-ping opacity-30 bg-[${regime.fillColor}]`} style={{ backgroundColor: regime.fillColor }} />}
                   </motion.div>
                   
                   <div className={`absolute top-8 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
                     isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'
                   }`}>
                     {regime.label}
                   </div>

                   {/* Range Indicator */}
                    <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 bg-gray-900 px-1 rounded opacity-0 transition-opacity ${
                      isActive || isHovered ? 'opacity-100' : ''
                    }`}>
                      {regime.range}
                    </div>
                 </div>
               );
             })}
          </div>
        </motion.div>

        {/* Actionable Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="space-y-6">
             <h3 className="text-xl font-light text-white flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-purple-400" />
               Recommended Actions
             </h3>
             <ul className="space-y-3">
               {displayRegime.actions.map((action, i) => (
                 <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-gray-900/40 border border-gray-800/60 hover:border-purple-500/30 transition-colors group">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      {i + 1}
                    </span>
                    <span className="text-gray-300 text-sm leading-relaxed">{action}</span>
                 </li>
               ))}
             </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-light text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Allocation Target
            </h3>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800">
               <div className="mb-6">
                 <div className="flex justify-between text-sm mb-2">
                   <span className="text-gray-400">Current Split</span>
                   <span className="text-white">{MOCK_DATA.currentAllocation.crypto}% Crypto / {MOCK_DATA.currentAllocation.stable}% Stable</span>
                 </div>
                 <div className="flex h-3 rounded-full overflow-hidden">
                   <div 
                    className="bg-orange-500"
                    style={{ width: `${MOCK_DATA.currentAllocation.crypto}%` }} 
                   />
                   <div 
                    className="bg-blue-500"
                    style={{ width: `${MOCK_DATA.currentAllocation.stable}%` }} 
                   />
                 </div>
               </div>

               <div className="relative">
                 <div className="flex justify-between text-sm mb-2">
                   <span className="text-gray-400">Target Split ({displayRegime.label})</span>
                   <span style={{ color: displayRegime.fillColor }}>{displayRegime.allocation.crypto}% Crypto / {displayRegime.allocation.stable}% Stable</span>
                 </div>
                 <div className="flex h-3 rounded-full overflow-hidden opacity-50 grayscale group-hover:grayscale-0 transition-all">
                   <div 
                    className="bg-orange-500"
                    style={{ width: `${displayRegime.allocation.crypto}%` }} 
                   />
                   <div 
                    className="bg-blue-500"
                    style={{ width: `${displayRegime.allocation.stable}%` }} 
                   />
                 </div>
                 
                 {/* Difference Visualizer */}
                 <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Adjustment Required</span>
                    <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 font-mono">
                      {Math.abs(displayRegime.allocation.crypto - MOCK_DATA.currentAllocation.crypto)}% Rebalance
                    </span>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}


