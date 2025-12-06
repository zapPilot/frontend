"use client";

import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, ArrowUpRight, Gauge, History, Info, LayoutDashboard, LineChart, RotateCw, Wallet, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV23() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isFlipped, setIsFlipped] = useState(false);

  // Mock Regime Spectrum Data (from V20)
  const regimes = [
    { id: "extreme-fear", label: "Extreme Fear", color: "#ef4444" },
    { id: "fear", label: "Fear", color: "#f97316" },
    { id: "neutral", label: "Neutral", color: "#eab308" },
    { id: "greed", label: "Greed", color: "#84cc16" },
    { id: "extreme-greed", label: "Extreme Greed", color: "#22c55e" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans selection:bg-purple-500/30">
      
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
      <main className="flex-1 flex justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl flex flex-col gap-8 min-h-[600px]">
          
          {/* HERO SECTION: Balance + Flip Strategy Card */}
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

            {/* FLIP STRATEGY CARD CONTAINER */}
            <div className="relative h-[200px] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
               <motion.div 
                 className="w-full h-full relative preserve-3d transition-all duration-500"
                 animate={{ rotateY: isFlipped ? 180 : 0 }}
                 transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                 style={{ transformStyle: "preserve-3d" }}
               >
                 {/* FRONT FACE (Level 1) */}
                 <div className="absolute inset-0 backface-hidden bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 flex flex-col justify-between overflow-hidden hover:bg-gray-900/60 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Gauge className="w-32 h-32 text-purple-500" />
                    </div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        Current Strategy <Info className="w-3 h-3" />
                      </div>
                      <div className="text-xs text-purple-400 font-bold flex items-center gap-1">
                        <RotateCw className="w-3 h-3" /> Flip for Context
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

                 {/* BACK FACE (Level 2 - Context) */}
                 <div 
                   className="absolute inset-0 backface-hidden bg-gray-900 border border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden"
                   style={{ transform: "rotateY(180deg)" }}
                 >
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Market Cycle Position</div>
                    
                    {/* Simplified Regime Arc Visualization */}
                    <div className="relative w-full h-24 flex items-end justify-center mb-2">
                       {/* Arc Path */}
                       <div className="absolute bottom-0 w-48 h-24 border-t-4 border-l-4 border-r-4 border-gray-800 rounded-t-full" />
                       
                       {/* Nodes */}
                       <div className="absolute bottom-0 left-0 w-4 h-4 bg-red-500 rounded-full translate-y-2 -translate-x-2" />
                       <div className="absolute bottom-[70%] left-[15%] w-4 h-4 bg-orange-500 rounded-full" />
                       <div className="absolute top-0 left-1/2 w-4 h-4 bg-yellow-500 rounded-full -translate-x-2 -translate-y-2" />
                       <div className="absolute bottom-[70%] right-[15%] w-4 h-4 bg-lime-500 rounded-full" />
                       
                       {/* Active Node (Greed) */}
                       <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full translate-y-3 translate-x-3 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-2 border-white z-10" />
                    </div>

                    <div className="text-center">
                      <div className="text-green-400 font-bold text-lg">Greed Phase</div>
                      <div className="text-xs text-gray-400 mt-1">Taking profits into Stables</div>
                    </div>
                 </div>
               </motion.div>
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

      {/* --- FOOTER --- */}
      <footer className="border-t border-gray-800/50 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 Zap Pilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
