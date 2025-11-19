"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";

import { ChartCloseIcon } from "./ChartCloseIcon";

interface ChartHelpModalProps {
  chartType: "sharpe" | "volatility";
}

const HELP_CONTENT = {
  sharpe: {
    title: "Sharpe Ratio Explained",
    description:
      "Measures risk-adjusted returns. Higher is better. Calculated as (portfolio return - risk-free rate) / portfolio volatility.",
    interpretation: [
      {
        label: "Exceptional (≥2.0)",
        description: "Outstanding risk-adjusted performance (top 5% of DeFi)",
      },
      {
        label: "Excellent (1.5-2.0)",
        description: "Strong returns for risk taken (top 20%)",
      },
      {
        label: "Good (1.0-1.5)",
        description: "Solid performance, beating risk-free rate",
      },
      {
        label: "Moderate (0.5-1.0)",
        description: "Acceptable but could optimize further",
      },
      {
        label: "Low (0-0.5)",
        description: "Weak risk-adjusted returns, rebalance recommended",
      },
      {
        label: "Negative (<0)",
        description: "Losing money relative to safe alternatives",
      },
    ],
  },
  volatility: {
    title: "Volatility Explained",
    description:
      "Measures price fluctuation (standard deviation of returns). Shows how much your portfolio value swings day-to-day. Lower volatility = more stable portfolio.",
    interpretation: [
      {
        label: "Very Low (<20%)",
        description: "Stable, stablecoin-heavy portfolios",
      },
      { label: "Low (20-40%)", description: "Conservative DeFi, low risk" },
      {
        label: "Moderate (40-60%)",
        description: "Typical DeFi range, balanced",
      },
      { label: "High (60-85%)", description: "Aggressive DeFi, crypto-heavy" },
      {
        label: "Extreme (≥85%)",
        description: "Very high risk, significant swings",
      },
    ],
  },
} as const;

export const ChartHelpModal = memo<ChartHelpModalProps>(({ chartType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const content = HELP_CONTENT[chartType];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
        aria-label={`Learn more about ${chartType} chart`}
        title={`Learn more about ${chartType}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Panel */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-l border-gray-700/50 shadow-2xl z-50 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gray-900/98 backdrop-blur-md border-b border-gray-700/50 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-white">
                  {content.title}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded p-1 transition-colors"
                  aria-label="Close panel"
                >
                  <ChartCloseIcon size={24} className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Definition */}
                <section>
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                    What is it?
                  </h4>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {content.description}
                  </p>
                </section>

                {/* DeFi Context */}
                <section className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                    DeFi Context
                  </h4>
                  <ul className="space-y-2">
                    {content.interpretation.map(({ label, description }) => (
                      <li key={label} className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-blue-200">
                          {label}
                        </span>
                        <span className="text-xs text-gray-400 pl-4">
                          {description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Key Takeaways */}
                <section className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-amber-300 mb-3">
                    💡 Key Takeaways
                  </h4>
                  {chartType === "sharpe" ? (
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>
                          Higher Sharpe = better risk-adjusted returns
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>1.0+ is good, 1.5+ is excellent for DeFi</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>
                          Negative means you&apos;re losing vs stablecoins
                        </span>
                      </li>
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex gap-2">
                        <span className="text-amber-400">•</span>
                        <span>
                          60-80% volatility is normal for crypto portfolios
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-400">•</span>
                        <span>
                          Lower volatility = more stable, less stressful
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Add stablecoins to reduce volatility</span>
                      </li>
                    </ul>
                  )}
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

ChartHelpModal.displayName = "ChartHelpModal";
