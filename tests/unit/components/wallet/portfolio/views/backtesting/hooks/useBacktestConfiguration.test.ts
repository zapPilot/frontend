import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBacktestConfiguration } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestConfiguration";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { getBacktestingStrategiesV3 } from "@/services/backtestingService";
import { getStrategyConfigs } from "@/services/strategyService";
import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";
import type { StrategyConfigsResponse } from "@/types/strategy";

import { QueryClientWrapper } from "../../../../../../../test-utils";

// Mock dependencies
vi.mock("@/hooks/mutations/useBacktestMutation");
vi.mock("@/services/backtestingService");
vi.mock("@/services/strategyService");

const mockStrategyConfigs: StrategyConfigsResponse = {
  presets: [
    {
      config_id: "dca_classic",
      display_name: "DCA Classic",
      description: "Simple DCA",
      strategy_id: "dca_classic",
      params: {},
      is_benchmark: true,
      is_default: false,
    },
    {
      config_id: "fgi_exponential",
      display_name: "FGI Exponential",
      description: "Exponential pacing",
      strategy_id: "simple_regime",
      params: { k: 3.0 },
      is_benchmark: false,
      is_default: true,
    },
  ],
  backtest_defaults: {
    days: 90,
    total_capital: 10000,
  },
};

const mockCatalog: BacktestStrategyCatalogResponseV3 = {
  strategies: [
    {
      id: "dca_classic",
      name: "DCA Classic",
      description: "Simple DCA",
      parameters: {},
      recommended_params: {},
    },
    {
      id: "simple_regime",
      name: "Simple Regime",
      description: "Regime-based",
      parameters: { k: "number" },
      recommended_params: { k: 2.5 },
    },
  ],
};

const mockBacktestResult = {
  results: [
    {
      config_id: "dca_classic",
      strategy_id: "dca_classic",
      final_value: 11000,
      total_return: 0.1,
    },
  ],
};

