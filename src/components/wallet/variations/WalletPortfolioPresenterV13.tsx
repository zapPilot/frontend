"use client";

import { motion } from "framer-motion";
import { ArrowRight,Settings, TrendingUp, Zap } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, regimes } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV13() {
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-gray-900/30 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Portfolio Overview</div>
            <div className="text-4xl font-bold text-white">${MOCK_DATA.balance.toLocaleString()}</div>
            <div className="text-green-400 font-medium text-sm mt-1">+{MOCK_DATA.roi}% Returns</div>
          </div>
          <GradientButton gradient={GRADIENTS.PRIMARY} icon={Zap} className="shadow-lg shadow-purple-500/20">
            Optimize
          </GradientButton>
        </div>

        {/* THE VISUALIZATION */}
        <div className="space-y-8">
           
           {/* Target Line */}
           <div className="flex justify-between items-end mb-2 text-sm text-gray-500">
             <span>Target Strategy ({currentRegime.label})</span>
             <span className="font-mono text-xs">Crypto: {currentRegime.allocation.crypto}%</span>
           </div>

           {/* Floating Pills Container */}
           <div className="relative h-24 w-full bg-gray-900/50 rounded-2xl border border-gray-800 p-2 flex gap-2">
              
              {/* CRYPTO SECTION (Pills) */}
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
              </div>

              {/* STABLE SECTION (Solid Block) */}
              <motion.div
                className="h-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative group"
                style={{ width: `${MOCK_DATA.currentAllocation.stable}%` }}
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

           {/* Legend/Drift Info */}
           <div className="flex justify-between items-center pt-4 border-t border-gray-800/50">
              <div className="flex gap-6 text-xs">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-500" />
                   <span className="text-gray-400">Bitcoin</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <span className="text-gray-400">Ethereum</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-gray-500" />
                   <span className="text-gray-400">Altcoins</span>
                 </div>
              </div>
              
              <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                 <span className="text-xs font-bold">Drift: {MOCK_DATA.delta}%</span>
                 <ArrowRight className="w-3 h-3" />
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
