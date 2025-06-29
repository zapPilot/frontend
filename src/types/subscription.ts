/**
 * Subscription and payment types
 */

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number; // USD amount
  features: string[];
  limits: {
    walletAddresses: number;
    apiCalls: number;
    dataRefreshRate: number; // minutes
    historicalData: number; // months
  };
  popular?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  address: string;
  chainId: number;
  decimals: number;
  isStablecoin: boolean;
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: string;
  expiresAt: Date | null;
  walletAddress: string;
  paymentTxHash?: string;
  nextBillingDate?: Date;
}

export interface PaymentTransaction {
  id: string;
  walletAddress: string;
  amount: string;
  token: string;
  chainId: number;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  tier: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface CryptoPrice {
  symbol: string;
  price: number; // in USD
  change24h: number;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started with DeFi analytics",
    price: 0,
    features: [
      "Basic portfolio overview",
      "Up to 3 wallet addresses",
      "Daily data refresh",
      "7-day historical data",
      "Community support",
    ],
    limits: {
      walletAddresses: 3,
      apiCalls: 100,
      dataRefreshRate: 1440, // 24 hours
      historicalData: 1, // 1 month
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced analytics for serious DeFi investors",
    price: 50,
    features: [
      "Advanced portfolio analytics",
      "Unlimited wallet addresses",
      "Real-time data refresh",
      "1-year historical data",
      "Strategy recommendations",
      "Risk analysis",
      "Email & Discord alerts",
      "Priority support",
    ],
    limits: {
      walletAddresses: -1, // unlimited
      apiCalls: 10000,
      dataRefreshRate: 5, // 5 minutes
      historicalData: 12, // 12 months
    },
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Full-featured platform for professional traders",
    price: 200,
    features: [
      "Everything in Pro",
      "API access",
      "Custom strategies",
      "White-label options",
      "Advanced risk modeling",
      "Institutional reporting",
      "Dedicated support",
      "Custom integrations",
    ],
    limits: {
      walletAddresses: -1,
      apiCalls: 100000,
      dataRefreshRate: 1, // 1 minute
      historicalData: 60, // 5 years
    },
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  // Ethereum
  {
    id: "usdc-eth",
    name: "USDC",
    symbol: "USDC",
    icon: "/tokens/usdc.svg",
    address: "0xA0b86a33E6441e41c6c5e9c1a2B2e3E8E7B8B9C0",
    chainId: 1,
    decimals: 6,
    isStablecoin: true,
  },
  {
    id: "usdt-eth",
    name: "USDT",
    symbol: "USDT",
    icon: "/tokens/usdt.svg",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    chainId: 1,
    decimals: 6,
    isStablecoin: true,
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    icon: "/tokens/eth.svg",
    address: "0x0000000000000000000000000000000000000000",
    chainId: 1,
    decimals: 18,
    isStablecoin: false,
  },
  // Arbitrum
  {
    id: "usdc-arb",
    name: "USDC",
    symbol: "USDC",
    icon: "/tokens/usdc.svg",
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    chainId: 42161,
    decimals: 6,
    isStablecoin: true,
  },
  // Base
  {
    id: "usdc-base",
    name: "USDC",
    symbol: "USDC",
    icon: "/tokens/usdc.svg",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chainId: 8453,
    decimals: 6,
    isStablecoin: true,
  },
  // Polygon
  {
    id: "usdc-poly",
    name: "USDC",
    symbol: "USDC",
    icon: "/tokens/usdc.svg",
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    chainId: 137,
    decimals: 6,
    isStablecoin: true,
  },
];

export const CHAIN_CONFIGS = {
  1: { name: "Ethereum", icon: "/chains/ethereum.svg", color: "#627EEA" },
  42161: { name: "Arbitrum", icon: "/chains/arbitrum.svg", color: "#28A0F0" },
  8453: { name: "Base", icon: "/chains/base.svg", color: "#0052FF" },
  137: { name: "Polygon", icon: "/chains/polygon.svg", color: "#8247E5" },
};
