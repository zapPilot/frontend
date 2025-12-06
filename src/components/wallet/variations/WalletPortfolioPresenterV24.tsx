"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, ArrowUpRight, ExternalLink, Gauge, History, Info, LayoutDashboard, LineChart, Wallet, X, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV24() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Mock Regime Spectrum Data (from V20)
  const regimes = [
    { id: "extreme-fear", label: "Extreme Fear", color: "#ef4444" },
    { id: "fear", label: "Fear", color: "#f97316" },
    { id: "neutral", label: "Neutral", color: "#eab308" },
    { id: "greed", label: "Greed", color: "#84cc16" },
    { id: "extreme-greed", label: "Extreme Greed", color: "#22c55e" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans selection:bg-purple-500/30 overflow-hidden">
      
      {/* --- TOP NAVIGATION (Minimalist) --- */}
      <nav className="h-16 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">
            ZP
          </div>
          <span className="text-white font-bold tracking-tight hidden md:block">Zap Pilot</span>
        </div>

        <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-full border border-gray-800/50">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "analytics", label: "Analytics", icon: LineChart },
            { id: "backtesting", label: "Backtesting", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-gray-800 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
           <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-colors cursor-pointer">
             <Wallet className="w-4 h-4" />
           </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex justify-center p-4 md:p-8 relative">
        <div className="w-full max-w-4xl flex flex-col gap-8 min-h-[600px]">
          
          {/* HERO SECTION: Balance + Strategy Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 flex flex-col justify-center">
               <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Net Worth</div>
               <div className="text-5xl font-bold text-white tracking-tight mb-4">
                 ${MOCK_DATA.balance.toLocaleString()}
               </div>
               <div className="flex items-center gap-3">
                 <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded flex items-center gap-1">
                   <ArrowUpRight className="w-3 h-3" /> {MOCK_DATA.roi}%
                 </span>
                 <span className="text-xs text-gray-500">All Time Return</span>
               </div>
            </div>

            {/* STRATEGY CARD (Trigger for Slide-Over) */}
            <div 
              className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 relative overflow-hidden group cursor-pointer hover:bg-gray-900/60 transition-colors"
              onClick={() => setIsPanelOpen(true)}
            >
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Gauge className="w-32 h-32 text-purple-500" />
               </div>
               
               <div className="relative z-10 flex justify-between items-start">
                 <div className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                   Current Strategy <Info className="w-3 h-3" />
                 </div>
                 <div className="text-xs text-purple-400 font-bold flex items-center gap-1">
                   <ExternalLink className="w-3 h-3" /> View Details
                 </div>
               </div>

               <div className="relative z-10 flex items-center gap-6 mt-4">
                 <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl font-bold border border-gray-700 shadow-inner flex-shrink-0">
                   <span style={{ color: currentRegime.fillColor }}>{MOCK_DATA.currentRegime.toUpperCase()}</span>
                 </div>
                 <div>
                   <div className="text-2xl font-bold text-white mb-1">{currentRegime.label}</div>
                   <div className="text-sm text-gray-400 italic">"{currentRegime.philosophy}"</div>
                 </div>
               </div>
            </div>
          </div>

          {/* UNIFIED COMPOSITION BAR (V21 Style) */}
          <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-8 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-end mb-8">
               <div>
                 <h2 className="text-xl font-bold text-white mb-1">Portfolio Composition</h2>
                 <p className="text-sm text-gray-400">
                   Target: <span className="text-gray-300 font-mono">{currentRegime.allocation.crypto}% Crypto</span> / <span className="text-gray-300 font-mono">{currentRegime.allocation.stable}% Stable</span>
                 </p>
               </div>
               <div className="flex gap-2">
                  <GradientButton gradient={GRADIENTS.PRIMARY} icon={Zap} className="h-8 text-xs">Optimize</GradientButton>
               </div>
            </div>

            {/* THE GHOST BAR TRACK */}
            <div className="relative h-24 w-full bg-gray-900/50 rounded-xl border border-gray-800 p-1 flex overflow-hidden">
               
               {/* GHOST TARGET BACKGROUND */}
               <div className="absolute inset-0 flex opacity-20 pointer-events-none">
                  <div style={{ width: `${currentRegime.allocation.crypto}%` }} className="h-full border-r border-dashed border-white/30 flex items-start justify-center pt-2 text-[10px] uppercase tracking-widest font-bold text-white">
                    Target Crypto
                  </div>
                  <div style={{ width: `${currentRegime.allocation.stable}%` }} className="h-full flex items-start justify-center pt-2 text-[10px] uppercase tracking-widest font-bold text-emerald-400">
                    Target Stable
                  </div>
               </div>

               {/* ACTUAL BARS (Foreground) */}
               <div className="relative w-full h-full flex gap-1 z-10">
                  {/* Crypto Section */}
                  <div 
                    className="h-full flex gap-1 transition-all duration-500 ease-out"
                    style={{ width: `${MOCK_DATA.currentAllocation.crypto}%` }}
                  >
                     {MOCK_DATA.currentAllocation.simplifiedCrypto.map((asset) => (
                       <motion.div
                         key={asset.symbol}
                         className="h-full rounded-lg relative group overflow-hidden cursor-pointer"
                         style={{ 
                           flex: asset.value, 
                           backgroundColor: `${asset.color}20`, 
                           border: `1px solid ${asset.color}50`
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
                       </motion.div>
                     ))}
                  </div>

                  {/* Stable Section */}
                  <motion.div
                    className="h-full rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative group"
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
                  </motion.div>
               </div>
            </div>

            {/* Legend */}
            <div className="flex justify-between mt-4 px-1">
               <div className="flex gap-4 text-xs text-gray-400">
                  {MOCK_DATA.currentAllocation.simplifiedCrypto.map(asset => (
                    <div key={asset.symbol} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span>{asset.name}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Stablecoins</span>
                  </div>
               </div>
               <div className="text-xs font-bold text-orange-400">
                 Drift: {MOCK_DATA.delta}%
               </div>
            </div>

          </div>

          {/* Bottom Actions */}
          <div className="grid grid-cols-2 gap-4">
             <button className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-4 flex items-center justify-center gap-2 text-white font-bold transition-colors">
               <ArrowDownCircle className="w-5 h-5 text-green-500" /> Deposit Funds
             </button>
             <button className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-4 flex items-center justify-center gap-2 text-white font-bold transition-colors">
               <ArrowUpCircle className="w-5 h-5 text-red-500" /> Withdraw Funds
             </button>
          </div>

        </div>
      </main>

      {/* --- SLIDE-OVER PANEL --- */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 z-[70] shadow-2xl flex flex-col"
            >
               <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                 <h2 className="text-xl font-bold text-white">Market Strategy</h2>
                 <button onClick={() => setIsPanelOpen(false)} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                   <X className="w-5 h-5" />
                 </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  
                  {/* Section 1: Regime Status */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Current Regime</h3>
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Gauge className="w-24 h-24 text-green-500" />
                       </div>
                       <div className="text-3xl font-bold text-white mb-2">{currentRegime.label}</div>
                       <p className="text-gray-400 italic mb-4">"{currentRegime.philosophy}"</p>
                       
                       <div className="flex items-center gap-2 text-sm">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-green-400 font-bold">Active Strategy: Take Profit</span>
                       </div>
                    </div>
                  </div>

                  {/* Section 2: Allocation Logic */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Allocation Logic</h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4">
                          <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700">
                             <div className="text-xs text-gray-500 mb-1">Crypto Exposure</div>
                             <div className="text-2xl font-bold text-white">{currentRegime.allocation.crypto}%</div>
                          </div>
                          <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700">
                             <div className="text-xs text-gray-500 mb-1">Stablecoin Reserve</div>
                             <div className="text-2xl font-bold text-emerald-400">{currentRegime.allocation.stable}%</div>
                          </div>
                       </div>
                       <p className="text-sm text-gray-400 leading-relaxed">
                         In <span className="text-white font-bold">Greed</span> markets, we reduce crypto exposure to lock in gains and build a stablecoin war chest. This prepares us to buy the dip when the market inevitably corrects.
                       </p>
                    </div>
                  </div>

                  {/* Section 3: Historical Performance (Mock) */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Why this works?</h3>
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                       <div className="flex items-center gap-3 mb-2">
                         <History className="w-4 h-4 text-purple-400" />
                         <span className="text-sm font-bold text-white">Backtest Result</span>
                       </div>
                       <p className="text-xs text-gray-400">
                         Historically, reducing exposure during Extreme Greed has outperformed HODLing by <span className="text-green-400 font-bold">+12.5%</span> annually.
                       </p>
                    </div>
                  </div>

               </div>

               <div className="p-6 border-t border-gray-800 bg-gray-900/95 backdrop-blur">
                 <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors">
                   Read Full Strategy Guide
                 </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- FOOTER --- */}
      <footer className="border-t border-gray-800/50 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 Zap Pilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
