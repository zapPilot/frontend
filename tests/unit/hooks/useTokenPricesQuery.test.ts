/**
 * useTokenPricesQuery Tests
 * Unit tests for token prices React Query hook
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useTokenPricesQuery,
  useTokenPricesWithStates,
} from "../../../src/hooks/queries/useTokenPricesQuery";
import * as priceService from "../../../src/services/priceService";

// Mock the price service
vi.mock("../../../src/services/priceService");

// Test wrapper with React Query provider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useTokenPricesQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch prices successfully", async () => {
    const mockPrices = [
      {
        symbol: "btc",
        price: 50000,
        success: true,
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
      {
        symbol: "eth",
        price: 3000,
        success: true,
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
    ];

    vi.mocked(priceService.getTokenPrices).mockResolvedValue(mockPrices);

    const { result } = renderHook(
      () =>
        useTokenPricesQuery({
          symbols: ["BTC", "ETH"],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.prices).toEqual(mockPrices);
    expect(result.current.priceMap["BTC"]).toBeDefined();
    expect(result.current.priceMap["BTC"]?.price).toBe(50000);
    expect(result.current.priceMap["ETH"]?.price).toBe(3000);
    expect(result.current.successCount).toBe(2);
    expect(result.current.failureCount).toBe(0);
  });

  it("should handle empty symbols array", async () => {
    const { result } = renderHook(
      () =>
        useTokenPricesQuery({
          symbols: [],
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.prices).toBeUndefined();
    expect(result.current.symbolCount).toBe(0);
    expect(priceService.getTokenPrices).not.toHaveBeenCalled();
  });

  it("should normalize symbols to uppercase", async () => {
    const mockPrices = [
      {
        symbol: "btc",
        price: 50000,
        success: true,
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
    ];

    vi.mocked(priceService.getTokenPrices).mockResolvedValue(mockPrices);

    const { result } = renderHook(
      () =>
        useTokenPricesQuery({
          symbols: ["btc", "BTC", "Btc"], // Should deduplicate to single "BTC"
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.symbolCount).toBe(1);
    expect(priceService.getTokenPrices).toHaveBeenCalledWith(["BTC"]);
  });

  it("should detect stale data", async () => {
    const staleTimestamp = new Date(Date.now() - 11 * 60 * 1000).toISOString(); // 11 minutes ago (threshold is 10 minutes)
    const mockPrices = [
      {
        symbol: "btc",
        price: 50000,
        success: true,
        timestamp: staleTimestamp,
        fromCache: true,
      },
    ];

    vi.mocked(priceService.getTokenPrices).mockResolvedValue(mockPrices);

    const { result } = renderHook(
      () =>
        useTokenPricesQuery({
          symbols: ["BTC"],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasStaleData).toBe(true);
    expect(result.current.priceMap["BTC"]?.isStale).toBe(true);
  });

  it("should handle failed price fetches", async () => {
    const mockPrices = [
      {
        symbol: "btc",
        price: 50000,
        success: true,
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
      {
        symbol: "invalid",
        price: null,
        success: false,
        error: "Price unavailable",
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
    ];

    vi.mocked(priceService.getTokenPrices).mockResolvedValue(mockPrices);

    const { result } = renderHook(
      () =>
        useTokenPricesQuery({
          symbols: ["BTC", "INVALID"],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.successCount).toBe(1);
    expect(result.current.failureCount).toBe(1);
    expect(result.current.priceMap["INVALID"]?.success).toBe(false);
  });

  it("should respect enabled flag", async () => {
    const { result } = renderHook(
      () =>
        useTokenPricesQuery({
          symbols: ["BTC"],
          enabled: false,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.prices).toBeUndefined();
    expect(priceService.getTokenPrices).not.toHaveBeenCalled();
  });
});

describe("useTokenPricesWithStates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should compute allSuccessful flag", async () => {
    const mockPrices = [
      {
        symbol: "btc",
        price: 50000,
        success: true,
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
      {
        symbol: "eth",
        price: 3000,
        success: true,
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
    ];

    vi.mocked(priceService.getTokenPrices).mockResolvedValue(mockPrices);

    const { result } = renderHook(
      () =>
        useTokenPricesWithStates({
          symbols: ["BTC", "ETH"],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allSuccessful).toBe(true);
    expect(result.current.allFailed).toBe(false);
    expect(result.current.someSuccessful).toBe(true);
  });

  it("should compute allFailed flag", async () => {
    const mockPrices = [
      {
        symbol: "invalid1",
        price: null,
        success: false,
        error: "Price unavailable",
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
      {
        symbol: "invalid2",
        price: null,
        success: false,
        error: "Price unavailable",
        timestamp: new Date().toISOString(),
        fromCache: false,
      },
    ];

    vi.mocked(priceService.getTokenPrices).mockResolvedValue(mockPrices);

    const { result } = renderHook(
      () =>
        useTokenPricesWithStates({
          symbols: ["INVALID1", "INVALID2"],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allSuccessful).toBe(false);
    expect(result.current.allFailed).toBe(true);
    expect(result.current.someSuccessful).toBe(false);
  });

  it("should calculate price age metrics", async () => {
    const now = Date.now();
    const timestamp1 = new Date(now - 60_000).toISOString(); // 1 min ago
    const timestamp2 = new Date(now - 120_000).toISOString(); // 2 min ago

    const mockPrices = [
      {
        symbol: "btc",
        price: 50000,
        success: true,
        timestamp: timestamp1,
        fromCache: false,
      },
      {
        symbol: "eth",
        price: 3000,
        success: true,
        timestamp: timestamp2,
        fromCache: false,
      },
    ];

    vi.mocked(priceService.getTokenPrices).mockResolvedValue(mockPrices);

    const { result } = renderHook(
      () =>
        useTokenPricesWithStates({
          symbols: ["BTC", "ETH"],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Average age should be around 90 seconds (1.5 minutes)
    expect(result.current.averageAge).toBeGreaterThan(60_000);
    expect(result.current.averageAge).toBeLessThan(150_000);

    // Oldest should be around 2 minutes
    expect(result.current.oldestDataAge).toBeGreaterThan(100_000);
    expect(result.current.oldestDataAge).toBeLessThan(150_000);
  });
});
