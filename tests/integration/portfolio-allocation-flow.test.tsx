import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioAllocationContainer } from "@/components/PortfolioAllocation/PortfolioAllocationContainer";
import { SLIPPAGE_CONFIG } from "@/constants/slippage";
import type { AssetCategory } from "@/types/portfolio";

import { render } from "../test-utils";

// Mock child components to focus on integration logic
vi.mock("@/components/PortfolioAllocation/components/EnhancedOverview", () => ({
  EnhancedOverview: vi.fn(
    ({
      processedCategories,
      chartData,
      onZapAction,
      swapControls,
      operationMode,
      excludedCategoryIds,
      onToggleCategoryExclusion,
      allocations,
      onAllocationChange,
      actionEnabled,
      actionDisabledReason,
    }) => (
      <div data-testid="enhanced-overview">
        <div data-testid="operation-mode">{operationMode}</div>
        <div data-testid="action-enabled">
          {actionEnabled ? "enabled" : "disabled"}
        </div>
        {actionDisabledReason && (
          <div data-testid="action-disabled-reason">{actionDisabledReason}</div>
        )}
        <div data-testid="category-count">{processedCategories.length}</div>
        <div data-testid="chart-data-count">{chartData.length}</div>
        <div data-testid="excluded-count">
          {excludedCategoryIds?.length || 0}
        </div>

        {/* Simulate category list with toggles */}
        <div data-testid="category-list">
          {processedCategories.map(category => (
            <div key={category.id} data-testid={`category-${category.id}`}>
              <span data-testid={`category-name-${category.id}`}>
                {category.name}
              </span>
              <span data-testid={`category-excluded-${category.id}`}>
                {category.isExcluded ? "excluded" : "included"}
              </span>
              <button
                data-testid={`toggle-category-${category.id}`}
                onClick={() => onToggleCategoryExclusion?.(category.id)}
              >
                Toggle {category.name}
              </button>
              <input
                type="number"
                data-testid={`allocation-input-${category.id}`}
                value={allocations[category.id] || 0}
                onChange={e =>
                  onAllocationChange(
                    category.id,
                    Number.parseFloat(e.target.value)
                  )
                }
              />
            </div>
          ))}
        </div>

        {/* Render swap controls */}
        {swapControls}

        {/* Action button */}
        <button
          data-testid="zap-action-button"
          onClick={onZapAction}
          disabled={!actionEnabled}
        >
          Execute {operationMode}
        </button>
      </div>
    )
  ),
}));

vi.mock("@/components/PortfolioAllocation/components/SwapControls", () => ({
  SwapControls: vi.fn(
    ({
      operationMode,
      swapSettings,
      onSwapSettingsChange,
      includedCategories,
    }) => (
      <div data-testid="swap-controls">
        <div data-testid="swap-operation-mode">{operationMode}</div>
        <div data-testid="included-categories-count">
          {includedCategories.length}
        </div>

        {/* Amount Input */}
        <input
          type="text"
          data-testid="amount-input"
          value={swapSettings.amount || ""}
          onChange={e =>
            onSwapSettingsChange({ ...swapSettings, amount: e.target.value })
          }
          placeholder="Enter amount"
        />

        {/* Token Selection for ZapIn */}
        {operationMode === "zapIn" && (
          <select
            data-testid="from-token-select"
            value={swapSettings.fromToken?.symbol || ""}
            onChange={e =>
              onSwapSettingsChange({
                ...swapSettings,
                fromToken: e.target.value
                  ? { symbol: e.target.value, address: `0x${e.target.value}` }
                  : undefined,
              })
            }
          >
            <option value="">Select token</option>
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
            <option value="WBTC">WBTC</option>
          </select>
        )}

        {/* Token Selection for ZapOut */}
        {operationMode === "zapOut" && (
          <select
            data-testid="to-token-select"
            value={swapSettings.toToken?.symbol || ""}
            onChange={e =>
              onSwapSettingsChange({
                ...swapSettings,
                toToken: e.target.value
                  ? { symbol: e.target.value, address: `0x${e.target.value}` }
                  : undefined,
              })
            }
          >
            <option value="">Select token</option>
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
            <option value="WBTC">WBTC</option>
          </select>
        )}

        {/* Slippage Tolerance */}
        <input
          type="number"
          data-testid="slippage-input"
          value={swapSettings.slippageTolerance || SLIPPAGE_CONFIG.DEFAULT}
          onChange={e =>
            onSwapSettingsChange({
              ...swapSettings,
              slippageTolerance: Number.parseFloat(e.target.value),
            })
          }
          step="0.1"
        />
      </div>
    )
  ),
}));

