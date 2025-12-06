"use client";

import { AnimatePresence,motion } from "framer-motion";
import { Activity,Maximize2, Settings, TrendingUp, X, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, regimes } from "../regime/regimeData";
import { ALLOCATION_GRADIENTS,AllocationProgressBar } from "../regime/RegimeUtils";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV6() {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  // Calculate orb color based on sentiment
  const orbColor = MOCK_DATA.sentimentStatus === 'Greed' 
    ? 'rgba(16, 185, 129, 0.8)' // Emerald/Greenish
    : MOCK_DATA.sentimentStatus === 'Fear'
      ? 'rgba(249, 115, 22, 0.8)' // Orange
      : 'rgba(234, 179, 8, 0.8)'; // Yellow

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-950 relative overflow-hidden p-4">
      
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
         <motion.div 
           animate={{ 
             scale: [1, 1.2, 1],
             opacity: [0.1, 0.2, 0.1]
           }}
           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px]"
           style={{ backgroundColor: orbColor }}
         />
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <motion.div 
        layout
        className={`relative z-10 bg-gray-900/40 backdrop-blur-2xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          isExpanded ? 'w-full max-w-5xl h-[80vh]' : 'w-full max-w-md p-8'
        }`}
      >
        {/* COLLAPSED VIEW (ZEN MODE) */}
        {!isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-gray-400 text-sm uppercase tracking-widest font-medium">Current Balance</h2>
              <div className="text-5xl font-bold text-white tracking-tight">
                ${MOCK_DATA.balance.toLocaleString()}
              </div>
              <div className="inline-flex items-center gap-1 text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-sm font-medium">
                <TrendingUp className="w-3 h-3" /> +{MOCK_DATA.roi}%
              </div>
            </div>

            {/* The Orb */}
            <div className="relative cursor-pointer group" onClick={() => setIsExpanded(true)}>
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-48 h-48 rounded-full flex items-center justify-center relative z-10"
                style={{ 
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), ${orbColor})`,
                  boxShadow: `0 0 60px ${orbColor}`
                }}
              >
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-1">{MOCK_DATA.sentimentValue}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/80">{MOCK_DATA.sentimentStatus}</div>
                </div>
              </motion.div>
              
              {/* Orbiting Rings */}
              <div className="absolute inset-0 border border-white/10 rounded-full scale-150 animate-spin-slow pointer-events-none" />
              <div className="absolute inset-0 border border-white/5 rounded-full scale-[1.8] animate-reverse-spin pointer-events-none" />
              
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-gray-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Click to analyze strategy
              </div>
            </div>

            <div className="w-full pt-4">
               <GradientButton 
                 gradient={GRADIENTS.PRIMARY} 
                 className="w-full py-4 text-lg shadow-lg shadow-purple-500/20"
                 onClick={() => setIsExpanded(true)}
               >
                 View Portfolio Strategy
               </GradientButton>
            </div>
          </motion.div>
        )}

        {/* EXPANDED VIEW (DASHBOARD MODE) */}
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm text-gray-400">Total Balance</div>
                  <div className="text-2xl font-bold text-white">${MOCK_DATA.balance.toLocaleString()}</div>
                </div>
                <div className="h-8 w-px bg-gray-700" />
                <div>
                  <div className="text-sm text-gray-400">Market Regime</div>
                  <div className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentRegime.fillColor }}></span>
                    {currentRegime.label}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Left: Strategy Context */}
              <div className="space-y-8">
                 <div>
                   <h3 className="text-purple-400 font-mono text-xs tracking-widest uppercase mb-4">Core Philosophy</h3>
                   <blockquote className="text-3xl font-serif text-white leading-relaxed">
                     "{currentRegime.philosophy}"
                   </blockquote>
                   <p className="mt-4 text-gray-400 leading-relaxed">
                     {currentRegime.whyThisWorks}
                   </p>
                 </div>

                 {/* Timeline Mini */}
                 <div className="pt-6 border-t border-gray-800">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Current Cycle Position</h4>
                    <div className="flex justify-between items-center relative">
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-800 -z-10" />
                      {regimes.map((r) => (
                        <div key={r.id} className="flex flex-col items-center gap-2">
                          <div 
                            className={`w-3 h-3 rounded-full ${r.id === MOCK_DATA.currentRegime ? 'scale-150 ring-4 ring-gray-900' : 'bg-gray-800'}`}
                            style={{ backgroundColor: r.id === MOCK_DATA.currentRegime ? r.fillColor : undefined }}
                          />
                          <span className={`text-[10px] uppercase ${r.id === MOCK_DATA.currentRegime ? 'text-white font-bold' : 'text-gray-600'}`}>
                            {r.id}
                          </span>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Right: Actionable Stats */}
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 space-y-6">
                 <div className="flex items-center justify-between">
                   <h3 className="text-white font-bold flex items-center gap-2">
                     <Activity className="w-5 h-5 text-blue-400" />
                     Allocation Health
                   </h3>
                   {MOCK_DATA.delta > 0 && (
                     <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs font-bold">
                       Attention Needed
                     </span>
                   )}
                 </div>

                 <div className="space-y-4">
                    <AllocationProgressBar 
                      label="Current Allocation"
                      percentage={MOCK_DATA.currentAllocation.crypto}
                      gradient={ALLOCATION_GRADIENTS.crypto}
                    />
                    <AllocationProgressBar 
                      label={`Target (${currentRegime.label})`}
                      percentage={currentRegime.allocation.crypto}
                      gradient={`linear-gradient(90deg, ${currentRegime.fillColor} 0%, ${currentRegime.fillColor}88 100%)`}
                    />
                 </div>

                 <div className="pt-6 mt-6 border-t border-gray-800">
                    <div className="flex gap-4">
                       <GradientButton 
                         gradient={GRADIENTS.PRIMARY}
                         className="flex-1 py-3"
                         icon={Zap}
                       >
                         Optimize Portfolio
                       </GradientButton>
                       <div className="flex gap-2">
                         <button className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors text-sm font-medium">
                           Zap In
                         </button>
                         <button className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors text-sm font-medium">
                           Zap Out
                         </button>
                       </div>
                    </div>
                 </div>
              </div>

            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}


