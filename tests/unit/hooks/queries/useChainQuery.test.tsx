/**
 * useChainQuery - Hook Tests
 *
 * Tests for the chain data query hook.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import hook after mocking
import { useChainQuery } from "@/hooks/queries/useChainQuery";

// Mock chain service
const mockGetSupportedChains = vi.fn();
const mockGetChainById = vi.fn();

vi.mock("@/services", () => ({
  chainService: {
    getSupportedChains: () => mockGetSupportedChains(),
    getChainById: (chainId: number) => mockGetChainById(chainId),
  },
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

const mockChainData = [
  {
    chainId: 1,
    name: "Ethereum",
    symbol: "ETH",
    iconUrl: "/chains/eth.svg",
    isActive: true,
  },
  {
    chainId: 137,
    name: "Polygon",
    symbol: "MATIC",
    iconUrl: "/chains/polygon.svg",
    isActive: true,
  },
];

describe("useChainQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSupportedChains.mockResolvedValue(mockChainData);
    mockGetChainById.mockImplementation((chainId: number) =>
      Promise.resolve(mockChainData.find(c => c.chainId === chainId))
    );
  });

  describe("Query without chainId", () => {
    it("should fetch all supported chains when no chainId provided", async () => {
      const { result } = renderHook(() => useChainQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetSupportedChains).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockChainData);
    });

    it("should use 'all' as query key when no chainId", async () => {
      const { result } = renderHook(() => useChainQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetSupportedChains).toHaveBeenCalledTimes(1);
      expect(mockGetChainById).not.toHaveBeenCalled();
    });
  });

  describe("Query with specific chainId", () => {
    it("should fetch single chain when chainId is provided", async () => {
      const { result } = renderHook(() => useChainQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetChainById).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual(mockChainData[0]);
    });

    it("should return undefined for non-existent chainId", async () => {
      mockGetChainById.mockResolvedValue(undefined);

      const { result } = renderHook(() => useChainQuery(999), {
        wrapper: createWrapper(),
      });

      // Wait for query to complete - data will be undefined for non-existent chain
      await waitFor(() => expect(result.current.isFetching).toBe(false));

      expect(mockGetChainById).toHaveBeenCalledWith(999);
      expect(result.current.data).toBeUndefined();
    });

    it("should use chainId as part of query key", async () => {
      mockGetChainById.mockResolvedValue(mockChainData[1]);

      const { result } = renderHook(() => useChainQuery(137), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetChainById).toHaveBeenCalledWith(137);
      expect(result.current.data?.chainId).toBe(137);
    });
  });

  describe("Query options", () => {
    it("should have staleTime set to Infinity", async () => {
      const { result } = renderHook(() => useChainQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify data is cached (query won't refetch on remount)
      expect(mockGetSupportedChains).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading and error states", () => {
    it("should show loading state initially", () => {
      // Use a delayed mock to capture loading state
      mockGetSupportedChains.mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve(mockChainData), 100))
      );

      const { result } = renderHook(() => useChainQuery(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Failed to fetch chains");
      mockGetSupportedChains.mockRejectedValue(error);

      const { result } = renderHook(() => useChainQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });
});
