"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { PortfolioAllocationContainer } from "./PortfolioAllocationContainer";
import {
  AssetCategory,
  PortfolioSwapAction,
  PortfolioVariationType,
} from "./types";

// Mock data for demonstration
const MOCK_ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: "btc",
    name: "BTC",
    color: "#F59E0B",
    protocols: [
      {
        id: "btc-1",
        name: "Compound BTC",
        allocationPercentage: 40,
        chain: "Ethereum",
        apy: 3.2,
        tvl: 120000,
      },
      {
        id: "btc-2",
        name: "Aave WBTC",
        allocationPercentage: 35,
        chain: "Ethereum",
        apy: 2.8,
        tvl: 85000,
      },
      {
        id: "btc-3",
        name: "Curve WBTC",
        allocationPercentage: 25,
        chain: "Polygon",
        apy: 4.1,
        tvl: 65000,
      },
    ],
  },
  {
    id: "eth",
    name: "ETH",
    color: "#8B5CF6",
    protocols: [
      {
        id: "eth-1",
        name: "Lido Staking",
        allocationPercentage: 50,
        chain: "Ethereum",
        apy: 5.2,
        tvl: 250000,
      },
      {
        id: "eth-2",
        name: "Rocket Pool",
        allocationPercentage: 30,
        chain: "Ethereum",
        apy: 4.8,
        tvl: 180000,
      },
      {
        id: "eth-3",
        name: "Frax ETH",
        allocationPercentage: 20,
        chain: "Arbitrum",
        apy: 5.5,
        tvl: 95000,
      },
    ],
  },
  {
    id: "stablecoins",
    name: "Stablecoins",
    color: "#10B981",
    protocols: [
      {
        id: "stable-1",
        name: "USDC Compound",
        allocationPercentage: 45,
        chain: "Ethereum",
        apy: 2.5,
        tvl: 320000,
      },
      {
        id: "stable-2",
        name: "DAI Aave",
        allocationPercentage: 30,
        chain: "Polygon",
        apy: 3.1,
        tvl: 210000,
      },
      {
        id: "stable-3",
        name: "USDT Curve",
        allocationPercentage: 25,
        chain: "Arbitrum",
        apy: 2.8,
        tvl: 175000,
      },
    ],
  },
];

const VARIATION_OPTIONS: {
  value: PortfolioVariationType;
  label: string;
  description: string;
}[] = [
  {
    value: "enhancedOverview",
    label: "Enhanced Overview",
    description: "Interactive pie chart with collapsible protocol details",
  },
];

export const PortfolioAllocationDemo: React.FC = () => {
  const [selectedVariation, setSelectedVariation] =
    useState<PortfolioVariationType>("enhancedOverview");

  const handleZapAction = (action: PortfolioSwapAction) => {
    // eslint-disable-next-line no-console
    console.log("Zap action triggered:", action);
    alert(
      `Zap action triggered with ${action.includedCategories.length} categories: ${action.includedCategories.map(cat => cat.name).join(", ")}`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Demo Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold gradient-text">
          Portfolio Allocation UI Variations
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Explore different UI approaches for visualizing and managing portfolio
          allocation in the Zap Pilot DeFi platform. Each variation offers
          unique interaction patterns for category management and protocol
          transparency.
        </p>
      </div>

      {/* Variation Selector */}
      <div className="bg-gray-900/30 rounded-2xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Select UI Variation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VARIATION_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedVariation(option.value)}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedVariation === option.value
                  ? "border-purple-500 bg-purple-500/10 text-white"
                  : "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500"
              }`}
            >
              <div className="font-medium mb-2">{option.label}</div>
              <div className="text-sm text-gray-400">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Variation Display */}
      <motion.div
        key={selectedVariation}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-900/20 rounded-3xl border border-gray-700 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Current Variation:{" "}
            {
              VARIATION_OPTIONS.find(opt => opt.value === selectedVariation)
                ?.label
            }
          </h2>
          <div className="text-sm text-gray-400">
            Categories: BTC, ETH, Stablecoins
          </div>
        </div>

        <PortfolioAllocationContainer
          variationType={selectedVariation}
          assetCategories={MOCK_ASSET_CATEGORIES}
          operationMode="zapIn"
          isRebalanceMode={false}
          onZapAction={handleZapAction}
        />
      </motion.div>

      {/* Demo Instructions */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">
          Demo Instructions
        </h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>
            • Click the exclusion toggles (X, trash icon, or circle icons) to
            exclude/include categories
          </li>
          <li>
            • Expand categories to see underlying protocols and their
            allocations
          </li>
          <li>
            • Watch how the pie chart and allocation percentages update
            dynamically
          </li>
          <li>
            • Try the &ldquo;Zap&rdquo; button to see how it responds to active
            categories
          </li>
          <li>
            • Switch between variations to compare different interaction
            patterns
          </li>
        </ul>
      </div>
    </div>
  );
};
