"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV9 } from "@/components/wallet/variations/WalletPortfolioPresenterV9";

export default function LayoutV9Page() {
  return (
    <div>
      {/* Simple Minimalist Nav */}
      <div className="fixed top-8 left-8 z-50">
        <Link
          href="/layout-demo"
          className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-white flex items-center justify-center transition-colors">
             <ArrowLeft className="w-4 h-4 text-gray-900" />
          </div>
          <span className="hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">Back</span>
        </Link>
      </div>

      <WalletPortfolioPresenterV9 />
    </div>
  );
}


