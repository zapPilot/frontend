import { SwapToken } from "../types/swap";

export const MOCK_TOKENS: SwapToken[] = [
  { symbol: "USDC", name: "USD Coin", balance: 1500.0, price: 1.0 },
  { symbol: "USDT", name: "Tether", balance: 800.0, price: 1.0 },
  { symbol: "ETH", name: "Ethereum", balance: 2.5, price: 2400.0 },
  { symbol: "BTC", name: "Bitcoin", balance: 0.1, price: 45000.0 },
];

export const SWAP_CONSTANTS = {
  DEFAULT_SLIPPAGE: 0.5,
  PRICE_IMPACT_THRESHOLD: 0.01,
  NETWORK_FEE: 2.5,
  CONVERSION_RATE: 0.97,
  MINIMUM_RECEIVED_RATE: 0.995,
  SHARES_CALCULATION_DIVISOR: 100,
} as const;

export const PERFORMANCE_MOCK_DATA = [
  {
    period: "24 Hours",
    change: "+2.4%",
    color: "text-green-400",
    desc: "Daily return",
  },
  {
    period: "7 Days",
    change: "+8.1%",
    color: "text-green-400",
    desc: "Weekly return",
  },
  {
    period: "30 Days",
    change: "+12.7%",
    color: "text-green-400",
    desc: "Monthly return",
  },
  {
    period: "1 Year",
    change: "+45.2%",
    color: "text-green-400",
    desc: "Annual return",
  },
] as const;
