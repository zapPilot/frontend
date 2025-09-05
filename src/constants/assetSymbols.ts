export const ASSET_SYMBOL_MAP = {
  btc: ["btc", "wbtc", "cbbtc", "tbtc"],
  eth: ["eth", "weth", "steth", "wsteth", "weeth", "mseth", "frxeth"],
  stablecoins: [
    "usdc",
    "usdt",
    "dai",
    "frax",
    "usd₮0",
    "bold",
    "msusd",
    "openusdt",
    "susd",
    "gho",
    "vst",
    "frxusd",
    "wfrax",
    "legacy frax dollar",
  ],
} as const;

// Convenience sets for fast lookups (lowercased)
export const ASSET_SYMBOL_SETS = {
  btc: new Set(ASSET_SYMBOL_MAP.btc.map(s => s.toLowerCase())),
  eth: new Set(ASSET_SYMBOL_MAP.eth.map(s => s.toLowerCase())),
  stablecoins: new Set(ASSET_SYMBOL_MAP.stablecoins.map(s => s.toLowerCase())),
} as const;
