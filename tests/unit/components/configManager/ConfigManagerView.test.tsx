import { describe, expect, it, vi } from "vitest";

import { ConfigManagerView } from "@/components/wallet/portfolio/views/invest/configManager/ConfigManagerView";

import { fireEvent, render, screen, waitFor } from "../../../test-utils";

const { mockConfigs } = vi.hoisted(() => ({
  mockConfigs: [
    {
      config_id: "dma_default",
      display_name: "DMA Default",
      description: "Default DMA strategy",
      strategy_id: "dma_gated_fgi",
      primary_asset: "BTC",
      supports_daily_suggestion: true,
      is_default: true,
      is_benchmark: false,
      params: {},
      composition: {
        kind: "bucket_strategy",
        bucket_mapper_id: "spot_stable",
        signal: { component_id: "dma_gated_fgi_signal", params: {} },
        decision_policy: { component_id: "fgi_tiered_decision", params: {} },
        pacing_policy: { component_id: "weekly_pacing", params: {} },
        execution_profile: {
          component_id: "single_asset_execution",
          params: {},
        },
        plugins: [],
      },
    },
    {
      config_id: "dca_classic_benchmark",
      display_name: "DCA Classic",
      description: "Benchmark config",
      strategy_id: "simple_dca",
      primary_asset: "BTC",
      supports_daily_suggestion: false,
      is_default: false,
      is_benchmark: true,
      params: {},
      composition: {
        kind: "bucket_strategy",
        bucket_mapper_id: "spot_stable",
        signal: { component_id: "always_buy_signal", params: {} },
        decision_policy: { component_id: "fixed_decision", params: {} },
        pacing_policy: { component_id: "weekly_pacing", params: {} },
        execution_profile: {
          component_id: "single_asset_execution",
          params: {},
        },
        plugins: [],
      },
    },
  ],
}));

vi.mock("@/hooks/queries/strategyAdmin", () => ({
  useStrategyAdminConfigs: () => ({
    data: mockConfigs,
    isLoading: false,
    error: null,
  }),
  useStrategyAdminConfig: () => ({
    data: null,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/mutations/useStrategyAdminMutations", () => ({
  useCreateStrategyConfig: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateStrategyConfig: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useSetDefaultStrategyConfig: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe("ConfigManagerView", () => {
  it("renders the config list with all configs", () => {
    render(<ConfigManagerView />);

    expect(screen.getByText("Strategy Configurations")).toBeDefined();
    // Both desktop table and mobile cards render, so use getAllByText
    expect(screen.getAllByText("DMA Default").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DCA Classic").length).toBeGreaterThan(0);
  });

  it("shows Default badge on the default config", () => {
    render(<ConfigManagerView />);

    expect(screen.getAllByText("Default").length).toBeGreaterThan(0);
  });

  it("shows Benchmark badge on benchmark configs", () => {
    render(<ConfigManagerView />);

    expect(screen.getAllByText("Benchmark").length).toBeGreaterThan(0);
  });

  it("shows Daily badge on configs supporting daily suggestion", () => {
    render(<ConfigManagerView />);

    expect(screen.getAllByText("Daily").length).toBeGreaterThan(0);
  });

  it("renders Create New button", () => {
    render(<ConfigManagerView />);

    expect(screen.getByText("Create New")).toBeDefined();
  });

  it("navigates to create editor when Create New is clicked", async () => {
    render(<ConfigManagerView />);

    fireEvent.click(screen.getByText("Create New"));

    await waitFor(() => {
      expect(screen.getByText("Create Configuration")).toBeDefined();
    });
  });
});
