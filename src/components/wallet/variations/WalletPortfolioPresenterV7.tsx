"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronDown,Settings, Zap } from "lucide-react";
import { useRef } from "react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";

import { getRegimeById, regimes } from "../regime/regimeData";
import { ALLOCATION_GRADIENTS,AllocationProgressBar } from "../regime/RegimeUtils";
import { MOCK_DATA } from "./mockPortfolioData";

export function WalletPortfolioPresenterV7() {
  const currentRegime = getRegimeById(MOCK_DATA.currentRegime);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll progress for timeline animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const timelineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative bg-gray-950 min-h-[300vh]">
      
      {/* FIXED SPINE: THE TIMELINE */}
      <div className="fixed left-4 md:left-1/2 top-0 bottom-0 w-px bg-gray-800/50 -translate-x-1/2 z-0">
        <motion.div 
          className="w-full bg-purple-500/50 origin-top"
          style={{ scaleY: timelineScaleY, height: "100%" }}
        />
      </div>

      {/* FIXED HEADER METRICS */}
      <div className="fixed top-16 right-4 md:right-12 z-50 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-full px-6 py-2 flex items-center gap-6 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Balance</span>
          <span className="text-sm font-bold text-white">${MOCK_DATA.balance.toLocaleString()}</span>
        </div>
        <div className="h-6 w-px bg-gray-700" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">ROI</span>
          <span className="text-sm font-bold text-green-400">+{MOCK_DATA.roi}%</span>
        </div>
      </div>

      {/* SECTION 1: INTRO & SENTIMENT */}
      <section className="h-screen flex items-center justify-center relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-32 max-w-6xl mx-auto px-6 w-full">
          <div className="text-right space-y-4 flex flex-col items-end justify-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-20%" }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter opacity-20">
                {MOCK_DATA.sentimentStatus}
              </h2>
              <h3 className="text-2xl md:text-4xl font-bold text-purple-400 -mt-6 md:-mt-8 relative z-10">
                Market Sentiment
              </h3>
              <div className="mt-4 inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 font-mono">
                Score: {MOCK_DATA.sentimentValue}/100
              </div>
            </motion.div>
          </div>

          <div className="md:pl-12 flex flex-col justify-center">
             {/* Center Node on Desktop */}
             <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.6)] z-20" />
             
             <motion.p 
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="text-lg text-gray-400 leading-relaxed max-w-md"
             >
               The market is currently driven by <strong className="text-white">{MOCK_DATA.sentimentStatus}</strong>. 
               This sets the stage for our strategic positioning. Scroll to explore how this impacts your portfolio.
             </motion.p>
             
             <motion.div 
               animate={{ y: [0, 10, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute bottom-12 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-12 text-gray-600 flex flex-col items-center gap-2"
             >
               <span className="text-xs uppercase tracking-widest">Scroll</span>
               <ChevronDown className="w-4 h-4" />
             </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: REGIME PHILOSOPHY */}
      <section className="h-screen flex items-center justify-center relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-32 max-w-6xl mx-auto px-6 w-full">
           <div className="order-2 md:order-1 text-right flex flex-col justify-center items-end">
              <motion.blockquote 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="text-3xl md:text-5xl font-serif text-white leading-tight max-w-lg"
              >
                "{currentRegime.philosophy}"
              </motion.blockquote>
              <p className="mt-6 text-gray-500 max-w-sm">
                {currentRegime.whyThisWorks}
              </p>
           </div>

           <div className="order-1 md:order-2 md:pl-12 flex items-center">
             {/* Center Node on Desktop */}
             <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.6)] z-20" />
             
             <motion.div
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.8 }}
             >
               <div className="bg-gray-900/50 backdrop-blur border border-gray-800 p-8 rounded-2xl max-w-md">
                 <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Current Regime</h4>
                 <div className="text-4xl font-bold text-white mb-2" style={{ color: currentRegime.fillColor }}>
                   {currentRegime.label}
                 </div>
                 <div className="flex gap-2 mt-4">
                   {regimes.map(r => (
                     <div 
                      key={r.id} 
                      className={`h-1 flex-1 rounded-full ${r.id === MOCK_DATA.currentRegime ? 'bg-white' : 'bg-gray-800'}`}
                     />
                   ))}
                 </div>
               </div>
             </motion.div>
           </div>
        </div>
      </section>

      {/* SECTION 3: ALLOCATION & ACTION */}
      <section className="h-screen flex items-center justify-center relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-32 max-w-6xl mx-auto px-6 w-full">
          <div className="text-right space-y-6 flex flex-col justify-center items-end">
             <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.6 }}
               className="bg-gray-900/80 backdrop-blur border border-gray-800 p-6 rounded-2xl w-full max-w-md"
             >
               <h3 className="text-xl font-bold text-white mb-6">Portfolio Allocation</h3>
               <div className="space-y-4">
                 <AllocationProgressBar 
                    label="Current"
                    percentage={MOCK_DATA.currentAllocation.crypto}
                    gradient={ALLOCATION_GRADIENTS.crypto}
                 />
                 <div className="relative">
                   <AllocationProgressBar 
                      label="Target"
                      percentage={currentRegime.allocation.crypto}
                      gradient={`linear-gradient(90deg, ${currentRegime.fillColor} 0%, ${currentRegime.fillColor}88 100%)`}
                   />
                   <div className="absolute right-0 top-0 text-xs font-bold text-orange-400">
                     Gap: {MOCK_DATA.delta}%
                   </div>
                 </div>
               </div>
             </motion.div>
          </div>

          <div className="md:pl-12 flex flex-col justify-center">
             {/* Center Node on Desktop */}
             <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-4 border-gray-950 bg-green-500 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.6)] z-20" />
             
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5 }}
               className="space-y-4 max-w-sm"
             >
               <h3 className="text-2xl font-bold text-white">Take Action</h3>
               <p className="text-gray-400 mb-6">
                 Your portfolio is significantly drifted from the optimal {currentRegime.label} strategy.
               </p>
               
               <GradientButton 
                 gradient={GRADIENTS.PRIMARY}
                 className="w-full py-4 text-lg shadow-lg shadow-purple-500/20"
                 icon={Zap}
               >
                 Optimize Portfolio
               </GradientButton>
               
               <div className="grid grid-cols-2 gap-4">
                 <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 transition-all">
                   <ArrowDownRight className="w-4 h-4" /> Zap In
                 </button>
                 <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 transition-all">
                   <ArrowUpRight className="w-4 h-4" /> Zap Out
                 </button>
               </div>
             </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}


