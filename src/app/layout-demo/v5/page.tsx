"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV5 } from "@/components/wallet/variations/WalletPortfolioPresenterV5";

export default function LayoutV5Page() {
  return (
    <div className="bg-gray-950 text-white">
       {/* Navigation Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center px-4 sm:px-8 z-50 bg-transparent pointer-events-none">
        <Link
          href="/layout-demo"
          className="pointer-events-auto inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors bg-gray-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="ml-4 pointer-events-auto hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 backdrop-blur border border-gray-800">
           <span className="text-xs font-medium text-blue-400">Variation 5: Timeline First</span>
        </div>
      </div>

      <WalletPortfolioPresenterV5 />
      
       {/* Footer Description */}
       <div className="max-w-7xl mx-auto px-8 pb-12 pt-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 grid md:grid-cols-2 gap-8">
           <div>
             <h3 className="text-lg font-bold text-white mb-2">Concept: Navigation as Strategy</h3>
             <p className="text-sm text-gray-400 leading-relaxed">
               This layout elevates the "Market Regime" from a passive indicator to the primary navigation controller. Users "drive" the dashboard through the timeline, encouraging them to explore different market states and understand the <strong>why</strong> behind the strategy.
             </p>
           </div>
           <div>
              <h4 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Key Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Sticky top navigation bar for instant context switching
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Educational "Simulation Mode" when viewing non-active regimes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Hero card emphasizes philosophy over raw numbers initially
                </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}


