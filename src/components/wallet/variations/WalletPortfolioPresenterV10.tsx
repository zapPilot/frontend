"use client";

import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, ArrowUpRight, PieChart as PieChartIcon, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV10() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[80vh] min-h-[600px]">
        
        {/* LEFT COLUMN: METRICS & CONTEXT */}
        <div className="flex flex-col gap-6 h-full">
          {/* Balance Card */}
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 flex-shrink-0">
             <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Total Balance</div>
             <div className="text-4xl font-bold text-white tracking-tight mb-2">
               ${MOCK_DATA.balance.toLocaleString()}
             </div>
             <div className="flex items-center gap-2">
               <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded flex items-center gap-1">
                 <ArrowUpRight className="w-3 h-3" /> {MOCK_DATA.roi}%
               </span>
               <span className="text-xs text-gray-500">All Time</span>
             </div>
          </div>

          {/* Regime Context Card */}
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 flex-1 flex flex-col relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <PieChartIcon className="w-32 h-32 text-purple-500" />
             </div>
             
             <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Market Strategy</div>
             
             <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-xl font-bold border border-gray-700 shadow-inner">
                 <span style={{ color: currentRegime.fillColor }}>{MOCK_DATA.currentRegime.toUpperCase()}</span>
               </div>
               <div>
                 <div className="text-white font-bold text-lg">{currentRegime.label}</div>
                 <div className="text-xs text-gray-400">Sentiment: {MOCK_DATA.sentimentValue}/100</div>
               </div>
             </div>

             <blockquote className="text-lg font-serif text-gray-300 italic leading-relaxed mb-6 relative z-10">
               "{currentRegime.philosophy}"
             </blockquote>

             <div className="mt-auto">
               <div className="text-xs text-gray-500 mb-2">Target Allocation</div>
               <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                 <div style={{ width: `${currentRegime.allocation.crypto}%`, backgroundColor: currentRegime.fillColor }} />
               </div>
               <div className="flex justify-between text-xs mt-1 text-gray-400">
                 <span>{currentRegime.allocation.crypto}% Crypto</span>
                 <span>{currentRegime.allocation.stable}% Stable</span>
               </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE QUANTUM BAR */}
        <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-8 flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Portfolio Composition</h2>
              <p className="text-sm text-gray-400">Detailed asset breakdown</p>
            </div>
            <div className="flex gap-3">
              <GradientButton 
                gradient={GRADIENTS.SUCCESS}
                icon={ArrowDownCircle}
                className="shadow-lg"
              >
                Deposit
              </GradientButton>
              <GradientButton 
                gradient={GRADIENTS.DANGER}
                icon={ArrowUpCircle}
                className="shadow-lg"
              >
                Withdraw
              </GradientButton>
              <GradientButton 
                gradient={GRADIENTS.PRIMARY}
                icon={Zap}
                className="shadow-lg shadow-purple-500/20"
              >
                Optimize
              </GradientButton>
            </div>
          </div>

          {/* THE FLOATING PILLS BAR */}
          <div className="flex-1 flex flex-col justify-center">
             <div className="relative h-32 w-full bg-gray-900/50 rounded-2xl border border-gray-800 p-2 flex gap-2 shadow-2xl">
                
                {/* CRYPTO SECTION (Floating Pills) */}
                <div 
                  className="h-full flex gap-2 transition-all duration-500 ease-out"
                  style={{ width: `${MOCK_DATA.currentAllocation.crypto}%` }}
                >
                   {MOCK_DATA.currentAllocation.simplifiedCrypto.map((asset) => (
                     <motion.div
                       key={asset.symbol}
                       className="h-full rounded-xl relative group overflow-hidden cursor-pointer"
                       style={{ 
                         flex: asset.value, 
                         backgroundColor: `${asset.color}15`, 
                         border: `1px solid ${asset.color}40`
                       }}
                       onHoverStart={() => setHoveredSegment(asset.symbol)}
                       onHoverEnd={() => setHoveredSegment(null)}
                       whileHover={{ scale: 1.02, y: -2 }}
                     >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-bold text-white text-lg">{asset.symbol}</span>
                          <span className="text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {asset.value}%
                          </span>
                        </div>
                        {/* Glow effect */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" 
                          style={{ backgroundColor: asset.color }} 
                        />
                     </motion.div>
                   ))}
                   
                   {/* Category Label Overlay */}
                   <div className={`absolute -top-8 left-0 text-xs font-bold text-blue-400 uppercase tracking-widest transition-opacity duration-300 ${hoveredSegment ? 'opacity-50' : 'opacity-100'}`}>
                     Crypto Allocation
                   </div>
                </div>

                {/* STABLE SECTION (Single Solid Block) */}
                <motion.div
                  className="h-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative group"
                  style={{ width: `${MOCK_DATA.currentAllocation.stable}%` }}
                  onHoverStart={() => setHoveredSegment('STABLES')}
                  onHoverEnd={() => setHoveredSegment(null)}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                   <div className="text-center">
                     <span className="font-bold text-emerald-400 text-lg">STABLES</span>
                     <div className="text-xs text-emerald-500/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                       {MOCK_DATA.currentAllocation.stable}%
                     </div>
                   </div>

                   <div className={`absolute -top-8 right-0 text-xs font-bold text-emerald-400 uppercase tracking-widest transition-opacity duration-300 ${hoveredSegment === 'STABLES' ? 'opacity-50' : 'opacity-100'}`}>
                     Stable Allocation
                   </div>
                </motion.div>

             </div>

             {/* Legend/Key below bar */}
             <div className="flex justify-between mt-6 px-1">
                <div className="flex gap-6 text-xs text-gray-400">
                  {MOCK_DATA.currentAllocation.simplifiedCrypto.map(asset => (
                    <div key={asset.symbol} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span>{asset.name}</span>
                    </div>
                  ))}
                  <div className="w-px h-4 bg-gray-800 mx-2" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Stablecoins</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                  <span className="text-xs font-bold">Drift: {MOCK_DATA.delta}%</span>
                </div>
             </div>
           </div>

           {/* Bottom Stats Grid */}
           <div className="grid grid-cols-3 gap-4 mt-auto pt-8 border-t border-gray-800/50">
              <div>
                <div className="text-xs text-gray-500 uppercase">Active Positions</div>
                <div className="text-xl font-bold text-white">{MOCK_DATA.positions}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Protocols</div>
                <div className="text-xl font-bold text-white">{MOCK_DATA.protocols}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Chains</div>
                <div className="text-xl font-bold text-white">{MOCK_DATA.chains}</div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
