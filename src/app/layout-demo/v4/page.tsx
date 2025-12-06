"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV4 } from "@/components/wallet/variations/WalletPortfolioPresenterV4";

export default function LayoutV4Page() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center px-4 sm:px-8 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <Link
          href="/layout-demo"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to comparison
        </Link>
        <div className="ml-auto flex items-center gap-4">
           <span className="text-sm font-medium text-purple-400">Variation 4: Neural Split</span>
           <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 border-l border-gray-800 pl-4">
             <span>Editorial Layout</span>
             <span>•</span>
             <span>Asymmetric Grid</span>
           </div>
        </div>
      </div>

      {/* Main Content - Presenter handles its own layout */}
      <div className="pt-16">
        <WalletPortfolioPresenterV4 />
      </div>
      
      {/* Design Notes Footer */}
      <div className="bg-gray-900 border-t border-gray-800 p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
           <div>
             <h4 className="text-white font-bold mb-2">Design Intent</h4>
             <p className="text-sm text-gray-400">Separates hard metrics (left) from soft narrative (right). Mimics financial editorial layouts like Bloomberg Terminal meets Medium.</p>
           </div>
           <div>
             <h4 className="text-white font-bold mb-2">Key Innovation</h4>
             <p className="text-sm text-gray-400">Sticky sidebar keeps critical numbers always visible while user explores the strategy timeline narrative.</p>
           </div>
           <div>
             <h4 className="text-white font-bold mb-2">Mobile Adaptation</h4>
             <p className="text-sm text-gray-400">Collapses sidebar to top metrics block, maintaining hierarchy but changing flow to vertical stack.</p>
           </div>
        </div>
      </div>
    </div>
  );
}


