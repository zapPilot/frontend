/**
 * Unit tests for allocationService
 *
 * Tests getAllocationWeights function which fetches
 * marketcap-weighted allocation weights from analytics-engine.
 */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { httpUtils } from "@/lib/http";
import {
  type AllocationWeightsResponse,
  getAllocationWeights,
} from "@/services/allocationService";

const analyticsEngineGetSpy = vi.spyOn(httpUtils.analyticsEngine, "get");

describe("allocationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsEngineGetSpy.mockReset();
  });

  afterAll(() => {
    analyticsEngineGetSpy.mockRestore();
  });

  describe("getAllocationWeights", () => {
    it("should fetch allocation weights from correct endpoint", async () => {
      const mockResponse: AllocationWeightsResponse = {
        btc_weight: 0.65,
        eth_weight: 0.35,
        btc_market_cap: 1800000000000,
        eth_market_cap: 450000000000,
        timestamp: "2025-12-29T12:00:00Z",
        is_fallback: false,
        cached: true,
      };

      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getAllocationWeights();

      expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
        "/api/v2/market/allocation-weights"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should return fallback weights when API returns fallback data", async () => {
      const mockFallbackResponse: AllocationWeightsResponse = {
        btc_weight: 0.6,
        eth_weight: 0.4,
        btc_market_cap: null,
        eth_market_cap: null,
        timestamp: "2025-12-29T12:00:00Z",
        is_fallback: true,
        cached: false,
      };

      analyticsEngineGetSpy.mockResolvedValue(mockFallbackResponse);

      const result = await getAllocationWeights();

      expect(result.is_fallback).toBe(true);
      expect(result.btc_weight).toBe(0.6);
      expect(result.eth_weight).toBe(0.4);
      expect(result.btc_market_cap).toBeNull();
      expect(result.eth_market_cap).toBeNull();
    });

    it("should handle cached responses", async () => {
      const mockCachedResponse: AllocationWeightsResponse = {
        btc_weight: 0.58,
        eth_weight: 0.42,
        btc_market_cap: 1750000000000,
        eth_market_cap: 420000000000,
        timestamp: "2025-12-29T10:00:00Z",
        is_fallback: false,
        cached: true,
      };

      analyticsEngineGetSpy.mockResolvedValue(mockCachedResponse);

      const result = await getAllocationWeights();

      expect(result.cached).toBe(true);
      expect(result.btc_weight + result.eth_weight).toBeCloseTo(1.0);
    });

    it("should propagate errors from HTTP layer", async () => {
      const error = new Error("Network error");
      analyticsEngineGetSpy.mockRejectedValue(error);

      await expect(getAllocationWeights()).rejects.toThrow("Network error");
    });
  });
});
