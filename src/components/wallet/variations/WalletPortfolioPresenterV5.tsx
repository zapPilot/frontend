"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, Settings, Shield, Target, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, RegimeId, regimes } from "../regime/regimeData";
import { ALLOCATION_GRADIENTS, AllocationProgressBar } from "../regime/RegimeUtils";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV5() {
  const [selectedRegimeId, setSelectedRegimeId] = useState<RegimeId>(MOCK_DATA.currentRegime);
  
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);
  const selectedRegime = getRegimeById(selectedRegimeId);
  const isCurrentRegime = selectedRegimeId === MOCK_DATA.currentRegime;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500/30">
      {/* TOP NAVIGATION: TIMELINE COMMANDER */}
      <header className="sticky top-16 z-40 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Market Regime Navigator</h2>
             <div className="flex items-center gap-2 text-xs">
               <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
               <span className="text-gray-300">Live Market Signal: <span className="text-white font-bold">{currentRegime.label}</span></span>
             </div>
          </div>
          
          <div className="relative flex justify-between items-center py-4">
            {/* Track Line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-800 -z-10" />
            
            {regimes.map((regime) => {
              const isActive = regime.id === selectedRegimeId;
              const isLive = regime.id === MOCK_DATA.currentRegime;
              
              return (
                <button
                  key={regime.id}
                  onClick={() => setSelectedRegimeId(regime.id)}
                  className={`relative group flex flex-col items-center focus:outline-none transition-all duration-300 ${
                    isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* Node */}
                  <div 
                    className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-4 transition-colors z-10 flex items-center justify-center ${
                      isActive 
                        ? 'bg-gray-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                        : isLive 
                          ? `bg-gray-900 border-[${regime.fillColor}]` 
                          : 'bg-gray-900 border-gray-700 group-hover:border-gray-500'
                    }`}
                    style={{ borderColor: isActive ? 'white' : isLive ? regime.fillColor : undefined }}
                  >
                    {isLive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping absolute" />}
                    {isLive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  {/* Label */}
                  <span 
                    className={`absolute top-10 md:top-12 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {regime.label}
                  </span>
                  
                  {/* Range */}
                  {isActive && (
                    <motion.span 
                      layoutId="range-pill"
                      className="absolute -top-8 bg-white text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                      Idx: {regime.range}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA - CONTEXT SWITCHING */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRegimeId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* LEFT COLUMN: STRATEGY & DATA */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Hero Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 p-8 lg:p-10">
                <div 
                  className="absolute top-0 right-0 w-64 h-64 opacity-10 blur-3xl pointer-events-none rounded-full -mr-20 -mt-20"
                  style={{ backgroundColor: selectedRegime.fillColor }} 
                />
                
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-6">
                     <span 
                      className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${selectedRegime.fillColor}20`, color: selectedRegime.fillColor }}
                     >
                       {selectedRegime.label} Strategy
                     </span>
                     {isCurrentRegime && (
                       <span className="flex items-center gap-1 text-xs text-green-400 border border-green-500/20 px-2 py-1 rounded bg-green-500/10">
                         <Zap className="w-3 h-3" /> Active Regime
                       </span>
                     )}
                   </div>
                   
                   <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                     {selectedRegime.philosophy}
                   </h1>
                   <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
                     {selectedRegime.whyThisWorks}
                   </p>
                </div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Allocations */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-white font-bold flex items-center gap-2 mb-6">
                    <Target className="w-5 h-5 text-blue-400" />
                    {isCurrentRegime ? "Current vs Target" : "Simulation Target"}
                  </h3>
                  
                  <div className="space-y-6">
                    {isCurrentRegime ? (
                      <>
                        <AllocationProgressBar
                          label="Your Portfolio"
                          percentage={MOCK_DATA.currentAllocation.crypto}
                          gradient={ALLOCATION_GRADIENTS.crypto}
                        />
                        <div className="relative">
                          <AllocationProgressBar
                            label="Target Allocation"
                            percentage={selectedRegime.allocation.crypto}
                            gradient={`linear-gradient(90deg, ${selectedRegime.fillColor} 0%, ${selectedRegime.fillColor}88 100%)`}
                          />
                          <div className="absolute right-0 top-0 text-xs font-bold text-orange-400">
                            Gap: {MOCK_DATA.delta}%
                          </div>
                        </div>
                      </>
                    ) : (
                       <div className="py-4">
                         <div className="flex justify-between items-end mb-2">
                           <span className="text-gray-400 text-sm">Target Crypto Exposure</span>
                           <span className="text-2xl font-bold text-white">{selectedRegime.allocation.crypto}%</span>
                         </div>
                         <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                           <div 
                            className="h-full transition-all duration-1000"
                            style={{ width: `${selectedRegime.allocation.crypto}%`, backgroundColor: selectedRegime.fillColor }}
                           />
                         </div>
                         <p className="mt-4 text-sm text-gray-500">
                           In a {selectedRegime.label} regime, we target {selectedRegime.allocation.crypto}% crypto exposure to {selectedRegime.id === 'eg' || selectedRegime.id === 'ef' ? 'manage extreme volatility' : 'capture market upside'}.
                         </p>
                       </div>
                    )}
                  </div>
                </div>

                {/* Tactics */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-white font-bold flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-purple-400" />
                    Tactical Actions
                  </h3>
                  <ul className="space-y-4">
                    {selectedRegime.actions.map((action, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-300">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PORTFOLIO SNAPSHOT */}
            <div className="lg:col-span-4 space-y-6">
               {/* Portfolio Card (Sticky-ish) */}
               <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl sticky top-48">
                 <div className="flex justify-between items-start mb-8">
                   <div>
                     <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Value</h3>
                     <div className="text-3xl font-bold text-white">${MOCK_DATA.balance.toLocaleString()}</div>
                   </div>
                   <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs font-bold">
                     +{MOCK_DATA.roi}%
                   </div>
                 </div>

                 {isCurrentRegime ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                         <h4 className="text-orange-400 font-bold text-sm mb-1 flex items-center gap-2">
                           <Settings className="w-4 h-4" />
                           Optimization Available
                         </h4>
                         <p className="text-xs text-gray-400 mb-3">
                           Your portfolio deviates by {MOCK_DATA.delta}% from the optimal {selectedRegime.label} strategy.
                         </p>
                         <GradientButton 
                           gradient={GRADIENTS.PRIMARY}
                           className="w-full py-2 text-sm"
                         >
                           Rebalance Now
                         </GradientButton>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 text-sm transition-colors">Zap In</button>
                        <button className="py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 text-sm transition-colors">Zap Out</button>
                      </div>
                    </div>
                 ) : (
                   <div className="text-center py-8 px-4 border-2 border-dashed border-gray-800 rounded-xl">
                     <Info className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                     <p className="text-sm text-gray-500">
                       This is a simulation of the <strong>{selectedRegime.label}</strong> regime.
                     </p>
                     <button 
                       onClick={() => setSelectedRegimeId(MOCK_DATA.currentRegime)}
                       className="mt-4 text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors"
                     >
                       Return to Live View
                     </button>
                   </div>
                 )}
               </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}


