/**
 * Unit tests for useAllocationWeights hook
 *
 * Tests the React Query hook for fetching marketcap-weighted allocation weights.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as allocationService from "@/services/allocationService";

import {
  DEFAULT_ALLOCATION_WEIGHTS,
  useAllocationWeights,
} from "../../../../src/hooks/queries/useAllocationWeights";

// Mock the allocation service
vi.mock("@/services/allocationService", () => ({
  getAllocationWeights: vi.fn(),
}));

describe("useAllocationWeights", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe("DEFAULT_ALLOCATION_WEIGHTS", () => {
    it("should export default allocation weights constant", () => {
      expect(DEFAULT_ALLOCATION_WEIGHTS).toBeDefined();
      expect(DEFAULT_ALLOCATION_WEIGHTS.btc_weight).toBe(0.6);
      expect(DEFAULT_ALLOCATION_WEIGHTS.eth_weight).toBe(0.4);
      expect(DEFAULT_ALLOCATION_WEIGHTS.is_fallback).toBe(true);
      expect(DEFAULT_ALLOCATION_WEIGHTS.cached).toBe(false);
      expect(DEFAULT_ALLOCATION_WEIGHTS.btc_market_cap).toBeNull();
      expect(DEFAULT_ALLOCATION_WEIGHTS.eth_market_cap).toBeNull();
    });

    it("should have weights that sum to 1.0", () => {
      const sum =
        DEFAULT_ALLOCATION_WEIGHTS.btc_weight +
        DEFAULT_ALLOCATION_WEIGHTS.eth_weight;
      expect(sum).toBe(1.0);
    });
  });

  describe("useAllocationWeights hook", () => {
    it("should fetch allocation weights successfully", async () => {
      const mockResponse: allocationService.AllocationWeightsResponse = {
        btc_weight: 0.65,
        eth_weight: 0.35,
        btc_market_cap: 1800000000000,
        eth_market_cap: 450000000000,
        timestamp: "2025-12-29T12:00:00Z",
        is_fallback: false,
        cached: true,
      };

      vi.mocked(allocationService.getAllocationWeights).mockResolvedValue(
        mockResponse
      );

      const { result } = renderHook(() => useAllocationWeights(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(allocationService.getAllocationWeights).toHaveBeenCalledTimes(1);
    });

    it("should handle loading state", () => {
      vi.mocked(allocationService.getAllocationWeights).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      const { result } = renderHook(() => useAllocationWeights(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should use correct query key", async () => {
      const mockResponse: allocationService.AllocationWeightsResponse = {
        btc_weight: 0.6,
        eth_weight: 0.4,
        btc_market_cap: null,
        eth_market_cap: null,
        timestamp: "2025-12-29T12:00:00Z",
        is_fallback: true,
        cached: false,
      };

      vi.mocked(allocationService.getAllocationWeights).mockResolvedValue(
        mockResponse
      );

      const { result } = renderHook(() => useAllocationWeights(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify query was cached with correct key
      const queryData = queryClient.getQueryData(["allocation-weights"]);
      expect(queryData).toEqual(mockResponse);
    });
  });
});
