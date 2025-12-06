"use client";

import { motion } from "framer-motion";
import { Activity, ArrowDownCircle, ArrowUpCircle, ArrowUpRight, Fuel, Globe, PieChart as PieChartIcon, Settings, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV18() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans selection:bg-purple-500/30">
      
      {/* --- COMMAND CENTER TOP BAR --- */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        {/* Top Row: Logo, Nav, User */}
        <div className="h-14 px-4 md:px-6 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-purple-500/20">
                  ZP
                </div>
                <span className="text-white font-bold tracking-tight text-sm uppercase">Zap Pilot</span>
              </div>

              <div className="h-6 w-px bg-gray-800 hidden md:block"></div>

              <nav className="hidden md:flex items-center gap-1">
                {[
                  { id: "dashboard", label: "Dashboard" },
                  { id: "analytics", label: "Analytics" },
                  { id: "backtesting", label: "Backtesting" },
                  { id: "strategies", label: "Strategies" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === tab.id
                        ? "bg-gray-800 text-white"
                        : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-gray-950 px-2 py-1 rounded border border-gray-800">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span>SYSTEM ONLINE</span>
              </div>
              <div className="w-8 h-8 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
                 <Settings className="w-4 h-4" />
              </div>
           </div>
        </div>

        {/* Bottom Row: Ticker / Quick Stats */}
        <div className="h-8 bg-gray-950 border-b border-gray-800 flex items-center px-4 md:px-6 gap-6 overflow-x-auto scrollbar-hide">
           <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
              <Fuel className="w-3 h-3 text-orange-500" />
              <span>Gas: <span className="text-white font-mono">12 gwei</span></span>
           </div>
           <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
              <Activity className="w-3 h-3 text-blue-500" />
              <span>ETH: <span className="text-white font-mono">$3,450.20</span> <span className="text-green-500">(+2.4%)</span></span>
           </div>
           <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
              <Globe className="w-3 h-3 text-purple-500" />
              <span>Global MCap: <span className="text-white font-mono">$2.4T</span></span>
           </div>
           <div className="flex-1"></div>
           <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>Portfolio Delta (24h): <span className="text-green-400 font-mono">+$1,240.50</span></span>
           </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
          
          {/* LEFT COLUMN: METRICS & CONTEXT */}
          <div className="flex flex-col gap-6 h-full">
            {/* Balance Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex-shrink-0 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Zap className="w-40 h-40" />
               </div>
               <div className="relative z-10">
                 <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Total Balance</div>
                 <div className="text-5xl font-mono font-bold text-white tracking-tight mb-2">
                   ${MOCK_DATA.balance.toLocaleString()}
                 </div>
                 <div className="flex items-center gap-4 mt-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">ROI (All Time)</span>
                      <span className="text-green-400 font-mono font-bold flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> {MOCK_DATA.roi}%
                      </span>
                   </div>
                   <div className="w-px h-8 bg-gray-800"></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Daily Yield</span>
                      <span className="text-blue-400 font-mono font-bold">+$45.20</span>
                   </div>
                 </div>
               </div>
            </div>

            {/* Regime Context Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex-1 flex flex-col relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <PieChartIcon className="w-32 h-32 text-purple-500" />
               </div>
               
               <div className="flex items-center justify-between mb-6">
                 <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Market Strategy</div>
                 <div className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-[10px] font-mono text-gray-300">
                   AUTO-PILOT ON
                 </div>
               </div>
               
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center text-2xl font-bold border border-gray-700 shadow-inner">
                   <span style={{ color: currentRegime.fillColor }}>{MOCK_DATA.currentRegime.toUpperCase()}</span>
                 </div>
                 <div>
                   <div className="text-white font-bold text-xl">{currentRegime.label}</div>
                   <div className="text-xs text-gray-400 font-mono mt-1">Sentiment Score: <span className="text-white">{MOCK_DATA.sentimentValue}</span>/100</div>
                 </div>
               </div>

               <div className="bg-gray-950/50 rounded border border-gray-800 p-4 mb-6 relative z-10">
                 <blockquote className="text-sm font-serif text-gray-300 italic leading-relaxed">
                   "{currentRegime.philosophy}"
                 </blockquote>
               </div>

               <div className="mt-auto">
                 <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono">
                   <span>TARGET ALLOCATION</span>
                   <span>ACTUAL</span>
                 </div>
                 <div className="flex h-4 rounded-sm overflow-hidden bg-gray-800 mb-2">
                   <div style={{ width: `${currentRegime.allocation.crypto}%`, backgroundColor: currentRegime.fillColor }} />
                 </div>
                 <div className="flex justify-between text-xs text-gray-400 font-mono">
                   <span>{currentRegime.allocation.crypto}% Crypto</span>
                   <span>{currentRegime.allocation.stable}% Stable</span>
                 </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: THE QUANTUM BAR */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Portfolio Composition</h2>
                <p className="text-sm text-gray-400">Detailed asset breakdown</p>
              </div>
              <div className="flex gap-2">
                <GradientButton 
                  gradient={GRADIENTS.SUCCESS}
                  icon={ArrowDownCircle}
                  className="shadow-lg h-9 text-xs"
                >
                  DEPOSIT
                </GradientButton>
                <GradientButton 
                  gradient={GRADIENTS.DANGER}
                  icon={ArrowUpCircle}
                  className="shadow-lg h-9 text-xs"
                >
                  WITHDRAW
                </GradientButton>
                <GradientButton 
                  gradient={GRADIENTS.PRIMARY}
                  icon={Zap}
                  className="shadow-lg shadow-purple-500/20 h-9 text-xs"
                >
                  OPTIMIZE
                </GradientButton>
              </div>
            </div>

            {/* THE FLOATING PILLS BAR */}
            <div className="flex-1 flex flex-col justify-center">
               <div className="relative h-40 w-full bg-gray-950 rounded-lg border border-gray-800 p-3 flex gap-2 shadow-inner">
                  
                  {/* CRYPTO SECTION (Floating Pills) */}
                  <div 
                    className="h-full flex gap-2 transition-all duration-500 ease-out"
                    style={{ width: `${MOCK_DATA.currentAllocation.crypto}%` }}
                  >
                     {MOCK_DATA.currentAllocation.simplifiedCrypto.map((asset) => (
                       <motion.div
                         key={asset.symbol}
                         className="h-full rounded relative group overflow-hidden cursor-pointer"
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
                            <span className="font-bold text-white text-xl font-mono">{asset.symbol}</span>
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
                    className="h-full rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative group"
                    style={{ width: `${MOCK_DATA.currentAllocation.stable}%` }}
                    onHoverStart={() => setHoveredSegment('STABLES')}
                    onHoverEnd={() => setHoveredSegment(null)}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                     <div className="text-center">
                       <span className="font-bold text-emerald-400 text-xl font-mono">STABLES</span>
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
                  <div className="flex gap-6 text-xs text-gray-400 font-mono">
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
                  <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 px-3 py-1 rounded border border-orange-500/20 font-mono">
                    <span className="text-xs font-bold">DRIFT: {MOCK_DATA.delta}%</span>
                  </div>
               </div>
             </div>

             {/* Bottom Stats Grid */}
             <div className="grid grid-cols-3 gap-4 mt-auto pt-8 border-t border-gray-800/50">
                <div className="bg-gray-950/50 p-4 rounded border border-gray-800">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Active Positions</div>
                  <div className="text-2xl font-mono font-bold text-white">{MOCK_DATA.positions}</div>
                </div>
                <div className="bg-gray-950/50 p-4 rounded border border-gray-800">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Protocols</div>
                  <div className="text-2xl font-mono font-bold text-white">{MOCK_DATA.protocols}</div>
                </div>
                <div className="bg-gray-950/50 p-4 rounded border border-gray-800">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Chains</div>
                  <div className="text-2xl font-mono font-bold text-white">{MOCK_DATA.chains}</div>
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* --- FAT FOOTER --- */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-6">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                ZP
              </div>
              <span className="text-white font-bold uppercase tracking-tight">Zap Pilot</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Advanced automated portfolio management for the modern DeFi investor.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Strategies</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Backtesting</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
          © 2024 Zap Pilot Inc. All rights reserved. System Status: Operational.
        </div>
      </footer>
    </div>
  );
}
