"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { InvestmentOpportunity } from "../../types/investment";

interface SwapPageHeaderProps {
  strategy: InvestmentOpportunity;
  onBack: () => void;
}

export function SwapPageHeader({ strategy, onBack }: SwapPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg glass-morphism hover:bg-white/10 transition-all duration-300"
          data-testid="back-button"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div>
          <h1
            className="text-2xl font-bold text-white"
            data-testid="strategy-name"
          >
            {strategy.name}
          </h1>
          <p className="text-gray-400" data-testid="strategy-info">
            Invest • {strategy.apr}% APR • {strategy.risk} Risk
          </p>
        </div>
      </div>
      <div className="text-sm text-gray-400" data-testid="strategy-tvl">
        TVL: {strategy.tvl}
      </div>
    </motion.div>
  );
}
