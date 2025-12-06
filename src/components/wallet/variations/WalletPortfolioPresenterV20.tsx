"use client";

import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, ArrowUpRight, Gauge, History, LayoutDashboard, LineChart, Wallet, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV20() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock Regime Spectrum Data
  const regimes = [
    { id: "extreme-fear", label: "Extreme Fear", color: "#ef4444" },
    { id: "fear", label: "Fear", color: "#f97316" },
    { id: "neutral", label: "Neutral", color: "#eab308" },
    { id: "greed", label: "Greed", color: "#84cc16" },
    { id: "extreme-greed", label: "Extreme Greed", color: "#22c55e" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans selection:bg-purple-500/30">
      
      {/* --- TOP NAVIGATION (Minimalist - No Balance) --- */}
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
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 min-h-[600px]">
          
          {/* LEFT COLUMN: METRICS & REGIME MAP */}
          <div className="flex flex-col gap-6 h-full">
            {/* Balance Card */}
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 flex-shrink-0">
               <div className="flex justify-between items-start mb-2">
                 <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Total Balance</div>
                 <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded flex items-center gap-1">
                   <ArrowUpRight className="w-3 h-3" /> {MOCK_DATA.roi}%
                 </span>
               </div>
               <div className="text-4xl font-bold text-white tracking-tight mb-1">
                 ${MOCK_DATA.balance.toLocaleString()}
               </div>
               <div className="text-xs text-gray-500">
                 +${(MOCK_DATA.balance * (MOCK_DATA.roi / 100)).toLocaleString()} (All Time)
               </div>
            </div>

            {/* REGIME MAP CARD */}
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 flex-1 flex flex-col relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Gauge className="w-32 h-32 text-purple-500" />
               </div>
               
               <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Market Cycle Position</div>
               
               {/* The Regime Map */}
               <div className="flex flex-col gap-2 mb-8 relative z-10">
                 {regimes.map((regime) => {
                    const isActive = regime.id === "greed"; // Hardcoded to match mock data "Greed"
                    return (
                      <div 
                        key={regime.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                          isActive 
                            ? "bg-gray-800 border border-gray-700 shadow-lg scale-105" 
                            : "opacity-40 hover:opacity-60"
                        }`}
                      >
                        <div 
                          className={`w-3 h-3 rounded-full ${isActive ? "animate-pulse" : ""}`}
                          style={{ backgroundColor: regime.color }}
                        />
                        <span className={`text-sm font-bold ${isActive ? "text-white" : "text-gray-400"}`}>
                          {regime.label}
                        </span>
                        {isActive && (
                          <span className="ml-auto text-xs font-mono text-gray-400">
                            Current Strategy
                          </span>
                        )}
                      </div>
                    );
                 })}
               </div>

               <blockquote className="text-sm font-serif text-gray-300 italic leading-relaxed mb-6 relative z-10 border-l-2 border-purple-500 pl-4">
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
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-gray-800/50 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6 mb-4">
          <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Docs</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Support</a>
        </div>
        <p>© 2024 Zap Pilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
