import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigEditorView } from "@/components/wallet/portfolio/views/invest/configManager/ConfigEditorView";
import type { SavedStrategyConfig } from "@/types";

import { fireEvent, render, screen, waitFor } from "../../../test-utils";

const mockState = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  existingConfig: null as SavedStrategyConfig | null,
  isLoading: false,
  showToast: vi.fn(),
  updateMutateAsync: vi.fn(),
}));

const baseConfig: SavedStrategyConfig = {
  config_id: "momentum_bot",
  display_name: "Momentum Bot",
  description: "Trades with market momentum",
  strategy_id: "dma_gated_fgi",
  primary_asset: "BTC",
  supports_daily_suggestion: true,
  is_default: false,
  is_benchmark: false,
  params: { drift_threshold: 0.1 },
  composition: {
    kind: "bucket_strategy",
    bucket_mapper_id: "spot_stable",
    signal: { component_id: "signal_component", params: {} },
    decision_policy: { component_id: "decision_component", params: {} },
    pacing_policy: { component_id: "pacing_component", params: {} },
    execution_profile: { component_id: "execution_component", params: {} },
    plugins: [],
  },
};

vi.mock("@/hooks/queries/strategyAdmin", () => ({
  useStrategyAdminConfig: () => ({
    data: mockState.existingConfig,
    isLoading: mockState.isLoading,
  }),
}));

vi.mock("@/hooks/mutations/useStrategyAdminMutations", () => ({
  useCreateStrategyConfig: () => ({
    mutateAsync: mockState.createMutateAsync,
    isPending: false,
  }),
  useUpdateStrategyConfig: () => ({
    mutateAsync: mockState.updateMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/providers/ToastProvider", async importOriginal => {
  const actual =
    await importOriginal<typeof import("@/providers/ToastProvider")>();

  return {
    ...actual,
    useToast: () => ({
      showToast: mockState.showToast,
    }),
  };
});

function renderConfigEditorView(
  overrides: Partial<ComponentProps<typeof ConfigEditorView>> = {}
) {
  const onCancel = vi.fn();
  const onDuplicate = vi.fn();
  const onSaved = vi.fn();

  render(
    <ConfigEditorView
      configId={null}
      mode="create"
      duplicateFrom={null}
      onCancel={onCancel}
      onSaved={onSaved}
      onDuplicate={onDuplicate}
      {...overrides}
    />
  );

  return {
    onCancel,
    onDuplicate,
    onSaved,
  };
}

function fillRequiredCreateFields(): void {
  fireEvent.change(screen.getByPlaceholderText("my_strategy_config"), {
    target: { value: "my_strategy_config" },
  });
  fireEvent.change(screen.getByPlaceholderText("My Strategy Config"), {
    target: { value: "My Strategy Config" },
  });
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "simple_dca" },
  });
  fireEvent.change(screen.getByPlaceholderText("BTC"), {
    target: { value: "ETH" },
  });
}

describe("ConfigEditorView", () => {
  beforeEach(() => {
    mockState.existingConfig = null;
    mockState.isLoading = false;
    mockState.createMutateAsync.mockReset();
    mockState.createMutateAsync.mockResolvedValue(undefined);
    mockState.updateMutateAsync.mockReset();
    mockState.updateMutateAsync.mockResolvedValue(undefined);
    mockState.showToast.mockReset();
  });

  it("creates a config with trimmed shared fields", async () => {
    const { onSaved } = renderConfigEditorView();

    fillRequiredCreateFields();

    fireEvent.change(screen.getByPlaceholderText("My Strategy Config"), {
      target: { value: "  My Strategy Config  " },
    });
    fireEvent.change(screen.getByPlaceholderText("Optional description..."), {
      target: { value: "  Optional note  " },
    });
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockState.createMutateAsync).toHaveBeenCalledWith({
        config_id: "my_strategy_config",
        display_name: "My Strategy Config",
        description: "Optional note",
        strategy_id: "simple_dca",
        primary_asset: "ETH",
        supports_daily_suggestion: true,
        params: {},
        composition: {},
      });
    });

    expect(mockState.showToast).toHaveBeenCalledWith({
      type: "success",
      title: "Configuration created",
      message: '"My Strategy Config" has been created.',
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("prefills duplicate mode while keeping config id empty", () => {
    renderConfigEditorView({
      duplicateFrom: baseConfig,
    });

    expect(screen.getByPlaceholderText("my_strategy_config")).toHaveValue("");
    expect(screen.getByPlaceholderText("My Strategy Config")).toHaveValue(
      "Momentum Bot (copy)"
    );
    expect(screen.getByPlaceholderText("Optional description...")).toHaveValue(
      "Trades with market momentum"
    );
  });

  it("renders benchmark configs as read-only in edit mode", () => {
    mockState.existingConfig = {
      ...baseConfig,
      is_benchmark: true,
    };

    renderConfigEditorView({
      configId: baseConfig.config_id,
      mode: "edit",
    });

    expect(
      screen.getByText(
        /This is a benchmark configuration and cannot be modified/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Duplicate" })
    ).not.toBeInTheDocument();
  });

  it("duplicates from the loaded config in edit mode", () => {
    mockState.existingConfig = baseConfig;
    const { onDuplicate } = renderConfigEditorView({
      configId: baseConfig.config_id,
      mode: "edit",
    });

    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));

    expect(onDuplicate).toHaveBeenCalledWith(baseConfig);
  });

  it("blocks save when the active JSON editor is invalid", () => {
    renderConfigEditorView();
    fillRequiredCreateFields();

    fireEvent.change(screen.getByDisplayValue("{}"), {
      target: { value: "{invalid" },
    });

    expect(
      screen.getByText("Invalid JSON — fix syntax errors before saving")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
