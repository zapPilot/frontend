import { QueryClient } from "@tanstack/react-query";

// Create a client instance with optimized configuration for DeFi app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes (good for portfolio data that changes frequently)
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times (good for network issues)
      retry: 2,
      // Don't refetch on window focus by default (can be overridden per query)
      refetchOnWindowFocus: false,
      // Enable background refetching
      refetchOnMount: true,
      // Automatically retry when network reconnects
      refetchOnReconnect: true,
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
