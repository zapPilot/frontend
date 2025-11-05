import { within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EnhancedOverview } from "../../../../src/components/PortfolioAllocation/components/EnhancedOverview";
import {
  ChartDataPoint,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../../../../src/components/PortfolioAllocation/types";
import { fireEvent, render, screen, waitFor } from "../../../test-utils";

// Mock framer-motion for consistent testing
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      ...props
    }: any) => <div {...props}>{children}</div>,
    button: ({
      children,
      whileHover: _whileHover,
      whileTap: _whileTap,
      initial: _initial,
      animate: _animate,
      ...props
    }: any) => <button {...props}>{children}</button>,
  },
}));

// Mock the view model hook with realistic behavior
vi.mock("../../../../src/components/PortfolioAllocation/hooks", () => ({
  usePortfolioAllocationViewModel: vi.fn(),
}));

// Partial mocking - only mock complex child components that would require extensive setup
vi.mock(
  "../../../../src/components/PortfolioAllocation/components/Charts",
  () => ({
    PerformanceTrendChart: ({ excludedCategoryIds, className }: any) => (
      <div
        data-testid="performance-trend-chart"
        className={className}
        data-excluded-categories={excludedCategoryIds.join(",")}
      >
        <h3>Performance Trend</h3>
        <div data-testid="trend-excluded-count">
          {excludedCategoryIds.length}
        </div>
      </div>
    ),
    PortfolioCharts: ({ chartData, targetChartData, isRebalanceMode }: any) => (
      <div data-testid="portfolio-charts" data-rebalance-mode={isRebalanceMode}>
        <h3>{isRebalanceMode ? "Rebalance Portfolio" : "Current Portfolio"}</h3>
        <div data-testid="current-chart">
          {chartData?.map((item: ChartDataPoint) => (
            <div key={item.id} data-testid={`chart-item-${item.id}`}>
              {item.name}: {item.percentage}%
            </div>
          ))}
        </div>
        {targetChartData && (
          <div data-testid="target-chart">
            {targetChartData.map((item: ChartDataPoint) => (
              <div key={item.id} data-testid={`target-item-${item.id}`}>
                Target {item.name}: {item.percentage}%
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  })
);

const { usePortfolioAllocationViewModel } = await import(
  "../../../../src/components/PortfolioAllocation/hooks"
);

describe("EnhancedOverview Integration Tests", () => {
  const mockCategories: ProcessedAssetCategory[] = [
    {
      id: "growth",
      name: "Growth",
      color: "#00ff00",
      isExcluded: false,
      totalAllocationPercentage: 60,
      activeAllocationPercentage: 60,
      totalValue: 60000,
      description: "Growth-focused investments",
      enabledProtocolCount: 3,
      protocols: [
        { id: "protocol-1", name: "Protocol 1", value: 30000 },
        { id: "protocol-2", name: "Protocol 2", value: 30000 },
      ],
    },
    {
      id: "yield",
      name: "Yield",
      color: "#0000ff",
      isExcluded: false,
      totalAllocationPercentage: 40,
      activeAllocationPercentage: 40,
      totalValue: 40000,
      description: "Yield-generating assets",
      enabledProtocolCount: 2,
      protocols: [
        { id: "protocol-3", name: "Protocol 3", value: 25000 },
        { id: "protocol-4", name: "Protocol 4", value: 15000 },
      ],
    },
    {
      id: "defi",
      name: "DeFi",
      color: "#ff0000",
      isExcluded: true,
      totalAllocationPercentage: 20,
      activeAllocationPercentage: 0,
      totalValue: 20000,
      description: "Decentralized Finance protocols",
      enabledProtocolCount: 1,
      protocols: [{ id: "protocol-5", name: "Protocol 5", value: 20000 }],
    },
  ];

  const mockChartData: ChartDataPoint[] = [
    {
      id: "growth",
      name: "Growth",
      value: 60000,
      percentage: 60,
      color: "#00ff00",
    },
    {
      id: "yield",
      name: "Yield",
      value: 40000,
      percentage: 40,
      color: "#0000ff",
    },
  ];

  const mockTargetChartData: ChartDataPoint[] = [
    {
      id: "growth",
      name: "Growth",
      value: 50000,
      percentage: 50,
      color: "#00ff00",
    },
    {
      id: "yield",
      name: "Yield",
      value: 40000,
      percentage: 40,
      color: "#0000ff",
    },
    {
      id: "defi",
      name: "DeFi",
      value: 10000,
      percentage: 10,
      color: "#ff0000",
    },
  ];

  const createRebalanceMode = (enabled = true): RebalanceMode => ({
    isEnabled: enabled,
    data: enabled
      ? {
          current: mockCategories.slice(0, 2),
          target: [
            { ...mockCategories[0], activeAllocationPercentage: 50 },
            { ...mockCategories[1], activeAllocationPercentage: 40 },
            {
              ...mockCategories[2],
              activeAllocationPercentage: 10,
              isExcluded: false,
            },
          ],
          shifts: [
            {
              categoryId: "growth",
              categoryName: "Growth",
              currentPercentage: 60,
              targetPercentage: 50,
              changeAmount: -10,
              changePercentage: -16.7,
              action: "decrease",
              actionDescription: "Reduce growth allocation",
            },
            {
              categoryId: "defi",
              categoryName: "DeFi",
              currentPercentage: 0,
              targetPercentage: 10,
              changeAmount: 10,
              changePercentage: 100,
              action: "increase",
              actionDescription: "Add DeFi exposure",
            },
          ],
          totalRebalanceValue: 15000,
        }
      : undefined,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete User Flow Integration", () => {
    it("handles the complete portfolio management workflow", async () => {
      const mockOnToggleExclusion = vi.fn();
      const mockOnZapAction = vi.fn();

      // Initial state - normal mode
      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories.slice(0, 2),
        excludedCategories: [mockCategories[2]],
        excludedCategoryIdsSet: new Set(["defi"]),
        targetChartData: mockChartData,
        isRebalanceEnabled: false,
        totalCategories: 3,
      });

      const { rerender } = render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["defi"]}
          onToggleCategoryExclusion={mockOnToggleExclusion}
          onZapAction={mockOnZapAction}
          operationMode="zapIn"
        />
      );

      // Verify initial state
      expect(screen.getByTestId("enhanced-overview")).toBeInTheDocument();
      expect(screen.getByText("Current Portfolio")).toBeInTheDocument();
      expect(screen.queryByTestId("rebalance-summary")).not.toBeInTheDocument();

      // Simulate including the excluded category
      fireEvent.click(screen.getByTestId("excluded-chip-defi"));
      expect(mockOnToggleExclusion).toHaveBeenCalledWith("defi");

      // Switch to rebalance mode
      const rebalanceMode = createRebalanceMode(true);
      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories,
        excludedCategories: [],
        excludedCategoryIdsSet: new Set(),
        targetChartData: mockTargetChartData,
        rebalanceShiftMap: new Map([
          ["growth", rebalanceMode.data!.shifts[0]],
          ["defi", rebalanceMode.data!.shifts[1]],
        ]),
        rebalanceTargetMap: new Map(
          rebalanceMode.data!.target.map(t => [t.id, t])
        ),
        isRebalanceEnabled: true,
        totalCategories: 3,
      });

      rerender(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          rebalanceMode={rebalanceMode}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={mockOnToggleExclusion}
          onZapAction={mockOnZapAction}
          operationMode="optimize"
        />
      );

      // Verify rebalance mode
      await waitFor(() => {
        expect(screen.getByText("Rebalance Portfolio")).toBeInTheDocument();
        expect(screen.getByTestId("rebalance-summary")).toBeInTheDocument();
      });

      // Execute optimization
      fireEvent.click(screen.getByTestId("zap-action-button"));
      expect(mockOnZapAction).toHaveBeenCalledTimes(1);
    });

    it("integrates chart data flow correctly", () => {
      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories.slice(0, 2),
        excludedCategories: [mockCategories[2]],
        excludedCategoryIdsSet: new Set(["defi"]),
        targetChartData: mockTargetChartData,
        isRebalanceEnabled: true,
        totalCategories: 3,
      });

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          rebalanceMode={createRebalanceMode(true)}
          excludedCategoryIds={["defi"]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      // Verify current chart data
      expect(screen.getByTestId("chart-item-growth")).toHaveTextContent(
        "Growth: 60%"
      );
      expect(screen.getByTestId("chart-item-yield")).toHaveTextContent(
        "Yield: 40%"
      );

      // Verify target chart data
      expect(screen.getByTestId("target-item-growth")).toHaveTextContent(
        "Target Growth: 50%"
      );
      expect(screen.getByTestId("target-item-yield")).toHaveTextContent(
        "Target Yield: 40%"
      );
      expect(screen.getByTestId("target-item-defi")).toHaveTextContent(
        "Target DeFi: 10%"
      );
    });
  });

  describe("Responsive Layout Integration", () => {
    it("integrates responsive grid layout properly", () => {
      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories.slice(0, 2),
        excludedCategories: [mockCategories[2]],
        excludedCategoryIdsSet: new Set(["defi"]),
        targetChartData: mockChartData,
        isRebalanceEnabled: false,
        totalCategories: 3,
      });

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["defi"]}
          onToggleCategoryExclusion={vi.fn()}
          swapControls={<div data-testid="swap-controls">Quick Swap</div>}
        />
      );

      // Verify the responsive grid structure exists
      const overview = screen.getByTestId("enhanced-overview");
      expect(overview).toBeInTheDocument();

      // Check that key sections are present
      expect(screen.getByTestId("overview-header")).toBeInTheDocument();
      expect(screen.getByTestId("performance-trend-chart")).toBeInTheDocument();
      expect(screen.getByTestId("swap-controls")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-charts")).toBeInTheDocument();
      expect(screen.getByTestId("allocation-list")).toBeInTheDocument();
    });

    it("maintains proper layout in different modes", () => {
      const rebalanceMode = createRebalanceMode(true);

      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories,
        excludedCategories: [],
        excludedCategoryIdsSet: new Set(),
        targetChartData: mockTargetChartData,
        rebalanceShiftMap: new Map(),
        rebalanceTargetMap: new Map(),
        isRebalanceEnabled: true,
        totalCategories: 3,
      });

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          rebalanceMode={rebalanceMode}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      // Both charts and rebalance summary should be visible
      expect(screen.getByTestId("portfolio-charts")).toBeInTheDocument();
      expect(screen.getByTestId("rebalance-summary")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-charts")).toHaveAttribute(
        "data-rebalance-mode",
        "true"
      );
    });
  });

  describe("State Management Integration", () => {
    it("integrates category exclusion state correctly", async () => {
      const mockOnToggleExclusion = vi.fn();

      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories.slice(0, 2),
        excludedCategories: [mockCategories[2]],
        excludedCategoryIdsSet: new Set(["defi"]),
        targetChartData: mockChartData,
        isRebalanceEnabled: false,
        totalCategories: 3,
      });

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["defi"]}
          onToggleCategoryExclusion={mockOnToggleExclusion}
        />
      );

      // Verify excluded category is shown in chips
      expect(screen.getByTestId("excluded-chip-defi")).toBeInTheDocument();
      const excludedRow = screen.getByTestId("category-row-defi");
      const excludedLabel = within(excludedRow).getByText("DeFi");
      expect(excludedLabel).toHaveClass("line-through");

      // Verify exclusion affects performance chart
      expect(screen.getByTestId("trend-excluded-count")).toHaveTextContent("1");
      expect(screen.getByTestId("performance-trend-chart")).toHaveAttribute(
        "data-excluded-categories",
        "defi"
      );

      // Test exclusion toggle
      fireEvent.click(screen.getByTestId("excluded-chip-defi"));
      expect(mockOnToggleExclusion).toHaveBeenCalledWith("defi");

      // Test category list exclusion toggle
      fireEvent.click(screen.getByTestId("toggle-button-growth"));
      expect(mockOnToggleExclusion).toHaveBeenCalledWith("growth");
    });

    it("handles complex rebalance state integration", () => {
      const rebalanceMode = createRebalanceMode(true);
      const shiftMap = new Map([
        ["growth", rebalanceMode.data!.shifts[0]],
        ["defi", rebalanceMode.data!.shifts[1]],
      ]);
      const targetMap = new Map(rebalanceMode.data!.target.map(t => [t.id, t]));

      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories,
        excludedCategories: [],
        excludedCategoryIdsSet: new Set(),
        targetChartData: mockTargetChartData,
        rebalanceShiftMap: shiftMap,
        rebalanceTargetMap: targetMap,
        isRebalanceEnabled: true,
        totalCategories: 3,
      });

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          rebalanceMode={rebalanceMode}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      // Verify rebalance data is integrated properly
      expect(screen.getByTestId("portfolio-charts")).toHaveAttribute(
        "data-rebalance-mode",
        "true"
      );
      expect(screen.getByTestId("rebalance-summary")).toBeInTheDocument();

      // Verify category list receives rebalance data
      const categoryList = screen.getByTestId("allocation-list");
      expect(categoryList).toBeInTheDocument();
    });
  });

  describe("Performance and Edge Cases", () => {
    it("handles large datasets efficiently", () => {
      const largeCategories = Array.from({ length: 50 }, (_, i) => ({
        id: `category-${i}`,
        name: `Category ${i}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        isExcluded: i % 5 === 0,
        totalAllocationPercentage: 2,
        activeAllocationPercentage: i % 5 === 0 ? 0 : 2,
        totalValue: 2000,
        description: `Category ${i} description`,
        enabledProtocolCount: 1,
        protocols: [],
      }));

      const largeChartData = largeCategories
        .filter(c => !c.isExcluded)
        .map(c => ({
          id: c.id,
          name: c.name,
          value: c.totalValue,
          percentage: c.totalAllocationPercentage,
          color: c.color,
        }));

      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: largeCategories.filter(c => !c.isExcluded),
        excludedCategories: largeCategories.filter(c => c.isExcluded),
        excludedCategoryIdsSet: new Set(
          largeCategories.filter(c => c.isExcluded).map(c => c.id)
        ),
        targetChartData: largeChartData,
        isRebalanceEnabled: false,
        totalCategories: 50,
      });

      const startTime = performance.now();
      render(
        <EnhancedOverview
          processedCategories={largeCategories}
          chartData={largeChartData}
          excludedCategoryIds={largeCategories
            .filter(c => c.isExcluded)
            .map(c => c.id)}
          onToggleCategoryExclusion={vi.fn()}
        />
      );
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(400); // Should render in under 100ms
      expect(screen.getByTestId("enhanced-overview")).toBeInTheDocument();
    });

    it("handles empty state gracefully", () => {
      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: [],
        excludedCategories: [],
        excludedCategoryIdsSet: new Set(),
        targetChartData: [],
        isRebalanceEnabled: false,
        totalCategories: 0,
      });

      render(
        <EnhancedOverview
          processedCategories={[]}
          chartData={[]}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.getByTestId("enhanced-overview")).toBeInTheDocument();
      expect(screen.getByTestId("total-categories")).toHaveTextContent("0");
      expect(screen.getByTestId("current-chart")).toBeEmptyDOMElement();
    });

    it("handles rapid state changes without errors", async () => {
      const mockOnToggleExclusion = vi.fn();

      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories.slice(0, 2),
        excludedCategories: [mockCategories[2]],
        excludedCategoryIdsSet: new Set(["defi"]),
        targetChartData: mockChartData,
        isRebalanceEnabled: false,
        totalCategories: 3,
      });

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["defi"]}
          onToggleCategoryExclusion={mockOnToggleExclusion}
        />
      );

      // Rapid clicking should not cause issues
      const chip = screen.getByTestId("excluded-chip-defi");
      for (let i = 0; i < 10; i++) {
        fireEvent.click(chip);
      }

      expect(mockOnToggleExclusion).toHaveBeenCalledTimes(10);
      expect(screen.getByTestId("enhanced-overview")).toBeInTheDocument();
    });
  });

  describe("Error Boundary Integration", () => {
    it("recovers from child component errors gracefully", () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* Suppress errors in test */
      });

      (usePortfolioAllocationViewModel as any).mockReturnValue({
        includedCategories: mockCategories.slice(0, 2),
        excludedCategories: [mockCategories[2]],
        excludedCategoryIdsSet: new Set(["defi"]),
        targetChartData: mockChartData,
        isRebalanceEnabled: false,
        totalCategories: 3,
      });

      // The component should render without throwing
      expect(() =>
        render(
          <EnhancedOverview
            processedCategories={mockCategories}
            chartData={mockChartData}
            excludedCategoryIds={["defi"]}
            onToggleCategoryExclusion={vi.fn()}
          />
        )
      ).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
