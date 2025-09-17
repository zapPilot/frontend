import { render, screen, within } from "../../../test-utils";
import { describe, expect, it, vi } from "vitest";
import { CategoryListSection } from "../../../../src/components/PortfolioAllocation/components/Categories/CategoryListSection";
import {
  ProcessedAssetCategory,
  RebalanceData,
} from "../../../../src/components/PortfolioAllocation/types";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/shared/ImageWithFallback", () => ({
  ImageWithFallback: ({ children, symbol }: any) => (
    <span data-testid="image-with-fallback" data-symbol={symbol}>
      {children}
    </span>
  ),
}));

const baseCategories: ProcessedAssetCategory[] = [
  {
    id: "growth",
    name: "Growth",
    color: "#ffffff",
    isExcluded: false,
    totalAllocationPercentage: 45,
    activeAllocationPercentage: 45,
    totalValue: 45000,
    description: "Growth strategies",
    enabledProtocolCount: 2,
    protocols: [],
  },
  {
    id: "yield",
    name: "Yield",
    color: "#222222",
    isExcluded: false,
    totalAllocationPercentage: 55,
    activeAllocationPercentage: 55,
    totalValue: 55000,
    description: "Yield strategies",
    enabledProtocolCount: 1,
    protocols: [],
  },
];

const createRebalanceData = (): RebalanceData => ({
  current: baseCategories,
  target: [
    {
      ...baseCategories[0],
      activeAllocationPercentage: 40,
    },
    {
      ...baseCategories[1],
      activeAllocationPercentage: 60,
    },
  ],
  shifts: [
    {
      categoryId: "yield",
      categoryName: "Yield",
      currentPercentage: 55,
      targetPercentage: 60,
      changeAmount: 5,
      changePercentage: 9.1,
      action: "increase",
      actionDescription: "Buy more",
    },
    {
      categoryId: "growth",
      categoryName: "Growth",
      currentPercentage: 45,
      targetPercentage: 40,
      changeAmount: -5,
      changePercentage: -11.1,
      action: "decrease",
      actionDescription: "Trim position",
    },
  ],
  totalRebalanceValue: 10000,
});

describe("CategoryListSection", () => {
  it("renders exclusion state without rebalance mode", () => {
    const handleToggle = vi.fn();

    render(
      <CategoryListSection
        categories={baseCategories}
        excludedCategoryIdsSet={new Set(["growth"])}
        onToggleCategoryExclusion={handleToggle}
        isRebalanceEnabled={false}
        testId="allocation-test"
      />
    );

    const excludedRow = screen.getByTestId("category-row-growth");
    expect(excludedRow).toHaveTextContent("0%");
    expect(within(excludedRow).queryByText("$45,000")).toBeNull();

    const includedRow = screen.getByTestId("category-row-yield");
    expect(includedRow).toHaveTextContent("55.0%");
    expect(within(includedRow).getByText("$55,000")).toBeInTheDocument();
  });

  it("displays rebalance data when provided", () => {
    const rebalanceData = createRebalanceData();

    render(
      <CategoryListSection
        categories={baseCategories}
        excludedCategoryIdsSet={new Set()}
        onToggleCategoryExclusion={vi.fn()}
        isRebalanceEnabled={true}
        rebalanceShiftMap={
          new Map(rebalanceData.shifts.map(shift => [shift.categoryId, shift]))
        }
        rebalanceTargetMap={
          new Map(rebalanceData.target.map(target => [target.id, target]))
        }
      />
    );

    const yieldRow = screen.getByTestId("category-row-yield");
    expect(yieldRow).toHaveTextContent("55.0%");
    expect(yieldRow).toHaveTextContent("→");
    expect(yieldRow).toHaveTextContent("60.0%");
    expect(yieldRow).toHaveTextContent("+5.0%");
    expect(yieldRow).toHaveTextContent("Buy more");

    const growthRow = screen.getByTestId("category-row-growth");
    expect(growthRow).toHaveTextContent("45.0%");
    expect(growthRow).toHaveTextContent("40.0%");
    expect(growthRow).toHaveTextContent("Trim position");
  });

  it("shows placeholder when no categories are present", () => {
    render(
      <CategoryListSection
        categories={[]}
        excludedCategoryIdsSet={new Set()}
        onToggleCategoryExclusion={vi.fn()}
      />
    );

    expect(screen.getByText("No categories available.")).toBeInTheDocument();
  });
});
