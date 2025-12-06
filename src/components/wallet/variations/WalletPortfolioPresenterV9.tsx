"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, regimes } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV9() {
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);

  // Helper to highlight text
  const Highlight = ({ children, color = "text-white", bg = "bg-transparent" }: { children: React.ReactNode, color?: string, bg?: string }) => (
    <span className={`font-bold ${color} ${bg} px-1 rounded relative inline-block`}>
      {children}
    </span>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        
        {/* Main Chat/Narrative Block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-3xl md:text-5xl leading-relaxed md:leading-tight text-gray-400"
        >
          <p className="mb-8">
            Good afternoon. The market is currently in a state of <Highlight color="text-orange-400" bg="bg-orange-500/10">{MOCK_DATA.sentimentStatus}</Highlight> (Score: {MOCK_DATA.sentimentValue}).
          </p>
          
          <p className="mb-8">
            Your portfolio value stands at <Highlight color="text-white" bg="bg-white/5">${MOCK_DATA.balance.toLocaleString()}</Highlight>, 
            reflecting a <Highlight color="text-green-400">+{MOCK_DATA.roi}%</Highlight> return.
          </p>

          <p className="mb-8">
            However, based on the <Highlight color="text-purple-400">{currentRegime.label}</Highlight> strategy, 
            you are currently <Highlight color="text-red-400" bg="bg-red-500/10">underweight</Highlight> in crypto assets 
            by approximately <Highlight>{MOCK_DATA.delta}%</Highlight>.
          </p>

          <p className="mb-12 text-2xl md:text-4xl">
            "{currentRegime.philosophy}"
          </p>
        </motion.div>

        {/* Action Block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col md:flex-row items-start md:items-center gap-6 border-t border-gray-800 pt-8"
        >
           <div className="flex-1">
             <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Recommended Action</h4>
             <p className="text-gray-300 text-lg">
               Rebalance now to align with the target allocation of <strong>{currentRegime.allocation.crypto}% Crypto</strong>.
             </p>
           </div>

           <div className="flex-shrink-0 flex gap-4">
             <GradientButton 
                gradient={GRADIENTS.PRIMARY}
                className="px-8 py-4 text-lg"
                icon={Zap}
             >
               Optimize Now
             </GradientButton>
           </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1 }}
           className="mt-16 flex gap-6 text-sm text-gray-600 font-sans"
        >
           <button className="hover:text-white transition-colors flex items-center gap-1">
             View Detailed Breakdown <ArrowRight className="w-3 h-3" />
           </button>
           <button className="hover:text-white transition-colors flex items-center gap-1">
             History <ArrowRight className="w-3 h-3" />
           </button>
           <button className="hover:text-white transition-colors flex items-center gap-1">
             Strategy Settings <ArrowRight className="w-3 h-3" />
           </button>
        </motion.div>

      </div>
    </div>
  );
}


