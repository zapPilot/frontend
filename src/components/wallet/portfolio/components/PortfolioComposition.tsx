import { motion } from "framer-motion";
import { Zap } from "lucide-react";

import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { ASSET_COLORS } from "@/adapters/walletPortfolio";
import { GradientButton } from "@/components/ui";
import {
  getRegimeAllocation,
  type Regime,
} from "@/components/wallet/regime/regimeData";
import { GRADIENTS } from "@/constants/design-system";

import { MOCK_DATA } from "../data/mockPortfolioData";

interface PortfolioCompositionProps {
  data: typeof MOCK_DATA | WalletPortfolioDataWithDirection;
  currentRegime: Regime;
  onRebalance: () => void;
}

export function PortfolioComposition({
  data,
  currentRegime,
  onRebalance,
}: PortfolioCompositionProps) {
  const targetBreakdown = getRegimeAllocation(currentRegime);
  const target = {
    crypto: targetBreakdown.spot + targetBreakdown.lp,
    stable: targetBreakdown.stable,
  };

  return (
    <div
      className="bg-gray-900/20 border border-gray-800 rounded-2xl p-8 flex flex-col relative overflow-hidden"
      data-testid="composition-bar"
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Portfolio Composition
          </h2>
          <p className="text-sm text-gray-400">
            Target:{" "}
            <span className="text-gray-300 font-mono">
              {target.stable}% Stable
            </span>{" "}
            /{" "}
            <span className="text-gray-300 font-mono">
              {target.crypto}% Crypto
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <GradientButton
            data-testid="rebalance-button"
            gradient={GRADIENTS.PRIMARY}
            icon={Zap}
            className="h-8 text-xs"
            onClick={onRebalance}
          >
            Rebalance
          </GradientButton>
        </div>
      </div>

      {/* THE GHOST BAR TRACK */}
      <div className="relative h-24 w-full bg-gray-900/50 rounded-xl border border-gray-800 p-1 flex overflow-hidden">
        {/* GHOST TARGET BACKGROUND - Visual guide only */}
        <div className="absolute inset-0 flex opacity-20 pointer-events-none">
          <div
            style={{ width: `${target.crypto}%` }}
            className="h-full border-r border-dashed border-white/30"
          />
          <div
            style={{ width: `${target.stable}%` }}
            className="h-full"
          />
        </div>

        {/* ACTUAL BARS (Foreground) */}
        <div className="relative w-full h-full flex gap-1 z-10">
          {/* Crypto Section */}
          <div
            className="h-full flex gap-1 transition-all duration-500 ease-out"
            style={{
              width: `${data.currentAllocation.crypto}%`,
            }}
          >
            {data.currentAllocation.simplifiedCrypto.map(asset => (
              <motion.div
                key={asset.symbol}
                data-testid={`composition-${asset.symbol.toLowerCase()}`}
                className="h-full rounded-lg relative group overflow-hidden cursor-pointer"
                style={{
                  flex: asset.value,
                  backgroundColor: `${asset.color}20`,
                  border: `1px solid ${asset.color}50`,
                }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-bold text-white text-lg">
                    {asset.symbol}
                  </span>
                  <span className="text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.value.toFixed(2)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stable Section */}
          <motion.div
            data-testid="composition-stables"
            className="h-full rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative group"
            style={{
              width: `${data.currentAllocation.stable}%`,
            }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="text-center">
              <span className="font-bold text-emerald-400 text-lg">
                STABLES
              </span>
              <div className="text-xs text-emerald-500/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {data.currentAllocation.stable.toFixed(2)}%
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-between mt-4 px-1">
        <div className="flex gap-4 text-xs text-gray-400">
          {data.currentAllocation.simplifiedCrypto.map(asset => (
            <div key={asset.symbol} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: asset.color }}
              />
              <span>{asset.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ASSET_COLORS.USDT }}
            />
            <span>Stablecoins</span>
          </div>
        </div>
        <div className="text-xs font-bold text-orange-400">
          Drift: {data.delta.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
