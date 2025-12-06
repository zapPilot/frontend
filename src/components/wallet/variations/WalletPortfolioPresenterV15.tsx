"use client";

import { motion } from "framer-motion";
import { Settings, Zap, Tag } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";
import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV15() {
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-gray-900/30 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Asset Allocation</h2>
          <div className="text-sm text-gray-400">Strategy: <span style={{ color: currentRegime.fillColor }}>{currentRegime.label}</span></div>
        </div>

        {/* THE INLINE BADGES BAR */}
        <div className="h-20 w-full flex rounded-full overflow-hidden bg-gray-800/50 border border-gray-700">
           
           {/* Crypto Track */}
           <div className="h-full relative flex items-center px-4 gap-2 transition-all hover:bg-blue-900/20 cursor-pointer group" style={{ width: `${MOCK_DATA.currentAllocation.crypto}%` }}>
              {/* Background Label */}
              <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10 text-4xl font-bold text-blue-500 uppercase tracking-tighter pointer-events-none">
                Crypto
              </div>

              {/* The Badges */}
              <div className="relative z-10 flex w-full justify-around">
                 {MOCK_DATA.currentAllocation.simplifiedCrypto.map((asset) => (
                   <motion.div 
                     key={asset.symbol}
                     whileHover={{ scale: 1.1 }}
                     className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-600 shadow-lg"
                   >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span className="text-xs font-bold text-white">{asset.symbol}</span>
                      <span className="text-xs text-gray-400 border-l border-gray-700 pl-2 ml-1">{asset.value}%</span>
                   </motion.div>
                 ))}
              </div>
           </div>

           {/* Stable Track */}
           <div className="h-full relative flex items-center justify-center transition-all hover:bg-emerald-900/20 cursor-pointer" style={{ width: `${MOCK_DATA.currentAllocation.stable}%`, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                 <span className="font-bold text-emerald-400">STABLES</span>
                 <span className="text-sm text-emerald-300">{MOCK_DATA.currentAllocation.stable}%</span>
              </div>
           </div>

        </div>

        {/* Helper Text */}
        <div className="mt-4 flex justify-between text-xs text-gray-500 px-4">
           <div>Badges represent % share within the Crypto allocation.</div>
           <div className="flex items-center gap-1"><Tag className="w-3 h-3" /> Interactive Components</div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-12 grid grid-cols-3 gap-6">
           <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center">
             <div className="text-gray-500 text-xs uppercase mb-1">Total Value</div>
             <div className="text-2xl font-bold text-white">${MOCK_DATA.balance.toLocaleString()}</div>
           </div>
           <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center">
             <div className="text-gray-500 text-xs uppercase mb-1">Performance</div>
             <div className="text-2xl font-bold text-green-400">+{MOCK_DATA.roi}%</div>
           </div>
           <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center flex flex-col justify-center">
             <GradientButton gradient={GRADIENTS.PRIMARY} className="w-full text-xs py-2">
               Rebalance Portfolio
             </GradientButton>
           </div>
        </div>

      </div>
    </div>
  );
}


