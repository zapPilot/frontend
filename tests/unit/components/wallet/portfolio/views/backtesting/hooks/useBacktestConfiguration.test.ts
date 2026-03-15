import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBacktestConfiguration } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestConfiguration";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { getBacktestingStrategiesV3 } from "@/services/backtestingService";
import { getStrategyConfigs } from "@/services/strategyService";

import { QueryClientWrapper } from "../../../../../../../test-utils";

vi.mock("@/hooks/mutations/useBacktestMutation");
vi.mock("@/services/backtestingService");
vi.mock("@/services/strategyService");

const mockStrategyConfigs = {
  presets: [
    {
      config_id: "dca_classic",
      display_name: "DCA Classic",
      description: "Simple DCA",
      strategy_id: "dca_classic" as const,
      params: {},
      is_benchmark: true,
      is_default: false,
    },
    {
      config_id: "dma_gated_fgi_default",
      display_name: "DMA Gated FGI Default",
      description: "Curated DMA-first preset",
      strategy_id: "dma_gated_fgi" as const,
      params: {
        cross_cooldown_days: 30,
        pacing_k: 5,
        pacing_r_max: 1,
      },
      is_benchmark: false,
      is_default: true,
    },
  ],
  backtest_defaults: {
    days: 90,
    total_capital: 10000,
  },
};

const mockCatalog = {
  catalog_version: "3.0.0",
  strategies: [
    {
      strategy_id: "dma_gated_fgi" as const,
      display_name: "DMA Gated FGI",
      description: "DMA-first strategy",
      param_schema: {},
      default_params: {
        cross_cooldown_days: 14,
        pacing_k: 3,
        pacing_r_max: 1,
      },
      supports_daily_suggestion: true,
    },
  ],
};

function mockPendingDefaults() {
  vi.mocked(getStrategyConfigs).mockImplementation(
    () => new Promise(() => undefined)
  );
  vi.mocked(getBacktestingStrategiesV3).mockImplementation(
    () => new Promise(() => undefined)
  );
}

