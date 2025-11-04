import { beforeEach, describe, expect, it, vi } from "vitest";

import { EnhancedOverview } from "../../../../src/components/PortfolioAllocation/components/EnhancedOverview";
import {
  ChartDataPoint,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../../../../src/components/PortfolioAllocation/types";
import { fireEvent, render, screen, waitFor } from "../../../test-utils";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock the view model hook
vi.mock("../../../../src/components/PortfolioAllocation/hooks", () => ({
  usePortfolioAllocationViewModel: vi.fn(),
}));

// Mock child components
vi.mock(
  "../../../../src/components/PortfolioAllocation/components/ActionsAndControls",
  () => ({
    ActionButton: vi.fn(({ onAction, operationMode, testId }) => (
      <button
        data-testid={testId || "action-button"}
        onClick={onAction}
        data-operation-mode={operationMode}
      >
        {operationMode === "zapIn"
          ? "ZapIn"
          : operationMode === "zapOut"
            ? "ZapOut"
            : "Optimize"}
      </button>
    )),
  })
);

vi.mock(
  "../../../../src/components/PortfolioAllocation/components/Categories",
  () => ({
    CategoryListSection: vi.fn(
      ({ categories, onToggleCategoryExclusion, testId }) => (
        <div data-testid={testId || "category-list"}>
          {categories.map((cat: ProcessedAssetCategory) => (
            <div key={cat.id} data-testid={`category-${cat.id}`}>
              <span>{cat.name}</span>
              <button
                onClick={() => onToggleCategoryExclusion(cat.id)}
                data-testid={`toggle-${cat.id}`}
              >
                Toggle {cat.name}
              </button>
            </div>
          ))}
        </div>
      )
    ),
  })
);

vi.mock(
  "../../../../src/components/PortfolioAllocation/components/Charts",
  () => ({
    PerformanceTrendChart: vi.fn(({ excludedCategoryIds, className }) => (
      <div
        data-testid="performance-trend-chart"
        className={className}
        data-excluded-count={excludedCategoryIds.length}
      >
        Performance Chart
      </div>
    )),
    PortfolioCharts: vi.fn(
      ({ chartData, targetChartData, isRebalanceMode }) => (
        <div
          data-testid="portfolio-charts"
          data-rebalance-mode={isRebalanceMode}
        >
          {isRebalanceMode ? "Rebalance Charts" : "Normal Charts"}
          <div data-testid="chart-data-count">{chartData?.length || 0}</div>
          {targetChartData && (
            <div data-testid="target-chart-data-count">
              {targetChartData.length}
            </div>
          )}
        </div>
      )
    ),
  })
);

vi.mock(
  "../../../../src/components/PortfolioAllocation/components/Headers",
  () => ({
    OverviewHeader: vi.fn(
      ({ rebalanceMode, totalCategories, includedCategories }) => (
        <div data-testid="overview-header">
          <span data-testid="total-categories">{totalCategories}</span>
          <span data-testid="included-categories">{includedCategories}</span>
          <span data-testid="rebalance-enabled">
            {rebalanceMode?.isEnabled ? "true" : "false"}
          </span>
        </div>
      )
    ),
  })
);

vi.mock(
  "../../../../src/components/PortfolioAllocation/components/Summary",
  () => ({
    ExcludedCategoriesChips: vi.fn(
      ({ excludedCategories, onToggleCategoryExclusion }) => (
        <div data-testid="excluded-categories-chips">
          {excludedCategories.map((cat: ProcessedAssetCategory) => (
            <button
              key={cat.id}
              onClick={() => onToggleCategoryExclusion(cat.id)}
              data-testid={`chip-${cat.id}`}
            >
              {cat.name} (Excluded)
            </button>
          ))}
        </div>
      )
    ),
    RebalanceSummary: vi.fn(({ rebalanceData }) => (
      <div data-testid="rebalance-summary">
        Rebalance Summary: ${rebalanceData?.totalRebalanceValue || 0}
      </div>
    )),
  })
);

const { usePortfolioAllocationViewModel } = await import(
  "../../../../src/components/PortfolioAllocation/hooks"
);

describe("EnhancedOverview", () => {
  const mockCategories: ProcessedAssetCategory[] = [
    {
      id: "growth",
      name: "Growth",
      color: "#00ff00",
      isExcluded: false,
      totalAllocationPercentage: 60,
      activeAllocationPercentage: 60,
      totalValue: 60000,
      description: "Growth assets",
      enabledProtocolCount: 3,
      protocols: [],
    },
    {
      id: "yield",
      name: "Yield",
      color: "#0000ff",
      isExcluded: true,
      totalAllocationPercentage: 40,
      activeAllocationPercentage: 0,
      totalValue: 40000,
      description: "Yield generating assets",
      enabledProtocolCount: 2,
      protocols: [],
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
      value: 50000,
      percentage: 50,
      color: "#0000ff",
    },
  ];

  const mockViewModelReturn = {
    includedCategories: [mockCategories[0]], // Only growth included
    excludedCategories: [mockCategories[1]], // Yield excluded
    excludedCategoryIdsSet: new Set(["yield"]),
    targetChartData: mockTargetChartData,
    isRebalanceEnabled: false,
    totalCategories: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (usePortfolioAllocationViewModel as any).mockReturnValue(
      mockViewModelReturn
    );
  });

  describe("Basic Rendering", () => {
    it("renders with minimal required props", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["yield"]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.getByTestId("enhanced-overview")).toBeInTheDocument();
      expect(screen.getByTestId("overview-header")).toBeInTheDocument();
      expect(screen.getByTestId("performance-trend-chart")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-charts")).toBeInTheDocument();
      expect(screen.getByTestId("category-list")).toBeInTheDocument();
    });

    it("passes correct props to OverviewHeader", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["yield"]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.getByTestId("total-categories")).toHaveTextContent("2");
      expect(screen.getByTestId("included-categories")).toHaveTextContent("1");
      expect(screen.getByTestId("rebalance-enabled")).toHaveTextContent(
        "false"
      );
    });

    it("passes excluded category IDs to PerformanceTrendChart", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["yield", "other"]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.getByTestId("performance-trend-chart")).toHaveAttribute(
        "data-excluded-count",
        "2"
      );
    });
  });

  describe("Operation Mode", () => {
    it("defaults to zapIn operation mode", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.getByTestId("action-button")).toHaveAttribute(
        "data-operation-mode",
        "zapIn"
      );
    });

    it("uses provided operation mode", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
          operationMode="zapOut"
        />
      );

      expect(screen.getByTestId("action-button")).toHaveAttribute(
        "data-operation-mode",
        "zapOut"
      );
      expect(screen.getByTestId("action-button")).toHaveTextContent("ZapOut");
    });

    it("handles optimize operation mode", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
          operationMode="optimize"
        />
      );

      expect(screen.getByTestId("action-button")).toHaveAttribute(
        "data-operation-mode",
        "optimize"
      );
      expect(screen.getByTestId("action-button")).toHaveTextContent("Optimize");
    });
  });

  describe("Swap Controls", () => {
    it("does not render swap controls by default", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.queryByText("Quick Action")).not.toBeInTheDocument();
    });

    it("renders swap controls when provided", () => {
      const swapControls = (
        <div data-testid="custom-swap-controls">Custom Swap UI</div>
      );

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
          swapControls={swapControls}
        />
      );

      expect(screen.getByText("Quick Action")).toBeInTheDocument();
      expect(screen.getByTestId("custom-swap-controls")).toBeInTheDocument();
    });
  });

  describe("Rebalance Mode", () => {
    const rebalanceMode: RebalanceMode = {
      isEnabled: true,
      data: {
        current: mockCategories,
        target: mockCategories,
        shifts: [],
        totalRebalanceValue: 5000,
      },
    };

    beforeEach(() => {
      (usePortfolioAllocationViewModel as any).mockReturnValue({
        ...mockViewModelReturn,
        isRebalanceEnabled: true,
        rebalanceShiftMap: new Map(),
        rebalanceTargetMap: new Map(),
      });
    });

    it("renders rebalance mode when enabled", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          rebalanceMode={rebalanceMode}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.getByTestId("portfolio-charts")).toHaveAttribute(
        "data-rebalance-mode",
        "true"
      );
      expect(screen.getByTestId("rebalance-summary")).toBeInTheDocument();
    });

    it("does not render rebalance summary when no rebalance data", () => {
      const rebalanceModeWithoutData: RebalanceMode = {
        isEnabled: true,
        data: undefined,
      };

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          rebalanceMode={rebalanceModeWithoutData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.queryByTestId("rebalance-summary")).not.toBeInTheDocument();
    });

    it("uses target chart data in rebalance mode", () => {
      (usePortfolioAllocationViewModel as any).mockReturnValue({
        ...mockViewModelReturn,
        isRebalanceEnabled: true,
        targetChartData: mockTargetChartData,
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

      expect(screen.getByTestId("target-chart-data-count")).toHaveTextContent(
        "2"
      );
    });
  });

  describe("User Interactions", () => {
    it("calls onZapAction when action button is clicked", async () => {
      const mockOnZapAction = vi.fn();

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
          onZapAction={mockOnZapAction}
        />
      );

      fireEvent.click(screen.getByTestId("action-button"));

      await waitFor(() => {
        expect(mockOnZapAction).toHaveBeenCalledTimes(1);
      });
    });

    it("calls onToggleCategoryExclusion when category toggle is clicked", async () => {
      const mockOnToggle = vi.fn();

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={mockOnToggle}
        />
      );

      fireEvent.click(screen.getByTestId("toggle-growth"));

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith("growth");
      });
    });

    it("calls onToggleCategoryExclusion from excluded chips", async () => {
      const mockOnToggle = vi.fn();

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["yield"]}
          onToggleCategoryExclusion={mockOnToggle}
        />
      );

      fireEvent.click(screen.getByTestId("chip-yield"));

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith("yield");
      });
    });
  });

  describe("Category Management", () => {
    it("renders all categories in category list", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.getByTestId("category-growth")).toBeInTheDocument();
      expect(screen.getByTestId("category-yield")).toBeInTheDocument();
      expect(screen.getByText("Growth")).toBeInTheDocument();
      expect(screen.getByText("Yield")).toBeInTheDocument();
    });

    it("renders excluded categories chips", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["yield"]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(
        screen.getByTestId("excluded-categories-chips")
      ).toBeInTheDocument();
      expect(screen.getByText("Yield (Excluded)")).toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("calls usePortfolioAllocationViewModel with correct parameters", () => {
      const onToggle = vi.fn();

      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={["yield"]}
          onToggleCategoryExclusion={onToggle}
          rebalanceMode={{ isEnabled: true }}
        />
      );

      expect(usePortfolioAllocationViewModel).toHaveBeenCalledWith({
        processedCategories: mockCategories,
        rebalanceMode: { isEnabled: true },
        excludedCategoryIds: ["yield"],
        chartData: mockChartData,
      });
    });

    it("handles undefined rebalanceMode", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(usePortfolioAllocationViewModel).toHaveBeenCalledWith({
        processedCategories: mockCategories,
        rebalanceMode: undefined,
        excludedCategoryIds: [],
        chartData: mockChartData,
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty categories array", () => {
      (usePortfolioAllocationViewModel as any).mockReturnValue({
        ...mockViewModelReturn,
        includedCategories: [],
        excludedCategories: [],
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
    });

    it("handles empty chart data", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={[]}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      expect(screen.getByTestId("chart-data-count")).toHaveTextContent("0");
    });

    it("handles missing onZapAction callback", () => {
      render(
        <EnhancedOverview
          processedCategories={mockCategories}
          chartData={mockChartData}
          excludedCategoryIds={[]}
          onToggleCategoryExclusion={vi.fn()}
        />
      );

      // Should not throw when clicking action button without onZapAction
      expect(() => {
        fireEvent.click(screen.getByTestId("action-button"));
      }).not.toThrow();
    });
  });
});
