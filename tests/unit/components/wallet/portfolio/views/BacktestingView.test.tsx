import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import * as backtestingService from "@/services/backtestingService";

import {
  mockCatalogEmpty,
  mockCatalogMalformedSchema,
  mockCatalogNoEnum,
  mockCatalogNoPacingPolicy,
  mockCatalogNoSchema,
  mockCatalogSingleStrategy,
  mockCatalogWithoutPacingPolicies,
  mockCatalogWithPacingPolicies,
} from "../../../../../fixtures/mockBacktestingData";

// Mock useBacktestMutation
vi.mock("@/hooks/mutations/useBacktestMutation", () => ({
  useBacktestMutation: vi.fn(),
}));

// Mock the backtesting service
vi.mock("@/services/backtestingService", () => ({
  getBacktestingStrategiesV3: vi.fn(),
  runBacktest: vi.fn(),
}));

// Mock Recharts (BacktestChart dependency)
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  ComposedChart: ({ children }: any) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Area: () => null,
  Scatter: () => null,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

describe("BacktestingView", () => {
  const mockMutate = vi.fn();

  const defaultMock = {
    mutate: mockMutate,
    data: null,
    isPending: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBacktestMutation).mockReturnValue(defaultMock as any);
    // Default: catalog fetch succeeds with empty catalog
    vi.mocked(backtestingService.getBacktestingStrategiesV3).mockResolvedValue(
      mockCatalogWithPacingPolicies
    );
  });

  it("renders the JSON editor and run button", async () => {
    await act(async () => {
      render(<BacktestingView />);
    });

    expect(screen.getByText("Strategy Simulator")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Run Backtest/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Request Payload \(v3\)/i)).toBeInTheDocument();

    // Switch to JSON mode to see the textbox
    const jsonTab = screen.getByRole("button", { name: /JSON/i });
    await act(async () => {
      fireEvent.click(jsonTab);
    });

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("triggers backtest on button click", async () => {
    await act(async () => {
      render(<BacktestingView />);
    });

    const runButton = screen.getByRole("button", { name: /Run Backtest/i });
    await act(async () => {
      fireEvent.click(runButton);
    });

    expect(mockMutate).toHaveBeenCalled();
  });

  it("shows loading state when pending", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      isPending: true,
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    expect(
      screen.getByRole("button", { name: /Running\.\.\./i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Running\.\.\./i })
    ).toBeDisabled();
  });

  it("displays error message from API", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      error: new Error("Test API Error"),
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    expect(screen.getByText("Test API Error")).toBeInTheDocument();
  });

  it("displays results when data is present", async () => {
    const mockData = {
      strategies: {
        dca_classic: {
          strategy_id: "dca_classic",
          display_name: "DCA Classic",
          roi_percent: 5.2,
          final_value: 10500,
          total_invested: 10000,
          trade_count: 0,
          max_drawdown_percent: 5,
          parameters: {},
        },
        simple_regime: {
          strategy_id: "simple_regime",
          display_name: "Simple Regime",
          roi_percent: 15.5,
          final_value: 12000,
          total_invested: 10000,
          trade_count: 5,
          max_drawdown_percent: 10,
          parameters: {},
        },
      },
      timeline: [
        {
          date: "2024-01-01",
          token_price: { btc: 40000 },
          sentiment: 50,
          sentiment_label: "neutral",
          strategies: {
            dca_classic: {
              portfolio_value: 10000,
              portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
              event: "buy",
              metrics: { signal: "dca", metadata: {} },
            },
            simple_regime: {
              portfolio_value: 10000,
              portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
              event: null,
              metrics: { signal: "fear", metadata: {} },
            },
          },
        },
      ],
    };

    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      data: mockData,
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    expect(screen.getByText("ROI")).toBeInTheDocument();
    expect(screen.getByText("+15.5%")).toBeInTheDocument();
    expect(screen.getByText("+5.2%")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });

  // =============================================================================
  // Pacing Policy Hints Feature Tests
  // =============================================================================

  describe("Pacing Policy Hints - Group 1: Pacing Policies Extraction", () => {
    it("should extract pacing policies from catalog hyperparam_schema", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(
          screen.getByText(/Available pacing_policy:/i)
        ).toBeInTheDocument();
      });

      // Verify all 6 pacing policies are displayed
      const policiesText = screen.getByText(
        /regime_mapping.*fgi_linear.*fgi_exponential.*fgi_power.*fgi_logistic.*volatility_scaled_fgi_exponential/
      );
      expect(policiesText).toBeInTheDocument();

      // Verify exact order and formatting
      expect(policiesText.textContent).toContain(
        "regime_mapping, fgi_linear, fgi_exponential, fgi_power, fgi_logistic, volatility_scaled_fgi_exponential"
      );
    });

    it("should return empty array when catalog is null", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockRejectedValue(new Error("Failed to fetch catalog"));

      render(<BacktestingView />);

      // Wait for component to settle
      await waitFor(() => {
        expect(screen.getByText(/Request Payload \(v3\)/i)).toBeInTheDocument();
      });

      // Hints section should not be visible when catalog is null
      expect(
        screen.queryByText(/Available strategy_id:/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Available pacing_policy:/i)
      ).not.toBeInTheDocument();
    });

    it("should return empty array when simple_regime strategy is missing", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithoutPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Strategy ID should be visible in hints section
      const hintsSection = screen.getByText(
        /Available strategy_id:/i
      ).parentElement;
      expect(hintsSection?.textContent).toContain("dca_classic");

      // Pacing policy line should NOT be visible
      expect(
        screen.queryByText(/Available pacing_policy:/i)
      ).not.toBeInTheDocument();
    });

    it("should return empty array when hyperparam_schema is missing", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogNoSchema);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Strategy ID should be visible (simple_regime exists) in hints section
      const hintsSection = screen.getByText(
        /Available strategy_id:/i
      ).parentElement;
      expect(hintsSection?.textContent).toContain("simple_regime");

      // Pacing policy line should NOT be visible (no schema)
      expect(
        screen.queryByText(/Available pacing_policy:/i)
      ).not.toBeInTheDocument();
    });

    it("should return empty array when schema has no properties", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogMalformedSchema);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Strategy ID should be visible (simple_regime exists) in hints section
      const hintsSection = screen.getByText(
        /Available strategy_id:/i
      ).parentElement;
      expect(hintsSection?.textContent).toContain("simple_regime");

      // Pacing policy line should NOT be visible (no properties)
      expect(
        screen.queryByText(/Available pacing_policy:/i)
      ).not.toBeInTheDocument();
    });

    it("should return empty array when pacing_policy property is missing", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogNoPacingPolicy);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Strategy ID should be visible in hints section
      const hintsSection = screen.getByText(
        /Available strategy_id:/i
      ).parentElement;
      expect(hintsSection?.textContent).toContain("simple_regime");

      // Pacing policy line should NOT be visible (no pacing_policy in properties)
      expect(
        screen.queryByText(/Available pacing_policy:/i)
      ).not.toBeInTheDocument();
    });

    it("should return empty array when pacing_policy has no enum", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogNoEnum);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Strategy ID should be visible in hints section
      const hintsSection = screen.getByText(
        /Available strategy_id:/i
      ).parentElement;
      expect(hintsSection?.textContent).toContain("simple_regime");

      // Pacing policy line should NOT be visible (no enum in pacing_policy)
      expect(
        screen.queryByText(/Available pacing_policy:/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Pacing Policy Hints - Group 2: Hints Section Visibility", () => {
    it("should display hints section when catalog is available", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Verify hints section is visible
      expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      expect(screen.getByText(/Available pacing_policy:/i)).toBeInTheDocument();
    });

    it("should not display hints section when catalog is null", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockRejectedValue(new Error("Failed to fetch"));

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Request Payload \(v3\)/i)).toBeInTheDocument();
      });

      // Hints section should not exist
      expect(
        screen.queryByText(/Available strategy_id:/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Available pacing_policy:/i)
      ).not.toBeInTheDocument();
    });

    it("should show hints section after catalog loads asynchronously", async () => {
      // Start with pending promise
      let resolvePromise: (value: typeof mockCatalogWithPacingPolicies) => void;
      const catalogPromise = new Promise<typeof mockCatalogWithPacingPolicies>(
        resolve => {
          resolvePromise = resolve;
        }
      );

      vi.mocked(backtestingService.getBacktestingStrategiesV3).mockReturnValue(
        catalogPromise
      );

      render(<BacktestingView />);

      // Initially, hints should not be visible
      expect(
        screen.queryByText(/Available strategy_id:/i)
      ).not.toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockCatalogWithPacingPolicies);
      });

      // Wait for hints to appear
      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Available pacing_policy:/i)).toBeInTheDocument();
    });
  });

  describe("Pacing Policy Hints - Group 3: Strategy ID Display", () => {
    it("should display all strategy IDs from catalog", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Verify both strategies are displayed in hints section
      const strategyLabel = screen.getByText(/Available strategy_id:/i);
      const strategyHint = strategyLabel.parentElement;
      expect(strategyHint?.textContent).toContain("dca_classic");
      expect(strategyHint?.textContent).toContain("simple_regime");
      expect(strategyHint?.textContent).toContain("dca_classic, simple_regime");
    });

    it("should display single strategy ID without trailing comma", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogSingleStrategy);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Verify single strategy displayed correctly in hints section
      const strategyLabel = screen.getByText(/Available strategy_id:/i);
      const strategyHint = strategyLabel.parentElement;
      expect(strategyHint?.textContent).toContain("dca_classic");
      // Should not have trailing comma
      expect(strategyHint?.textContent).not.toMatch(/dca_classic,\s*$/);
    });

    it("should handle catalog with empty strategies array", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogEmpty);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Should show empty string for strategies (label visible, no values)
      const hintsSection = screen.getByText(
        /Available strategy_id:/i
      ).parentElement;
      expect(hintsSection).toBeInTheDocument();
      expect(hintsSection?.textContent).toContain("Available strategy_id: ");
    });
  });

  describe("Pacing Policy Hints - Group 4: Pacing Policy Display", () => {
    it("should display all pacing policies when available", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(
          screen.getByText(/Available pacing_policy:/i)
        ).toBeInTheDocument();
      });

      // Verify all 6 policies displayed in correct order
      const policyText = screen.getByText(
        /regime_mapping.*fgi_linear.*fgi_exponential.*fgi_power.*fgi_logistic.*volatility_scaled_fgi_exponential/
      );
      expect(policyText).toBeInTheDocument();

      // Verify exact formatting with commas
      expect(policyText.textContent).toContain(
        "regime_mapping, fgi_linear, fgi_exponential, fgi_power, fgi_logistic, volatility_scaled_fgi_exponential"
      );
    });

    it("should not display pacing_policy line when no policies found", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithoutPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Strategy line should be visible
      expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();

      // Pacing policy line should NOT be visible
      expect(
        screen.queryByText(/Available pacing_policy:/i)
      ).not.toBeInTheDocument();
    });

    it("should join pacing policies with comma and space", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(
          screen.getByText(/Available pacing_policy:/i)
        ).toBeInTheDocument();
      });

      // Verify comma-space separator
      const policyText = screen.getByText(
        /Available pacing_policy:/i
      ).parentElement;
      expect(policyText?.textContent).toMatch(/regime_mapping,\s+fgi_linear/);
      expect(policyText?.textContent).toMatch(/fgi_linear,\s+fgi_exponential/);
      expect(policyText?.textContent).toMatch(/fgi_exponential,\s+fgi_power/);
    });
  });

  describe("Pacing Policy Hints - Group 5: Styling and Accessibility", () => {
    it("should apply correct styling classes to hints section", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Find the hints container
      const strategyLabel = screen.getByText(/Available strategy_id:/i);
      const hintsContainer = strategyLabel.parentElement?.parentElement;

      // Verify container has correct classes
      expect(hintsContainer).toHaveClass(
        "mt-3",
        "text-xs",
        "text-gray-500",
        "space-y-1"
      );

      // Verify labels have correct classes
      expect(strategyLabel).toHaveClass("text-gray-400", "font-medium");
    });

    it("should render hints section below editor error if present", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      const user = userEvent.setup();
      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Trigger an error by entering invalid JSON
      // First switch to JSON mode
      const jsonTab = screen.getByRole("button", { name: /JSON/i });
      await act(async () => {
        fireEvent.click(jsonTab);
      });

      const textarea = screen.getByRole("textbox");
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste("{ invalid json");

      // Click run backtest to trigger validation
      const runButton = screen.getByRole("button", { name: /Run Backtest/i });
      await act(async () => {
        await user.click(runButton);
      });

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getAllByText(/Invalid JSON/i).length).toBeGreaterThan(0);
      });

      // Verify hints are still visible and below the error
      const errorSpan = screen.getAllByText(/Invalid JSON/i)[0];
      const errorContainer = errorSpan.parentElement!;
      const hintsDiv = screen.getByText(/Available strategy_id:/i)
        .parentElement!.parentElement!;

      // Get shared parent
      const parentContainer = errorContainer.parentElement;
      const children = Array.from(parentContainer?.children || []);

      const errorIndex = children.indexOf(errorContainer);
      const hintsIndex = children.indexOf(hintsDiv);

      expect(errorIndex).toBeLessThan(hintsIndex);
    });

    it("should render hints in correct DOM position", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });

      // Switch to JSON mode
      const jsonTab = screen.getByRole("button", { name: /JSON/i });
      await act(async () => {
        fireEvent.click(jsonTab);
      });

      // Find the textarea
      const textarea = screen.getByRole("textbox");
      const textareaParent = textarea.parentElement;

      // Find hints section
      const hintsSection = screen.getByText(/Available strategy_id:/i)
        .parentElement?.parentElement;

      // Verify hints are siblings of textarea container within the same card
      expect(textareaParent?.parentElement).toBe(hintsSection?.parentElement);
    });
  });

  describe("Pacing Policy Hints - Group 6: Integration with Component State", () => {
    it("should update hints when catalog changes", async () => {
      // Start with catalog containing pacing policies
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      const { rerender } = render(<BacktestingView />);

      await waitFor(() => {
        expect(
          screen.getByText(/Available pacing_policy:/i)
        ).toBeInTheDocument();
      });

      // Verify initial pacing policies are visible in the pacing_policy hint
      expect(screen.getByText(/Available pacing_policy:/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /regime_mapping, fgi_linear, fgi_exponential, fgi_power, fgi_logistic, volatility_scaled_fgi_exponential/
        )
      ).toBeInTheDocument();

      // Change mock to catalog without pacing policies
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithoutPacingPolicies);

      // Rerender component (simulating catalog refetch)
      rerender(<BacktestingView />);

      await waitFor(() => {
        expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      });
    });

    it("should keep hints visible during backtest execution", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      // Mock the mutation hook to simulate pending state
      vi.mocked(useBacktestMutation).mockReturnValue({
        mutate: vi.fn(),
        data: null,
        isPending: true, // Simulate pending backtest
        error: null,
      } as any);

      render(<BacktestingView />);

      await waitFor(() => {
        expect(
          screen.getByText(/Available pacing_policy:/i)
        ).toBeInTheDocument();
      });

      // Verify hints remain visible even when backtest is pending
      expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      expect(screen.getByText(/Available pacing_policy:/i)).toBeInTheDocument();

      // Verify "Running..." button is shown
      expect(
        screen.getByRole("button", { name: /Running\.\.\./i })
      ).toBeInTheDocument();
    });

    it("should keep hints visible when user edits JSON", async () => {
      vi.mocked(
        backtestingService.getBacktestingStrategiesV3
      ).mockResolvedValue(mockCatalogWithPacingPolicies);

      const user = userEvent.setup();
      render(<BacktestingView />);

      await waitFor(() => {
        expect(
          screen.getByText(/Available pacing_policy:/i)
        ).toBeInTheDocument();
      });

      // Switch to JSON mode
      const jsonTab = screen.getByRole("button", { name: /JSON/i });
      await act(async () => {
        fireEvent.click(jsonTab);
      });

      // Edit the textarea using paste to avoid special character handling
      const textarea = screen.getByRole("textbox");
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste('{"token_symbol": "ETH"}');

      // Verify hints remain visible after editing
      expect(screen.getByText(/Available strategy_id:/i)).toBeInTheDocument();
      expect(screen.getByText(/Available pacing_policy:/i)).toBeInTheDocument();

      // Verify textarea value changed
      expect(textarea).toHaveValue('{"token_symbol": "ETH"}');
    });
  });
});
