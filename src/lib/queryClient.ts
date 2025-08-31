import { QueryClient } from "@tanstack/react-query";

// Create a client instance with optimized configuration for DeFi app
// ETL updates data once daily, so we optimize for 24-hour cache cycles
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 24 hours since ETL only updates once daily
      staleTime: 24 * 60 * 60 * 1000,
      // Keep data in cache for 24 hours
      gcTime: 24 * 60 * 60 * 1000,
      // Retry failed requests 2 times (good for network issues)
      retry: 2,
      // Disable all automatic refetching since data updates daily
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Disable interval refetching
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query key factories for consistent key management
export const queryKeys = {
  // User-related queries
  user: {
    all: ["user"] as const,
    byWallet: (walletAddress: string) =>
      ["user", "by-wallet", walletAddress] as const,
    bundleWallets: (userId: string) =>
      ["user", "bundle-wallets", userId] as const,
  },
  // Portfolio-related queries
  portfolio: {
    all: ["portfolio"] as const,
    summary: (userId: string) => ["portfolio", "summary", userId] as const,
    analytics: (userId: string) => ["portfolio", "analytics", userId] as const,
    apr: (userId: string) => ["portfolio", "apr", userId] as const,
    landingPage: (userId: string) =>
      ["portfolio", "landing-page", userId] as const,
  },
} as const;