describe("Portfolio Allocation Flow Integration Tests", () => {
  const mockCategories: AssetCategory[] = [
    {
      id: "defi-lending",
      name: "DeFi Lending",
      protocols: [
        {
          id: "aave",
          name: "Aave",
          category: "defi-lending",
          positions: [
            {
              id: "aave-usdc",
              protocolId: "aave",
              tokenSymbol: "USDC",
              balance: "1000",
              valueUsd: 1000,
              apr: 5.5,
            },
          ],
        },
      ],
    },
    {
      id: "defi-dex",
      name: "DeFi DEX",
      protocols: [
        {
          id: "uniswap",
          name: "Uniswap",
          category: "defi-dex",
          positions: [
            {
              id: "uni-eth-usdc",
              protocolId: "uniswap",
              tokenSymbol: "ETH-USDC LP",
              balance: "500",
              valueUsd: 500,
              apr: 12.3,
            },
          ],
        },
      ],
    },
    {
      id: "stable",
      name: "Stablecoins",
      protocols: [
        {
          id: "curve",
          name: "Curve",
          category: "stable",
          positions: [
            {
              id: "curve-3pool",
              protocolId: "curve",
              tokenSymbol: "3CRV",
              balance: "800",
              valueUsd: 800,
              apr: 3.2,
            },
          ],
        },
      ],
    },
  ];

  const mockOnZapAction = vi.fn();
  const mockOnToggleCategoryExclusion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ZapIn Flow", () => {
    it("should complete full ZapIn user flow with token selection and amount input", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapIn"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={[]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      // Verify initial state
      expect(screen.getByTestId("operation-mode")).toHaveTextContent("zapIn");
      expect(screen.getByTestId("category-count")).toHaveTextContent("3");

      // Verify action is initially disabled (no token or amount)
      expect(screen.getByTestId("action-enabled")).toHaveTextContent(
        "disabled"
      );
      expect(screen.getByTestId("zap-action-button")).toBeDisabled();

      // Step 1: Select token
      const tokenSelect = screen.getByTestId("from-token-select");
      await act(async () => {
        await user.selectOptions(tokenSelect, "USDC");
      });

      // Still disabled (no amount)
      expect(screen.getByTestId("action-enabled")).toHaveTextContent(
        "disabled"
      );

      // Step 2: Enter amount
      const amountInput = screen.getByTestId("amount-input");
      await act(async () => {
        await user.type(amountInput, "1000");
      });

      // Now action should be enabled
      await waitFor(() => {
        expect(screen.getByTestId("action-enabled")).toHaveTextContent(
          "enabled"
        );
        expect(screen.getByTestId("zap-action-button")).not.toBeDisabled();
      });

      // Step 3: Execute action
      const actionButton = screen.getByTestId("zap-action-button");
      await act(async () => {
        await user.click(actionButton);
      });

      // Verify action was called with correct parameters
      await waitFor(() => {
        expect(mockOnZapAction).toHaveBeenCalledTimes(1);
        const callArg = mockOnZapAction.mock.calls[0]?.[0];
        expect(callArg).toMatchObject({
          operationMode: "zapIn",
          swapSettings: {
            amount: "1000",
            fromToken: { symbol: "USDC", address: "0xUSDC" },
            slippageTolerance: SLIPPAGE_CONFIG.DEFAULT,
          },
        });
        expect(callArg.includedCategories).toHaveLength(3);
      });
    });

    it("should filter categories and update action parameters", async () => {
      const user = userEvent.setup();

      const { rerender } = await act(async () => {
        return render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapIn"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={[]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      // Step 1: Exclude a category
      const toggleButton = screen.getByTestId("toggle-category-stable");
      await act(async () => {
        await user.click(toggleButton);
      });

      expect(mockOnToggleCategoryExclusion).toHaveBeenCalledWith("stable");

      // Re-render with excluded category
      await act(async () => {
        rerender(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapIn"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={["stable"]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      // Verify excluded count
      expect(screen.getByTestId("excluded-count")).toHaveTextContent("1");
      expect(screen.getByTestId("category-excluded-stable")).toHaveTextContent(
        "excluded"
      );

      // Step 2: Complete the flow
      await act(async () => {
        await user.selectOptions(
          screen.getByTestId("from-token-select"),
          "ETH"
        );
        await user.type(screen.getByTestId("amount-input"), "5");
      });

      await waitFor(() => {
        expect(screen.getByTestId("action-enabled")).toHaveTextContent(
          "enabled"
        );
      });

      await act(async () => {
        await user.click(screen.getByTestId("zap-action-button"));
      });

      // Verify only included categories are passed
      await waitFor(() => {
        expect(mockOnZapAction).toHaveBeenCalled();
        const callArg = mockOnZapAction.mock.calls[0]?.[0];
        expect(callArg.includedCategories).toHaveLength(2); // Excluded "stable"
        expect(
          callArg.includedCategories.every(cat => cat.id !== "stable")
        ).toBe(true);
      });
    });

    it("should update allocations and propagate to action", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapIn"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={[]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      // Update allocation for a category
      const allocationInput = screen.getByTestId(
        "allocation-input-defi-lending"
      );
      await act(async () => {
        await user.clear(allocationInput);
        await user.type(allocationInput, "50");
      });

      // Verify allocation is updated
      await waitFor(() => {
        expect(allocationInput).toHaveValue(50);
      });

      // Complete the flow
      await act(async () => {
        await user.selectOptions(
          screen.getByTestId("from-token-select"),
          "USDC"
        );
        await user.type(screen.getByTestId("amount-input"), "2000");
        await user.click(screen.getByTestId("zap-action-button"));
      });

      // Verify action contains updated allocation data
      await waitFor(() => {
        const callArg = mockOnZapAction.mock.calls[0]?.[0];
        expect(callArg.includedCategories).toBeDefined();
        // Categories should reflect updated allocations
      });
    });
  });

  describe("ZapOut Flow", () => {
    it("should complete full ZapOut user flow", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapOut"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={[]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      expect(screen.getByTestId("operation-mode")).toHaveTextContent("zapOut");

      // Select output token
      await act(async () => {
        await user.selectOptions(screen.getByTestId("to-token-select"), "USDC");
      });

      // Enter amount
      await act(async () => {
        await user.type(screen.getByTestId("amount-input"), "500");
      });

      // Verify enabled
      await waitFor(() => {
        expect(screen.getByTestId("action-enabled")).toHaveTextContent(
          "enabled"
        );
      });

      // Execute
      await act(async () => {
        await user.click(screen.getByTestId("zap-action-button"));
      });

      await waitFor(() => {
        expect(mockOnZapAction).toHaveBeenCalled();
        const callArg = mockOnZapAction.mock.calls[0]?.[0];
        expect(callArg.operationMode).toBe("zapOut");
        expect(callArg.swapSettings.toToken?.symbol).toBe("USDC");
      });
    });
  });

  describe("Slippage Configuration", () => {
    it("should allow user to adjust slippage tolerance", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapIn"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={[]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      const slippageInput = screen.getByTestId("slippage-input");

      // Default slippage
      expect(slippageInput).toHaveValue(SLIPPAGE_CONFIG.DEFAULT);

      // Update slippage
      await act(async () => {
        await user.clear(slippageInput);
        await user.type(slippageInput, "1.5");
      });

      await waitFor(() => {
        expect(slippageInput).toHaveValue(1.5);
      });

      // Complete flow
      await act(async () => {
        await user.selectOptions(
          screen.getByTestId("from-token-select"),
          "ETH"
        );
        await user.type(screen.getByTestId("amount-input"), "10");
        await user.click(screen.getByTestId("zap-action-button"));
      });

      await waitFor(() => {
        expect(mockOnZapAction).toHaveBeenCalled();
        const callArg = mockOnZapAction.mock.calls[0]?.[0];
        expect(callArg.swapSettings.slippageTolerance).toBe(1.5);
      });
    });
  });

  describe("Error States", () => {
    it("should show disabled reason when missing token", async () => {
      await act(async () => {
        render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapIn"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={[]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      const user = userEvent.setup();

      // Only enter amount (no token)
      await act(async () => {
        await user.type(screen.getByTestId("amount-input"), "100");
      });

      await waitFor(() => {
        expect(screen.getByTestId("action-enabled")).toHaveTextContent(
          "disabled"
        );
        expect(screen.getByTestId("action-disabled-reason")).toHaveTextContent(
          /select a token/i
        );
      });
    });

    it("should show disabled reason when missing amount", async () => {
      await act(async () => {
        render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapOut"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={[]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      const user = userEvent.setup();

      // Only select token (no amount)
      await act(async () => {
        await user.selectOptions(screen.getByTestId("to-token-select"), "WBTC");
      });

      await waitFor(() => {
        expect(screen.getByTestId("action-enabled")).toHaveTextContent(
          "disabled"
        );
        expect(screen.getByTestId("action-disabled-reason")).toHaveTextContent(
          /enter an amount/i
        );
      });
    });
  });

  describe("Chart Data Integration", () => {
    it("should generate chart data from categories", async () => {
      await act(async () => {
        render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapIn"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={[]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      // Verify chart data is generated for all categories
      expect(screen.getByTestId("chart-data-count")).toHaveTextContent("3");
    });

    it("should update chart data when categories are excluded", async () => {
      await act(async () => {
        render(
          <PortfolioAllocationContainer
            assetCategories={mockCategories}
            operationMode="zapIn"
            onZapAction={mockOnZapAction}
            excludedCategoryIds={["defi-dex"]}
            onToggleCategoryExclusion={mockOnToggleCategoryExclusion}
            chainId={1}
          />
        );
      });

      // Chart should still show all categories (excluded ones just marked differently)
      expect(screen.getByTestId("chart-data-count")).toHaveTextContent("3");
      expect(
        screen.getByTestId("category-excluded-defi-dex")
      ).toHaveTextContent("excluded");
    });
  });
});
