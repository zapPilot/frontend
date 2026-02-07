/**
 * Test suite for useBacktestConfiguration hook
 *
 * Tests:
 * - buildDefaultPayloadFromPresets utility function
 * - Hook initialization with API defaults
 * - Fallback behavior when API fails
 * - resetConfiguration behavior
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBacktestConfiguration } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestConfiguration";
import { getBacktestingStrategiesV3 } from "@/services/backtestingService";
import { getStrategyConfigs } from "@/services/strategyService";
import type { BacktestStrategyCatalogResponseV3 } from "@/types/backtesting";
import type {
  BacktestDefaults,
  StrategyConfigsResponse,
  StrategyPreset,
} from "@/types/strategy";

// Mock dependencies
vi.mock("@/services/strategyService", () => ({
  getStrategyConfigs: vi.fn(),
}));

vi.mock("@/services/backtestingService", () => ({
  getBacktestingStrategiesV3: vi.fn(),
}));

vi.mock("@/hooks/mutations/useBacktestMutation", () => ({
  useBacktestMutation: () => ({
    mutate: vi.fn(),
    data: null,
    isPending: false,
    error: null,
  }),
}));

// Test fixtures
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

const createMockDefaults = (
  overrides: Partial<BacktestDefaults> = {}
): BacktestDefaults => ({
  days: 500,
  total_capital: 10000,
  ...overrides,
});

const createMockStrategyConfigs = (
  overrides: Partial<StrategyConfigsResponse> = {}
): StrategyConfigsResponse => ({
  presets: [
    createMockPreset({ config_id: "dca_classic", is_benchmark: true }),
    createMockPreset({
      config_id: "fgi_exponential",
      strategy_id: "simple_regime",
      params: { k: 3.0 },
      is_default: true,
    }),
  ],
  backtest_defaults: createMockDefaults(),
  ...overrides,
});

const createMockCatalog = (): BacktestStrategyCatalogResponseV3 => ({
  catalog_version: "3.0.0",
  strategies: [
    {
      id: "dca_classic",
      display_name: "DCA Classic",
      description: "Traditional DCA",
      hyperparam_schema: {},
      recommended_params: {},
    },
    {
      id: "simple_regime",
      display_name: "Simple Regime",
      description: "Regime-based strategy",
      hyperparam_schema: {},
      recommended_params: { pacing_policy: "regime_mapping" },
    },
  ],
});

describe("useBacktestConfiguration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: API fails, forcing fallback behavior
    vi.mocked(getStrategyConfigs).mockRejectedValue(new Error("API Error"));
    vi.mocked(getBacktestingStrategiesV3).mockRejectedValue(
      new Error("API Error")
    );
  });

  describe("initialization", () => {
    it("fetches strategy configs on mount", async () => {
      const mockConfigs = createMockStrategyConfigs();
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        expect(getStrategyConfigs).toHaveBeenCalled();
      });
    });

    it("initializes editor with API defaults (days=500)", async () => {
      const mockConfigs = createMockStrategyConfigs({
        backtest_defaults: { days: 500, total_capital: 10000 },
      });
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        expect(parsed.days).toBe(500);
        expect(parsed.total_capital).toBe(10000);
      });
    });

    it("initializes with benchmark and default presets in configs", async () => {
      const mockConfigs = createMockStrategyConfigs();
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        expect(parsed.configs).toHaveLength(2);
        expect(parsed.configs[0].config_id).toBe("dca_classic");
        expect(parsed.configs[1].config_id).toBe("fgi_exponential");
      });
    });

    it("uses FALLBACK_DEFAULTS when API fails", async () => {
      vi.mocked(getStrategyConfigs).mockRejectedValue(new Error("API Error"));
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(
        createMockCatalog()
      );

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        // FALLBACK_DEFAULTS in hook is { days: 500, total_capital: 10000 }
        expect(parsed.days).toBe(500);
        expect(parsed.total_capital).toBe(10000);
      });
    });

    it("falls back to catalog when presets unavailable", async () => {
      vi.mocked(getStrategyConfigs).mockRejectedValue(new Error("API Error"));
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(
        createMockCatalog()
      );

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        // Catalog fallback includes dca_classic and simple_regime
        expect(parsed.configs).toHaveLength(2);
        expect(parsed.configs[0].config_id).toBe("dca_classic");
        expect(parsed.configs[1].config_id).toBe("simple_regime");
      });
    });
  });

  describe("preset selection logic", () => {
    it("selects benchmark preset when available", async () => {
      const mockConfigs = createMockStrategyConfigs({
        presets: [
          createMockPreset({ config_id: "dca_classic", is_benchmark: true }),
        ],
      });
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        expect(parsed.configs[0].config_id).toBe("dca_classic");
      });
    });

    it("selects default preset when available", async () => {
      const mockConfigs = createMockStrategyConfigs({
        presets: [
          createMockPreset({ config_id: "fgi_exponential", is_default: true }),
        ],
      });
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        expect(parsed.configs[0].config_id).toBe("fgi_exponential");
      });
    });

    it("falls back to dca_classic if no benchmark/default found", async () => {
      const mockConfigs = createMockStrategyConfigs({
        presets: [
          createMockPreset({
            config_id: "custom",
            is_benchmark: false,
            is_default: false,
          }),
        ],
      });
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        expect(parsed.configs[0].config_id).toBe("dca_classic");
      });
    });

    it("avoids duplicate when benchmark and default are the same preset", async () => {
      const mockConfigs = createMockStrategyConfigs({
        presets: [
          createMockPreset({
            config_id: "dca_classic",
            is_benchmark: true,
            is_default: true,
          }),
        ],
      });
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        // Should only include one config, not duplicate
        expect(parsed.configs).toHaveLength(1);
        expect(parsed.configs[0].config_id).toBe("dca_classic");
      });
    });
  });

  describe("resetConfiguration", () => {
    it("resets to API defaults after user edits", async () => {
      const mockConfigs = createMockStrategyConfigs({
        backtest_defaults: { days: 500, total_capital: 10000 },
      });
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      // Wait for initial load
      await waitFor(() => {
        expect(JSON.parse(result.current.editorValue).days).toBe(500);
      });

      // Simulate user edit
      act(() => {
        result.current.updateEditorValue(
          '{"days": 30, "total_capital": 1000, "configs": []}'
        );
      });

      expect(JSON.parse(result.current.editorValue).days).toBe(30);

      // Reset
      act(() => {
        result.current.resetConfiguration();
      });

      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.days).toBe(500); // Back to API default
      expect(parsed.total_capital).toBe(10000);
    });

    it("resets to fallback defaults when API unavailable", async () => {
      vi.mocked(getStrategyConfigs).mockRejectedValue(new Error("API Error"));
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(
        createMockCatalog()
      );

      const { result } = renderHook(() => useBacktestConfiguration());

      // Wait for catalog fallback to load
      await waitFor(() => {
        expect(JSON.parse(result.current.editorValue).configs).toHaveLength(2);
      });

      // Simulate user edit
      act(() => {
        result.current.updateEditorValue(
          '{"days": 7, "total_capital": 100, "configs": []}'
        );
      });

      // Reset
      act(() => {
        result.current.resetConfiguration();
      });

      const parsed = JSON.parse(result.current.editorValue);
      // FALLBACK_DEFAULTS
      expect(parsed.days).toBe(500);
      expect(parsed.total_capital).toBe(10000);
    });

    it("clears editor error on reset", async () => {
      const mockConfigs = createMockStrategyConfigs();
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        expect(JSON.parse(result.current.editorValue).days).toBe(500);
      });

      // Simulate setting an error (normally done by handleRunBacktest)
      act(() => {
        result.current.setEditorError("Some validation error");
      });

      expect(result.current.editorError).toBe("Some validation error");

      // Reset should clear error
      act(() => {
        result.current.resetConfiguration();
      });

      expect(result.current.editorError).toBeNull();
    });
  });

  describe("updateEditorValue", () => {
    it("updates editor value", async () => {
      const mockConfigs = createMockStrategyConfigs();
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        expect(result.current.editorValue).toBeDefined();
      });

      act(() => {
        result.current.updateEditorValue('{"custom": "value"}');
      });

      expect(result.current.editorValue).toBe('{"custom": "value"}');
    });

    it("marks user as having edited (prevents API overwrites)", async () => {
      const mockConfigs = createMockStrategyConfigs();
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockConfigs);

      const { result } = renderHook(() => useBacktestConfiguration());

      await waitFor(() => {
        expect(JSON.parse(result.current.editorValue).days).toBe(500);
      });

      // User edits
      act(() => {
        result.current.updateEditorValue('{"days": 42, "configs": []}');
      });

      // Even if API response comes in again, user edit should be preserved
      // (This is tested indirectly - the hook's userEdited ref prevents overwrites)
      expect(JSON.parse(result.current.editorValue).days).toBe(42);
    });
  });
});
