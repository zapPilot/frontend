import { motion } from "framer-motion";

/**
 * Constituent asset type for allocation breakdown
 */
export interface AllocationConstituent {
  asset: string;
  symbol: string;
  name: string;
  value: number;
  color: string;
}

interface AllocationBarsProps {
  cryptoAssets: AllocationConstituent[];
  cryptoPercentage: number;
  stablePercentage: number;
}

/**
 * AllocationBars - Reusable visualization component for portfolio allocation
 *
 * Displays crypto and stable asset allocation as interactive animated bars.
 * Used for both real portfolio data and target regime allocations in empty state.
 *
 * @param cryptoAssets - Array of crypto assets with symbols, values, and colors
 * @param cryptoPercentage - Total crypto allocation percentage (0-100)
 * @param stablePercentage - Total stablecoins allocation percentage (0-100)
 */
export function AllocationBars({
  cryptoAssets,
  cryptoPercentage,
  stablePercentage,
}: AllocationBarsProps) {
  return (
    <>
      {/* Crypto Section */}
      {cryptoAssets.length > 0 && (
        <div
          className="h-full flex gap-1 transition-all duration-500 ease-out"
          style={{
            width: `${cryptoPercentage}%`,
          }}
        >
          {cryptoAssets.map(asset => (
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
      )}

      {/* Stable Section - Only show if has value */}
      {stablePercentage > 0 && (
        <motion.div
          data-testid="composition-stables"
          className="h-full rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative group"
          style={{
            width: `${stablePercentage}%`,
          }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="text-center">
            <span className="font-bold text-emerald-400 text-lg">STABLES</span>
            <div className="text-xs text-emerald-500/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              {stablePercentage.toFixed(2)}%
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
