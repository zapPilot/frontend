import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StrategyPresetSelector } from "@/components/wallet/portfolio/views/strategy/components/suggestion/StrategyPresetSelector";
import type { StrategyPreset } from "@/types/strategy";

const mockPresets: StrategyPreset[] = [
  {
    config_id: "fgi_exponential",
    display_name: "FGI Exponential",
    description: "Front-loaded rebalancing using FGI exponential pacing",
    strategy_id: "simple_regime",
    params: { k: 3.0 },
    is_default: true,
  },
  {
    config_id: "regime_mapping",
    display_name: "Regime-Based",
    description: null,
    strategy_id: "simple_regime",
    params: {},
    is_default: false,
  },
  {
    config_id: "dca_basic",
    display_name: "DCA Basic",
    description: "Simple dollar-cost averaging strategy",
    strategy_id: "dca_classic",
    params: { interval: "weekly" },
    is_default: false,
  },
];

describe("StrategyPresetSelector", () => {
  const mockOnSelect = vi.fn();

  const defaultProps = {
    presets: mockPresets,
    selectedConfigId: "fgi_exponential",
    onSelect: mockOnSelect,
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe("rendering", () => {
    it('renders label "Strategy preset"', () => {
      render(<StrategyPresetSelector {...defaultProps} />);

      expect(screen.getByText("Strategy preset")).toBeInTheDocument();
    });

    it("renders dropdown with all preset options", () => {
      render(<StrategyPresetSelector {...defaultProps} />);

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();

      // Check all options are present
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
    });

    it('appends "(Recommended)" to default preset display name', () => {
      render(<StrategyPresetSelector {...defaultProps} />);

      const defaultOption = screen.getByRole("option", {
        name: "FGI Exponential (Recommended)",
      });
      expect(defaultOption).toBeInTheDocument();
    });

    it("shows selected preset value in dropdown", () => {
      render(<StrategyPresetSelector {...defaultProps} />);

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("fgi_exponential");
    });

    it("displays description for selected preset", () => {
      render(<StrategyPresetSelector {...defaultProps} />);

      expect(
        screen.getByText(
          "Front-loaded rebalancing using FGI exponential pacing"
        )
      ).toBeInTheDocument();
    });

    it("hides description when selected preset has null description", () => {
      render(
        <StrategyPresetSelector
          {...defaultProps}
          selectedConfigId="regime_mapping"
        />
      );

      // Should not render a description paragraph
      expect(
        screen.queryByText(
          "Front-loaded rebalancing using FGI exponential pacing"
        )
      ).not.toBeInTheDocument();

      // The label should still be visible
      expect(screen.getByText("Strategy preset")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onSelect with config_id when option selected", async () => {
      const user = userEvent.setup();

      render(<StrategyPresetSelector {...defaultProps} />);

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "regime_mapping");

      expect(mockOnSelect).toHaveBeenCalledWith("regime_mapping");
    });

    it("handles changing selection between presets", async () => {
      const user = userEvent.setup();

      render(<StrategyPresetSelector {...defaultProps} />);

      const select = screen.getByRole("combobox");

      // Select regime_mapping
      await user.selectOptions(select, "regime_mapping");
      expect(mockOnSelect).toHaveBeenCalledWith("regime_mapping");

      // Select dca_basic
      await user.selectOptions(select, "dca_basic");
      expect(mockOnSelect).toHaveBeenCalledWith("dca_basic");

      expect(mockOnSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe("edge cases", () => {
    it("renders empty dropdown when presets array is empty", () => {
      render(
        <StrategyPresetSelector
          presets={[]}
          selectedConfigId=""
          onSelect={mockOnSelect}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();

      const options = screen.queryAllByRole("option");
      expect(options).toHaveLength(0);
    });

    it("handles selectedConfigId not found in presets", () => {
      render(
        <StrategyPresetSelector
          {...defaultProps}
          selectedConfigId="non_existent_config"
        />
      );

      // Should still render without crashing
      expect(screen.getByText("Strategy preset")).toBeInTheDocument();

      // No description should be shown since no preset matches
      expect(
        screen.queryByText(
          "Front-loaded rebalancing using FGI exponential pacing"
        )
      ).not.toBeInTheDocument();
    });

    it("renders non-default presets without (Recommended) suffix", () => {
      render(<StrategyPresetSelector {...defaultProps} />);

      const nonDefaultOption = screen.getByRole("option", {
        name: "Regime-Based",
      });
      expect(nonDefaultOption).toBeInTheDocument();
      expect(nonDefaultOption.textContent).not.toContain("(Recommended)");
    });

    it("updates displayed description when selection changes via props", () => {
      const { rerender } = render(
        <StrategyPresetSelector
          {...defaultProps}
          selectedConfigId="fgi_exponential"
        />
      );

      expect(
        screen.getByText(
          "Front-loaded rebalancing using FGI exponential pacing"
        )
      ).toBeInTheDocument();

      // Simulate parent updating selectedConfigId
      rerender(
        <StrategyPresetSelector
          {...defaultProps}
          selectedConfigId="dca_basic"
        />
      );

      expect(
        screen.getByText("Simple dollar-cost averaging strategy")
      ).toBeInTheDocument();
    });
  });
});