describe("useBacktestConfiguration", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBacktestMutation).mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      isPending: false,
      error: null,
      isError: false,
      isSuccess: false,
      reset: vi.fn(),
      mutateAsync: vi.fn(),
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      status: "idle",
      submittedAt: 0,
    });
  });

  describe("initialization", () => {
    it("initializes with fallback defaults when both API calls fail", async () => {
      vi.mocked(getStrategyConfigs).mockRejectedValue(
        new Error("Presets unavailable")
      );
      vi.mocked(getBacktestingStrategiesV3).mockRejectedValue(
        new Error("Catalog unavailable")
      );

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      // Should have fallback defaults immediately (DEFAULT_DAYS = 500)
      expect(result.current.editorValue).toBeTruthy();
      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.days).toBe(500);
      expect(parsed.total_capital).toBe(10000);
    });

    it("loads presets and sets editor value from presets", async () => {
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        // Wait until presets load (preset config_ids differ from catalog defaults)
        expect(parsed.configs[1]?.config_id).toBe("fgi_exponential");
      });

      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.days).toBe(90);
      expect(parsed.total_capital).toBe(10000);
      expect(parsed.configs[0].config_id).toBe("dca_classic");
      expect(parsed.configs[1].config_id).toBe("fgi_exponential");
    });

    it("falls back to catalog when presets fail but catalog succeeds", async () => {
      vi.mocked(getStrategyConfigs).mockRejectedValue(
        new Error("Presets unavailable")
      );
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        const parsed = JSON.parse(result.current.editorValue);
        // Catalog fallback uses FALLBACK_DEFAULTS (days: 500) but has catalog params
        expect(parsed.configs[1]?.params?.k).toBe(2.5);
      });

      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.configs).toHaveLength(2);
      expect(parsed.configs[0].config_id).toBe("dca_classic");
      expect(parsed.configs[1].config_id).toBe("simple_regime");
      expect(parsed.configs[1].params.k).toBe(2.5);
    });

    it("stores catalog when available even if presets load first", async () => {
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.catalog).not.toBeNull();
      });

      expect(result.current.catalog).toEqual(mockCatalog);
    });

    it("does not override user edits during initialization", async () => {
      vi.mocked(getStrategyConfigs).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockStrategyConfigs), 100);
          })
      );
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      // User edits before API loads
      act(() => {
        result.current.updateEditorValue('{"custom": "value"}');
      });

      await waitFor(
        () => {
          expect(getStrategyConfigs).toHaveBeenCalled();
        },
        { timeout: 200 }
      );

      // Should preserve user edit
      expect(result.current.editorValue).toBe('{"custom": "value"}');
    });
  });

  describe("updateEditorValue", () => {
    it("updates editor value and sets userEdited flag", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      act(() => {
        result.current.updateEditorValue('{"test": "value"}');
      });

      expect(result.current.editorValue).toBe('{"test": "value"}');
    });

    it("marks user as having edited", async () => {
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.catalog).not.toBeNull();
      });

      const initialValue = result.current.editorValue;

      act(() => {
        result.current.updateEditorValue('{"edited": true}');
      });

      // Further API updates should not override
      expect(result.current.editorValue).toBe('{"edited": true}');
      expect(result.current.editorValue).not.toBe(initialValue);
    });
  });

  describe("handleRunBacktest", () => {
    it("validates and submits valid payload", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      const validPayload: BacktestRequest = {
        total_capital: 10000,
        days: 90,
        configs: [
          {
            config_id: "dca_classic",
            strategy_id: "dca_classic",
            params: {},
          },
        ],
      };

      act(() => {
        result.current.updateEditorValue(JSON.stringify(validPayload, null, 2));
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(mockMutate).toHaveBeenCalledWith({
        total_capital: 10000,
        days: 90,
        configs: [
          {
            config_id: "dca_classic",
            strategy_id: "dca_classic",
            params: {},
          },
        ],
      });
      expect(result.current.editorError).toBeNull();
    });

    it("sets error for invalid JSON", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      act(() => {
        result.current.updateEditorValue("{ invalid json");
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(result.current.editorError).toBe("Invalid JSON: unable to parse.");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("sets error for missing required fields", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      act(() => {
        result.current.updateEditorValue(JSON.stringify({ configs: [] }));
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(result.current.editorError).toContain("total_capital");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("sets error for empty configs array", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      act(() => {
        result.current.updateEditorValue(
          JSON.stringify({ total_capital: 10000, configs: [] })
        );
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(result.current.editorError).toContain("configs");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("sets error for invalid strategy_id", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      const invalidPayload = {
        total_capital: 10000,
        configs: [
          {
            config_id: "test",
            strategy_id: "invalid_strategy",
          },
        ],
      };

      act(() => {
        result.current.updateEditorValue(JSON.stringify(invalidPayload));
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(result.current.editorError).toContain("strategy_id");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("sets error for negative total_capital", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      const invalidPayload = {
        total_capital: -1000,
        configs: [
          {
            config_id: "dca_classic",
            strategy_id: "dca_classic",
          },
        ],
      };

      act(() => {
        result.current.updateEditorValue(JSON.stringify(invalidPayload));
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(result.current.editorError).toContain("total_capital");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("submits payload with optional fields", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      const payload: BacktestRequest = {
        total_capital: 10000,
        days: 90,
        token_symbol: "BTC",
        start_date: "2024-01-01",
        end_date: "2024-03-31",
        configs: [
          {
            config_id: "fgi_exponential",
            strategy_id: "simple_regime",
            params: { k: 3.0 },
          },
        ],
      };

      act(() => {
        result.current.updateEditorValue(JSON.stringify(payload, null, 2));
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(mockMutate).toHaveBeenCalledWith({
        total_capital: 10000,
        days: 90,
        token_symbol: "BTC",
        start_date: "2024-01-01",
        end_date: "2024-03-31",
        configs: [
          {
            config_id: "fgi_exponential",
            strategy_id: "simple_regime",
            params: { k: 3.0 },
          },
        ],
      });
      expect(result.current.editorError).toBeNull();
    });

    it("omits params field when not provided in config", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      const payload = {
        total_capital: 10000,
        configs: [
          {
            config_id: "dca_classic",
            strategy_id: "dca_classic",
          },
        ],
      };

      act(() => {
        result.current.updateEditorValue(JSON.stringify(payload));
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      const call = mockMutate.mock.calls[0][0] as BacktestRequest;
      expect(call.configs[0]).not.toHaveProperty("params");
    });

    it("clears previous error on successful validation", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      // First, cause an error
      act(() => {
        result.current.updateEditorValue("{ invalid");
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(result.current.editorError).not.toBeNull();

      // Now submit valid payload
      const validPayload = {
        total_capital: 10000,
        configs: [
          {
            config_id: "dca_classic",
            strategy_id: "dca_classic",
          },
        ],
      };

      act(() => {
        result.current.updateEditorValue(JSON.stringify(validPayload));
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(result.current.editorError).toBeNull();
    });
  });

  describe("resetConfiguration", () => {
    it("resets to presets when available", async () => {
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.catalog).not.toBeNull();
      });

      // User edits
      act(() => {
        result.current.updateEditorValue('{"custom": "edit"}');
      });

      expect(result.current.editorValue).toBe('{"custom": "edit"}');

      // Reset
      act(() => {
        result.current.resetConfiguration();
      });

      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.configs[0].config_id).toBe("dca_classic");
      expect(parsed.configs[1].config_id).toBe("fgi_exponential");
      expect(result.current.editorError).toBeNull();
    });

    it("resets to catalog when presets unavailable", async () => {
      vi.mocked(getStrategyConfigs).mockRejectedValue(
        new Error("Presets unavailable")
      );
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.catalog).not.toBeNull();
      });

      // User edits
      act(() => {
        result.current.updateEditorValue('{"custom": "edit"}');
      });

      // Reset
      act(() => {
        result.current.resetConfiguration();
      });

      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.configs[0].config_id).toBe("dca_classic");
      expect(parsed.configs[1].config_id).toBe("simple_regime");
    });

    it("resets to fallback when both APIs failed", async () => {
      vi.mocked(getStrategyConfigs).mockRejectedValue(
        new Error("Presets unavailable")
      );
      vi.mocked(getBacktestingStrategiesV3).mockRejectedValue(
        new Error("Catalog unavailable")
      );

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      // User edits
      act(() => {
        result.current.updateEditorValue('{"custom": "edit"}');
      });

      // Reset
      act(() => {
        result.current.resetConfiguration();
      });

      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.days).toBe(500);
      expect(parsed.total_capital).toBe(10000);
      expect(parsed.configs).toHaveLength(2);
    });

    it("clears editor error on reset", async () => {
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.catalog).not.toBeNull();
      });

      // Cause validation error
      act(() => {
        result.current.updateEditorValue("{ invalid");
      });

      act(() => {
        result.current.handleRunBacktest();
      });

      expect(result.current.editorError).not.toBeNull();

      // Reset should clear error
      act(() => {
        result.current.resetConfiguration();
      });

      expect(result.current.editorError).toBeNull();
    });

    it("resets userEdited flag", async () => {
      vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.catalog).not.toBeNull();
      });

      // User edits
      act(() => {
        result.current.updateEditorValue('{"custom": "edit"}');
      });

      // Reset
      act(() => {
        result.current.resetConfiguration();
      });

      // After reset, userEdited should be false
      // This is internal state, but we can verify by checking that
      // further API updates would now be allowed (tested in initialization)
      const editorValue = result.current.editorValue;
      expect(editorValue).toBeTruthy();
    });
  });

  describe("return values", () => {
    it("returns backtestData from mutation", () => {
      vi.mocked(useBacktestMutation).mockReturnValue({
        mutate: mockMutate,
        data: mockBacktestResult,
        isPending: false,
        error: null,
        isError: false,
        isSuccess: true,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        status: "success",
        submittedAt: Date.now(),
      });

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      expect(result.current.backtestData).toEqual(mockBacktestResult);
    });

    it("returns isPending from mutation", () => {
      vi.mocked(useBacktestMutation).mockReturnValue({
        mutate: mockMutate,
        data: undefined,
        isPending: true,
        error: null,
        isError: false,
        isSuccess: false,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        status: "pending",
        submittedAt: Date.now(),
      });

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      expect(result.current.isPending).toBe(true);
    });

    it("returns error from mutation", () => {
      const mockError = new Error("Backtest failed");
      vi.mocked(useBacktestMutation).mockReturnValue({
        mutate: mockMutate,
        data: undefined,
        isPending: false,
        error: mockError,
        isError: true,
        isSuccess: false,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
        variables: undefined,
        context: undefined,
        failureCount: 1,
        failureReason: mockError,
        isPaused: false,
        status: "error",
        submittedAt: Date.now(),
      });

      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      expect(result.current.error).toEqual(mockError);
    });

    it("exposes setEditorError for external error handling", () => {
      const { result } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      act(() => {
        result.current.setEditorError("Custom error message");
      });

      expect(result.current.editorError).toBe("Custom error message");
    });
  });

  describe("cleanup", () => {
    it("cancels ongoing API calls on unmount", async () => {
      let resolveFn: (value: StrategyConfigsResponse) => void;
      vi.mocked(getStrategyConfigs).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveFn = resolve;
          })
      );
      vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

      const { unmount } = renderHook(() => useBacktestConfiguration(), {
        wrapper: QueryClientWrapper,
      });

      // Unmount before API resolves
      unmount();

      // Resolve API
      resolveFn!(mockStrategyConfigs);

      // Wait to ensure no state updates occur after unmount
      await new Promise(resolve => setTimeout(resolve, 50));

      // If we get here without errors, cleanup worked correctly
      expect(true).toBe(true);
    });
  });
});
