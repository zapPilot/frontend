"use client";

import { useState } from "react";
import { cn } from "@/lib/ui/classNames";
import { MinimalRebalance } from "./components/MinimalRebalance";
import { MinimalTransaction } from "./components/MinimalTransaction";

export function VariationC({ userId }: { userId: string }) {
  const [activeMode, setActiveMode] = useState<
    "rebalance" | "deposit" | "withdraw"
  >("rebalance");

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-[600px] flex flex-col items-center pt-8 relative">
      {/* Segmented Control */}
      <div className="bg-white dark:bg-gray-900 p-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-800 mb-12 flex gap-1">
        {(["rebalance", "deposit", "withdraw"] as const).map(m => (
          <button
            key={m}
            onClick={() => setActiveMode(m)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all capitalize",
              activeMode === m
                ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="w-full max-w-4xl px-4 pb-20">
        {activeMode === "rebalance" && <MinimalRebalance userId={userId} />}
        {(activeMode === "deposit" || activeMode === "withdraw") && (
          <MinimalTransaction mode={activeMode} />
        )}
      </div>
    </div>
  );
}