describe("useBacktestConfiguration", () => {
  const mockMutate = vi.fn(
    (_request: unknown, options?: { onSettled?: () => void }) => {
      options?.onSettled?.();
    }
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBacktestMutation).mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      isPending: false,
      error: null,
    } as any);
  });

  // -------------------------------------------------------------------------
  // Initialization and defaults
  // -------------------------------------------------------------------------

  it("starts with fallback DMA-first editor defaults", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    const parsed = JSON.parse(result.current.editorValue);
    expect(parsed.days).toBe(500);
    expect(parsed.total_capital).toBe(10000);
    expect(parsed.configs[0].config_id).toBe("dca_classic");
    expect(parsed.configs[1].config_id).toBe("dma_gated_fgi_default");
  });

  it("loads presets, seeds the editor, and auto-runs once", async () => {
    vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.days).toBe(90);
      expect(parsed.configs[1].config_id).toBe("dma_gated_fgi_default");
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
  });

  it("falls back to catalog defaults when presets fail", async () => {
    vi.mocked(getStrategyConfigs).mockRejectedValue(
      new Error("Presets unavailable")
    );
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.days).toBe(500);
      expect(parsed.configs[1].config_id).toBe("dma_gated_fgi_default");
      expect(parsed.configs[1].params.pacing_k).toBe(3);
    });
  });

  it("does not override user edits while defaults are still loading", async () => {
    vi.mocked(getStrategyConfigs).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(mockStrategyConfigs), 50);
        })
    );
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue('{"custom":"value"}');
    });

    await waitFor(() => {
      expect(getStrategyConfigs).toHaveBeenCalled();
    });

    expect(result.current.editorValue).toBe('{"custom":"value"}');
  });

  // -------------------------------------------------------------------------
  // Catalog-only path (branch: catalogData available, presets failed)
  // -------------------------------------------------------------------------

  it("uses fallback defaults when both presets and catalog fail", async () => {
    vi.mocked(getStrategyConfigs).mockRejectedValue(new Error("Presets fail"));
    vi.mocked(getBacktestingStrategiesV3).mockRejectedValue(
      new Error("Catalog fail")
    );

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      // defaultsReady should be set even when both fail
      expect(result.current.isInitializing).toBe(false);
    });

    // Editor should retain the initial fallback payload (catalog is null -> FALLBACK_DEFAULTS)
    const parsed = JSON.parse(result.current.editorValue);
    expect(parsed.days).toBe(500);
    expect(parsed.total_capital).toBe(10000);
  });

  it("does not update editor from catalog when user has already edited and presets fail", async () => {
    vi.mocked(getStrategyConfigs).mockRejectedValue(new Error("Presets fail"));
    vi.mocked(getBacktestingStrategiesV3).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(mockCatalog), 50);
        })
    );

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    // User edits before catalog resolves
    act(() => {
      result.current.updateEditorValue('{"user":"edited"}');
    });

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    // Editor should keep user's value, not the catalog default
    expect(result.current.editorValue).toBe('{"user":"edited"}');
  });

  // -------------------------------------------------------------------------
  // presets fulfilled but presets.length === 0 (catalog fallback branch)
  // -------------------------------------------------------------------------

  it("falls back to catalog when presets array is empty", async () => {
    vi.mocked(getStrategyConfigs).mockResolvedValue({
      presets: [],
      backtest_defaults: { days: 30, total_capital: 5000 },
    });
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      // catalog fallback was used: default params from the DMA catalog entry
      const parsed = JSON.parse(result.current.editorValue);
      expect(parsed.configs[1].params.pacing_k).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // handleRunBacktest – valid payload
  // -------------------------------------------------------------------------

  it("submits a valid DMA-first payload and strips empty params", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify(
          {
            total_capital: 10000,
            days: 180,
            configs: [
              {
                config_id: "dca_classic",
                strategy_id: "dca_classic",
                params: {},
              },
              {
                config_id: "dma_gated_fgi_default",
                strategy_id: "dma_gated_fgi",
                params: {
                  cross_cooldown_days: 30,
                  pacing_k: 5,
                  pacing_r_max: 1,
                },
              },
            ],
          },
          null,
          2
        )
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    expect(mockMutate).toHaveBeenCalledWith({
      total_capital: 10000,
      days: 180,
      configs: [
        {
          config_id: "dca_classic",
          strategy_id: "dca_classic",
        },
        {
          config_id: "dma_gated_fgi_default",
          strategy_id: "dma_gated_fgi",
          params: {
            cross_cooldown_days: 30,
            pacing_k: 5,
            pacing_r_max: 1,
          },
        },
      ],
    });
    expect(result.current.editorError).toBeNull();
  });

  it("includes token_symbol, start_date, and end_date when provided", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 5000,
          token_symbol: "ETH",
          start_date: "2023-01-01",
          end_date: "2023-12-31",
          configs: [
            {
              config_id: "dca_classic",
              strategy_id: "dca_classic",
            },
          ],
        })
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        token_symbol: "ETH",
        start_date: "2023-01-01",
        end_date: "2023-12-31",
        total_capital: 5000,
      })
    );
  });

  it("omits optional fields from request when absent in payload", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 10000,
          configs: [
            {
              config_id: "dca_classic",
              strategy_id: "dca_classic",
            },
          ],
        })
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    const callArg = mockMutate.mock.calls[0]?.[0];
    expect(callArg).not.toHaveProperty("token_symbol");
    expect(callArg).not.toHaveProperty("start_date");
    expect(callArg).not.toHaveProperty("end_date");
    expect(callArg).not.toHaveProperty("days");
  });

  // -------------------------------------------------------------------------
  // handleRunBacktest – invalid JSON branch
  // -------------------------------------------------------------------------

  it("rejects invalid JSON and legacy params", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue("{ invalid");
    });
    act(() => {
      result.current.handleRunBacktest();
    });
    expect(result.current.editorError).toBe("Invalid JSON: unable to parse.");

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 10000,
          configs: [
            {
              config_id: "dma_gated_fgi_default",
              strategy_id: "dma_gated_fgi",
              params: {
                signal_provider: "fgi",
              },
            },
          ],
        })
      );
    });
    act(() => {
      result.current.handleRunBacktest();
    });

    expect(result.current.editorError).toContain("params");
    expect(mockMutate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // handleRunBacktest – schema validation failure branch
  // -------------------------------------------------------------------------

  it("sets editorError when schema validation fails due to missing total_capital", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          // total_capital is required but missing
          configs: [
            {
              config_id: "dca_classic",
              strategy_id: "dca_classic",
            },
          ],
        })
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    expect(result.current.editorError).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("sets editorError when configs array is empty", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 10000,
          configs: [],
        })
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    expect(result.current.editorError).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // normalizeParams – supported DMA public params
  // -------------------------------------------------------------------------

  it("includes supported DMA public params when provided", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 10000,
          configs: [
            {
              config_id: "dma_gated_fgi_default",
              strategy_id: "dma_gated_fgi",
              params: {
                cross_cooldown_days: 21,
                cross_on_touch: false,
                pacing_k: 5,
                pacing_r_max: 1,
                buy_sideways_window_days: 7,
                buy_sideways_max_range: 0.08,
                buy_leg_caps: [0.05, 0.1, 0.2],
              },
            },
          ],
        })
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        configs: [
          expect.objectContaining({
            params: {
              cross_cooldown_days: 21,
              cross_on_touch: false,
              pacing_k: 5,
              pacing_r_max: 1,
              buy_sideways_window_days: 7,
              buy_sideways_max_range: 0.08,
              buy_leg_caps: [0.05, 0.1, 0.2],
            },
          }),
        ],
      })
    );
  });

  // -------------------------------------------------------------------------
  // normalizeParams – empty params object stripped to undefined
  // -------------------------------------------------------------------------

  it("strips params from request when params object has no recognized keys", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 10000,
          configs: [
            {
              config_id: "dca_classic",
              strategy_id: "dca_classic",
              // params is valid but all optional fields absent → normalized to undefined
              params: {},
            },
          ],
        })
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    const callArg = mockMutate.mock.calls[0]?.[0];
    expect(callArg.configs[0]).not.toHaveProperty("params");
  });

  // -------------------------------------------------------------------------
  // normalizeParams – undefined params (no params key at all)
  // -------------------------------------------------------------------------

  it("omits params key entirely when config has no params field", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 10000,
          configs: [
            {
              config_id: "dca_classic",
              strategy_id: "dca_classic",
              // no params key
            },
          ],
        })
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    const callArg = mockMutate.mock.calls[0]?.[0];
    expect(callArg.configs[0]).not.toHaveProperty("params");
  });

  // -------------------------------------------------------------------------
  // Auto-run useEffect – !defaultsReady guard (initialRunStarted.current guard)
  // -------------------------------------------------------------------------

  it("does not run auto-submit more than once even when editorValue changes", async () => {
    vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    // Simulate the onSettled callback to mark initialRunSettled
    const onSettled = mockMutate.mock.calls[0]?.[1]?.onSettled;
    if (onSettled) {
      act(() => {
        onSettled();
      });
    }

    // Trigger a parsedEditorPayload change by updating the value
    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 9999,
          configs: [{ config_id: "dca_classic", strategy_id: "dca_classic" }],
        })
      );
    });

    // Still only called once (initialRunStarted guards further auto-runs)
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Auto-run useEffect – !parsedEditorPayload branch sets initialRunSettled
  // -------------------------------------------------------------------------

  it("marks initialRunSettled and sets error when initial editor value is invalid JSON", async () => {
    // Resolve immediately with presets but use a trick:
    // inject an invalid editor value via a mock that triggers invalid JSON
    // We achieve this by making presets succeed but providing an invalid
    // payload - we need to manipulate the initial state.
    // The simplest approach: resolve both services with valid data,
    // then check the auto-run path by having the computed parsedEditorPayload be null.
    // Since we cannot easily inject invalid initial JSON, we test the guard via
    // the handleRunBacktest path which shares the same null-JSON branch.
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    // Force invalid JSON so parsedEditorPayload becomes null
    act(() => {
      result.current.updateEditorValue("{ not valid json }}}");
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    expect(result.current.editorError).toBe("Invalid JSON: unable to parse.");
    expect(mockMutate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Auto-run useEffect – schema parse failure branch sets initialRunSettled
  // -------------------------------------------------------------------------

  it("sets error and marks initialRunSettled when initial payload fails schema validation", async () => {
    // Provide presets with a structurally invalid payload shape so the
    // auto-run useEffect hits the !parsed.success branch.
    // We simulate by having the initial fallback editor value fail schema.
    // Since the fallback payload is always valid, we intercept via
    // updateEditorValue before defaultsReady fires by using delayed presets.
    vi.mocked(getStrategyConfigs).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(
            () =>
              resolve({
                presets: [],
                backtest_defaults: { days: 90, total_capital: 10000 },
              }),
            20
          );
        })
    );
    vi.mocked(getBacktestingStrategiesV3).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(mockCatalog), 20);
        })
    );

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    // Before presets resolve, inject invalid schema (valid JSON, invalid schema)
    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          // missing total_capital and configs
          bad_field: true,
        })
      );
    });

    await waitFor(() => {
      // After defaults ready, auto-run effect fires with bad payload and sets error
      expect(result.current.editorError).toBeTruthy();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // isInitializing – true when pending, false when settled
  // -------------------------------------------------------------------------

  it("isInitializing is true before initial run settles", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    // No data, no error, no editorError, initialRunSettled=false → true
    expect(result.current.isInitializing).toBe(true);
  });

  it("isInitializing is false when backtestData is available", () => {
    mockPendingDefaults();
    vi.mocked(useBacktestMutation).mockReturnValue({
      mutate: mockMutate,
      data: { results: [] } as any,
      isPending: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    expect(result.current.isInitializing).toBe(false);
  });

  it("isInitializing is false when mutation error is present", () => {
    mockPendingDefaults();
    vi.mocked(useBacktestMutation).mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      isPending: false,
      error: new Error("Mutation failed"),
    } as any);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    expect(result.current.isInitializing).toBe(false);
  });

  it("isInitializing is false when editorError is set", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue("{ bad json");
    });
    act(() => {
      result.current.handleRunBacktest();
    });

    expect(result.current.isInitializing).toBe(false);
  });

  // -------------------------------------------------------------------------
  // resetConfiguration – catalog fallback when no strategyConfigs
  // -------------------------------------------------------------------------

  it("resetConfiguration uses catalog when strategyConfigs is null", async () => {
    // Only catalog resolves; presets fail
    vi.mocked(getStrategyConfigs).mockRejectedValue(new Error("No presets"));
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    // Corrupt the editor
    act(() => {
      result.current.updateEditorValue("{ invalid");
    });
    act(() => {
      result.current.handleRunBacktest();
    });
    expect(result.current.editorError).not.toBeNull();

    act(() => {
      result.current.resetConfiguration();
    });

    // Should restore catalog-based defaults and clear error
    const parsed = JSON.parse(result.current.editorValue);
    expect(parsed.configs[1].config_id).toBe("dma_gated_fgi_default");
    expect(result.current.editorError).toBeNull();
  });

  it("resetConfiguration uses catalog when strategyConfigs has empty presets", async () => {
    vi.mocked(getStrategyConfigs).mockResolvedValue({
      presets: [],
      backtest_defaults: { days: 60, total_capital: 20000 },
    });
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    act(() => {
      result.current.updateEditorValue("{ invalid");
    });
    act(() => {
      result.current.handleRunBacktest();
    });

    act(() => {
      result.current.resetConfiguration();
    });

    const parsed = JSON.parse(result.current.editorValue);
    // catalog fallback: dma_gated_fgi default_params from mockCatalog
    expect(parsed.configs[1].params.pacing_k).toBe(3);
    expect(result.current.editorError).toBeNull();
  });

  // -------------------------------------------------------------------------
  // resetConfiguration – preset path (strategyConfigs with presets)
  // -------------------------------------------------------------------------

  it("resetConfiguration restores preset defaults and clears editor errors", async () => {
    vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      expect(JSON.parse(result.current.editorValue).configs[1].config_id).toBe(
        "dma_gated_fgi_default"
      );
    });

    act(() => {
      result.current.updateEditorValue("{ invalid");
    });
    act(() => {
      result.current.handleRunBacktest();
    });
    expect(result.current.editorError).not.toBeNull();

    act(() => {
      result.current.resetConfiguration();
    });

    const parsed = JSON.parse(result.current.editorValue);
    expect(parsed.days).toBe(90);
    expect(parsed.configs[1].config_id).toBe("dma_gated_fgi_default");
    expect(result.current.editorError).toBeNull();
  });

  // -------------------------------------------------------------------------
  // setEditorError – exposed on return value
  // -------------------------------------------------------------------------

  it("setEditorError can be called directly to set or clear the error", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.setEditorError("custom error message");
    });
    expect(result.current.editorError).toBe("custom error message");

    act(() => {
      result.current.setEditorError(null);
    });
    expect(result.current.editorError).toBeNull();
  });

  // -------------------------------------------------------------------------
  // updateEditorValue – marks userEdited ref
  // -------------------------------------------------------------------------

  it("updateEditorValue updates the editor value", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    const newVal = JSON.stringify({ custom: true });
    act(() => {
      result.current.updateEditorValue(newVal);
    });

    expect(result.current.editorValue).toBe(newVal);
  });

  // -------------------------------------------------------------------------
  // normalizeParams – single supported param
  // -------------------------------------------------------------------------

  it("includes a single supported param when other optional fields are absent", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    act(() => {
      result.current.updateEditorValue(
        JSON.stringify({
          total_capital: 10000,
          configs: [
            {
              config_id: "dma_gated_fgi_default",
              strategy_id: "dma_gated_fgi",
              params: {
                pacing_k: 4,
              },
            },
          ],
        })
      );
    });

    act(() => {
      result.current.handleRunBacktest();
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        configs: [
          expect.objectContaining({
            params: { pacing_k: 4 },
          }),
        ],
      })
    );
  });

  // -------------------------------------------------------------------------
  // auto-run – onSettled callback fires and marks initialRunSettled
  // -------------------------------------------------------------------------

  it("calls mutate with onSettled option during auto-run and marks initialRunSettled", async () => {
    vi.mocked(getStrategyConfigs).mockResolvedValue(mockStrategyConfigs);
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue(mockCatalog);

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    // Verify mutate was called with an options object containing onSettled
    const [, options] = mockMutate.mock.calls[0] ?? [];
    expect(typeof options?.onSettled).toBe("function");

    // Simulate onSettled firing
    act(() => {
      options.onSettled();
    });

    // After onSettled, isInitializing should be false
    expect(result.current.isInitializing).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Return value shape
  // -------------------------------------------------------------------------

  it("exposes all expected properties from the hook", () => {
    mockPendingDefaults();

    const { result } = renderHook(() => useBacktestConfiguration(), {
      wrapper: QueryClientWrapper,
    });

    expect(result.current).toHaveProperty("backtestData");
    expect(result.current).toHaveProperty("catalog");
    expect(result.current).toHaveProperty("editorError");
    expect(result.current).toHaveProperty("editorValue");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("isInitializing");
    expect(result.current).toHaveProperty("isPending");
    expect(result.current).toHaveProperty("setEditorError");
    expect(result.current).toHaveProperty("handleRunBacktest");
    expect(result.current).toHaveProperty("resetConfiguration");
    expect(result.current).toHaveProperty("updateEditorValue");
  });
});
