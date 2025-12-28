/**
 * useBtcPriceQuery - Hook Tests
 *
 * Tests for the BTC/token price query hook.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import hook after mocking
import { useBtcPriceQuery } from "@/hooks/queries/useBtcPriceQuery";

// Mock BTC price service
const mockGetBtcPriceHistory = vi.fn();
vi.mock("@/services/btcPriceService", () => ({
  getBtcPriceHistory: (days: number, token: string) =>
    mockGetBtcPriceHistory(days, token),
}));

// Mock queryDefaults
vi.mock("@/hooks/queries/queryDefaults", () => ({
  createQueryConfig: () => ({
    staleTime: 60000,
    gcTime: 300000,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
}

const mockPriceData = {
  snapshots: [
    { date: "2024-01-01", price_usd: 50000, source: "coingecko" },
    { date: "2024-01-02", price_usd: 51000, source: "coingecko" },
  ],
  count: 2,
  days_requested: 90,
  oldest_date: "2024-01-01",
  latest_date: "2024-01-02",
  cached: false,
};

describe("useBtcPriceQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBtcPriceHistory.mockResolvedValue(mockPriceData);
  });

  describe("Default parameters", () => {
    it("should use default days=90 and token='btc'", async () => {
      const { result } = renderHook(() => useBtcPriceQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetBtcPriceHistory).toHaveBeenCalledWith(90, "btc");
    });

    it("should return price data on success", async () => {
      const { result } = renderHook(() => useBtcPriceQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPriceData);
      expect(result.current.data?.snapshots.length).toBe(2);
    });
  });

  describe("Custom parameters", () => {
    it("should accept custom days parameter", async () => {
      const { result } = renderHook(() => useBtcPriceQuery(30), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetBtcPriceHistory).toHaveBeenCalledWith(30, "btc");
    });

    it("should accept custom token parameter", async () => {
      const { result } = renderHook(() => useBtcPriceQuery(90, "eth"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetBtcPriceHistory).toHaveBeenCalledWith(90, "eth");
    });

    it("should accept both custom days and token", async () => {
      const { result } = renderHook(() => useBtcPriceQuery(180, "sol"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetBtcPriceHistory).toHaveBeenCalledWith(180, "sol");
    });
  });

  describe("Query key structure", () => {
    it("should normalize token to lowercase in query key", async () => {
      const { result } = renderHook(() => useBtcPriceQuery(90, "ETH"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The query key should have lowercase token
      expect(mockGetBtcPriceHistory).toHaveBeenCalledWith(90, "ETH");
    });
  });

  describe("Error handling", () => {
    it("should handle API errors", async () => {
      mockGetBtcPriceHistory.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() => useBtcPriceQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("Loading states", () => {
    it("should show loading state initially", () => {
      mockGetBtcPriceHistory.mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve(mockPriceData), 100))
      );

      const { result } = renderHook(() => useBtcPriceQuery(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });
});
