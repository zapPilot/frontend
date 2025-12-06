/**
 * Layout Variation 2 Demo Route
 * Integrated Strategy Panel - Unified sentiment + regime section
 */

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV2 } from "@/components/wallet/variations/WalletPortfolioPresenterV2";

export default function LayoutV2Page() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <Link
          href="/layout-demo"
          className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to comparison
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Variation 2: Integrated Strategy Panel
          </h1>
          <p className="text-sm text-gray-400">
            Unified panel • 2-card top row • Zap buttons in Balance card • Optimize integrated into strategy
          </p>
        </div>

        {/* Layout */}
        <WalletPortfolioPresenterV2 />

        {/* Info Card */}
        <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-purple-400 mb-2">Key Changes:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>✓ Sentiment merged into regime section as "Strategy Panel"</li>
            <li>✓ Zap buttons moved to Balance card (contextual placement)</li>
            <li>✓ 2-card top row instead of 3 (better mobile performance)</li>
            <li>✓ Optimize button integrated into strategy panel footer</li>
            <li>✓ Explicit sentiment→regime relationship</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
