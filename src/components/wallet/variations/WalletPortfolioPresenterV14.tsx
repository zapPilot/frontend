"use client";

import { motion } from "framer-motion";
import { Settings, Zap, CornerDownRight } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";
import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV14() {
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-gray-900/30 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="mb-12 text-center">
          <div className="text-4xl font-bold text-white mb-2">${MOCK_DATA.balance.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Portfolio Structure Analysis</div>
        </div>

        {/* THE HIERARCHY TREE */}
        <div className="space-y-4">
           
           {/* Level 1: Macro Split */}
           <div className="flex h-16 w-full rounded-xl overflow-hidden bg-gray-800">
              {/* Crypto Macro Bar */}
              <div className="relative group flex items-center justify-center cursor-pointer transition-all hover:brightness-110" style={{ width: `${MOCK_DATA.currentAllocation.crypto}%`, backgroundColor: '#3B82F6' }}>
                 <span className="font-bold text-white text-xl">CRYPTO {MOCK_DATA.currentAllocation.crypto}%</span>
              </div>
              
              {/* Stable Macro Bar */}
              <div className="relative group flex items-center justify-center cursor-pointer transition-all hover:brightness-110" style={{ width: `${MOCK_DATA.currentAllocation.stable}%`, backgroundColor: '#10B981' }}>
                 <span className="font-bold text-white text-xl">STABLES {MOCK_DATA.currentAllocation.stable}%</span>
              </div>
           </div>

           {/* Level 2: The Bracket Breakdown */}
           <div className="relative pl-8 pr-8">
              {/* Visual Bracket Lines */}
              <div className="absolute top-0 left-[10%] w-[45%] h-8 border-l-2 border-b-2 border-gray-700 rounded-bl-xl" />
              
              <div className="grid grid-cols-3 gap-4 pt-8 w-[65%]">
                 {MOCK_DATA.currentAllocation.simplifiedCrypto.map((asset) => (
                   <motion.div 
                     key={asset.symbol}
                     whileHover={{ y: -5 }}
                     className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 flex flex-col items-center text-center shadow-lg"
                   >
                      <div className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: asset.color }}>
                        {asset.symbol[0]}
                      </div>
                      <div className="font-bold text-white">{asset.symbol}</div>
                      <div className="text-xs text-gray-400">{asset.value}%</div>
                      <div className="w-full h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full" style={{ width: `${asset.value}%`, backgroundColor: asset.color }} />
                      </div>
                   </motion.div>
                 ))}
              </div>

              {/* Stable Note */}
              <div className="absolute top-8 right-[10%] text-gray-500 text-xs italic max-w-[150px] text-right">
                Stablecoin composition is automatically managed by the yield aggregator.
              </div>
           </div>

        </div>

        {/* Action Footer */}
        <div className="mt-12 flex justify-center">
           <GradientButton gradient={GRADIENTS.PRIMARY} icon={Zap} className="px-8">
             Rebalance Structure
           </GradientButton>
        </div>

      </div>
    </div>
  );
}


