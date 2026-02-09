/**
 * Unit tests for useDefaultPresetId hook.
 *
 * Tests:
 * - Returns undefined when configs not yet loaded
 * - Returns simple_regime config_id when available
 * - Falls back to first preset when simple_regime not found
 * - Returns undefined when presets array is empty
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDefaultPresetId } from "@/components/wallet/portfolio/views/experiment/trading/hooks/useDefaultPresetId";
import { useStrategyConfigs } from "@/components/wallet/portfolio/views/experiment/trading/hooks/useStrategyConfigs";
import type { StrategyConfigsResponse, StrategyPreset } from "@/types/strategy";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock(
  "@/components/wallet/portfolio/views/experiment/trading/hooks/useStrategyConfigs",
  () => ({
    useStrategyConfigs: vi.fn(),
  })
);

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockPreset = (
  config_id: string,
  strategy_id: "dca_classic" | "simple_regime",
  display_name: string
): StrategyPreset => ({
  config_id,
  strategy_id,
  display_name,
  description: `${display_name} description`,
  params: {},
  is_default: false,
  is_benchmark: strategy_id === "dca_classic",
});

const mockSimpleRegimePreset = createMockPreset(
  "preset-simple-regime-1",
  "simple_regime",
  "Simple Regime Strategy"
);

const mockDcaClassicPreset = createMockPreset(
  "preset-dca-classic-1",
  "dca_classic",
  "DCA Classic Strategy"
);

const mockConfigsResponse: StrategyConfigsResponse = {
  presets: [mockDcaClassicPreset, mockSimpleRegimePreset],
  backtest_defaults: {
    deposit_amount_usd: 100,
    deposit_frequency_days: 7,
    backtest_window_start: "2023-01-01",
    backtest_window_end: "2024-01-01",
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe("useDefaultPresetId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return undefined when configs not yet loaded", () => {
    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBeUndefined();
  });

  it("should return simple_regime config_id when available", () => {
    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: mockConfigsResponse,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBe(mockSimpleRegimePreset.config_id);
  });

  it("should return simple_regime even when it is not the first preset", () => {
    const configsWithRegimeSecond: StrategyConfigsResponse = {
      ...mockConfigsResponse,
      presets: [mockDcaClassicPreset, mockSimpleRegimePreset],
    };

    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: configsWithRegimeSecond,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBe(mockSimpleRegimePreset.config_id);
  });

  it("should fall back to first preset when simple_regime not found", () => {
    const configsWithoutRegime: StrategyConfigsResponse = {
      ...mockConfigsResponse,
      presets: [mockDcaClassicPreset],
    };

    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: configsWithoutRegime,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBe(mockDcaClassicPreset.config_id);
  });

  it("should return undefined when presets array is empty", () => {
    const configsWithEmptyPresets: StrategyConfigsResponse = {
      ...mockConfigsResponse,
      presets: [],
    };

    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: configsWithEmptyPresets,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBeUndefined();
  });

  it("should return undefined when configs response is null", () => {
    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: null,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBeUndefined();
  });

  it("should pass enabled parameter to useStrategyConfigs", () => {
    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: mockConfigsResponse,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    renderHook(() => useDefaultPresetId(false));

    expect(useStrategyConfigs).toHaveBeenCalledWith(false);
  });

  it("should recompute when configs response changes", () => {
    const configsWithoutRegime: StrategyConfigsResponse = {
      ...mockConfigsResponse,
      presets: [mockDcaClassicPreset],
    };

    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: configsWithoutRegime,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    const { result, rerender } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBe(mockDcaClassicPreset.config_id);

    // Update to include simple_regime
    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: mockConfigsResponse,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    rerender();

    expect(result.current).toBe(mockSimpleRegimePreset.config_id);
  });

  it("should handle multiple presets of different types correctly", () => {
    const anotherRegimePreset = createMockPreset(
      "preset-simple-regime-2",
      "simple_regime",
      "Another Regime Strategy"
    );

    const configsWithMultipleRegimes: StrategyConfigsResponse = {
      ...mockConfigsResponse,
      presets: [
        mockDcaClassicPreset,
        mockSimpleRegimePreset,
        anotherRegimePreset,
      ],
    };

    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: configsWithMultipleRegimes,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDefaultPresetId(true));

    // Should return the first simple_regime preset found
    expect(result.current).toBe(mockSimpleRegimePreset.config_id);
  });

  it("should handle configs error state gracefully", () => {
    vi.mocked(useStrategyConfigs).mockReturnValue({
      data: undefined,
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: new Error("Failed to fetch configs"),
    } as any);

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBeUndefined();
  });
});
