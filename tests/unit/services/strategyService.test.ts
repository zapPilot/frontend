/**
 * Test suite for strategyService
 *
 * Tests:
 * - getStrategyConfigs endpoint calls
 * - Response structure with presets and backtest_defaults
 * - Backward compatibility with old API format (array response)
 */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { httpUtils } from "@/lib/http";
import {
  getStrategyConfigs,
  type StrategyConfigsResponse,
  type StrategyPreset,
} from "@/services/strategyService";

const analyticsEngineGetSpy = vi.spyOn(httpUtils.analyticsEngine, "get");

const createMockPreset = (
  overrides: Partial<StrategyPreset> = {}
): StrategyPreset => ({
  config_id: "test_preset",
  display_name: "Test Preset",
  description: "Test description",
  strategy_id: "dca_classic",
  params: {},
  is_default: false,
  is_benchmark: false,
  ...overrides,
});

const createMockResponse = (
  overrides: Partial<StrategyConfigsResponse> = {}
): StrategyConfigsResponse => ({
  presets: [
    createMockPreset({ config_id: "dca_classic", is_benchmark: true }),
    createMockPreset({
      config_id: "fgi_exponential",
      strategy_id: "simple_regime",
      is_default: true,
    }),
  ],
  backtest_defaults: { days: 500, total_capital: 10000 },
  ...overrides,
});

describe("strategyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsEngineGetSpy.mockReset();
  });

  afterAll(() => {
    analyticsEngineGetSpy.mockRestore();
  });

  describe("getStrategyConfigs", () => {
    it("calls correct endpoint", async () => {
      const mockResponse = createMockResponse();
      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      await getStrategyConfigs();

      expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
        "/api/v3/strategy/configs"
      );
    });

    it("returns StrategyConfigsResponse with presets and defaults", async () => {
      const mockResponse = createMockResponse();
      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getStrategyConfigs();

      expect(result.presets).toHaveLength(2);
      expect(result.backtest_defaults.days).toBe(500);
      expect(result.backtest_defaults.total_capital).toBe(10000);
    });

    it("returns presets with correct structure", async () => {
      const mockResponse = createMockResponse();
      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getStrategyConfigs();

      const benchmark = result.presets.find(p => p.is_benchmark);
      const defaultPreset = result.presets.find(p => p.is_default);

      expect(benchmark).toBeDefined();
      expect(benchmark?.config_id).toBe("dca_classic");

      expect(defaultPreset).toBeDefined();
      expect(defaultPreset?.config_id).toBe("fgi_exponential");
    });

    it("handles backward compatibility with array response", async () => {
      // Old API returns array instead of object
      const mockArrayResponse: StrategyPreset[] = [
        createMockPreset({ config_id: "dca_classic", is_benchmark: true }),
        createMockPreset({
          config_id: "fgi_exponential",
          strategy_id: "simple_regime",
          is_default: true,
        }),
      ];
      analyticsEngineGetSpy.mockResolvedValue(mockArrayResponse);

      const result = await getStrategyConfigs();

      // Should wrap in response envelope with fallback defaults
      expect(result.presets).toHaveLength(2);
      expect(result.backtest_defaults.days).toBe(90); // FALLBACK
      expect(result.backtest_defaults.total_capital).toBe(10000); // FALLBACK
    });

    it("handles empty presets array", async () => {
      const mockResponse = createMockResponse({ presets: [] });
      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getStrategyConfigs();

      expect(result.presets).toHaveLength(0);
      expect(result.backtest_defaults.days).toBe(500);
    });

    it("handles custom backtest defaults from API", async () => {
      const mockResponse = createMockResponse({
        backtest_defaults: { days: 365, total_capital: 50000 },
      });
      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getStrategyConfigs();

      expect(result.backtest_defaults.days).toBe(365);
      expect(result.backtest_defaults.total_capital).toBe(50000);
    });

    it("propagates errors from HTTP layer", async () => {
      const error = new Error("Network error");
      analyticsEngineGetSpy.mockRejectedValue(error);

      await expect(getStrategyConfigs()).rejects.toThrow("Network error");
    });

    it("handles presets with params", async () => {
      const mockResponse = createMockResponse({
        presets: [
          createMockPreset({
            config_id: "fgi_exponential",
            strategy_id: "simple_regime",
            params: { k: 3.0, r_max: 1.2 },
          }),
        ],
      });
      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getStrategyConfigs();

      expect(result.presets[0].params).toEqual({ k: 3.0, r_max: 1.2 });
    });
  });
});
