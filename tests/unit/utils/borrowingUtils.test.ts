import { describe, expect, it } from "vitest";
import type { AssetCategory, PieChartData } from "../../../src/types/portfolio";
import {
  separateAssetsAndBorrowing,
  separatePositionsAndBorrowing,
  transformForDisplay,
  validatePieChartWeights,
} from "../../../src/utils/borrowingUtils";

describe("borrowingUtils", () => {
  const mockAssetCategories: AssetCategory[] = [
    {
      id: "stablecoin",
      name: "Stablecoin",
      color: "#22c55e",
      totalValue: 5000,
      percentage: 50,
      change24h: 1.2,
      assets: [],
    },
    {
      id: "defi",
      name: "DeFi",
      color: "#8b5cf6",
      totalValue: 3000,
      percentage: 30,
      change24h: -2.1,
      assets: [],
    },
    {
      id: "borrowed-eth",
      name: "ETH Borrowed",
      color: "#ef4444",
      totalValue: -2000, // Negative value = borrowed
      percentage: -20,
      change24h: 0,
      assets: [],
    },
  ];

  describe("separateAssetsAndBorrowing", () => {
    it("should separate positive and negative value categories", () => {
      const result = separateAssetsAndBorrowing(mockAssetCategories);

      expect(result.assets).toHaveLength(2);
      expect(result.borrowing).toHaveLength(1);
      expect(result.totalAssets).toBe(8000); // 5000 + 3000
      expect(result.totalBorrowing).toBe(2000); // abs(-2000)
      expect(result.netValue).toBe(6000); // 8000 - 2000
    });

    it("should recalculate percentages for assets based on total assets", () => {
      const result = separateAssetsAndBorrowing(mockAssetCategories);

      expect(result.assets[0].percentage).toBe(62.5); // 5000/8000 * 100
      expect(result.assets[1].percentage).toBe(37.5); // 3000/8000 * 100
    });

    it("should make borrowing values positive for display", () => {
      const result = separateAssetsAndBorrowing(mockAssetCategories);

      expect(result.borrowing[0].totalValue).toBe(2000); // Made positive
      expect(result.borrowing[0].percentage).toBe(100); // 100% of borrowing (2000/2000)
    });

    it("should calculate borrowing percentages based on total borrowing", () => {
      const categoriesWithMultipleBorrowings: AssetCategory[] = [
        ...mockAssetCategories,
        {
          id: "borrowed-btc",
          name: "BTC Borrowed",
          color: "#f97316",
          totalValue: -1000, // Another borrowed asset
          percentage: -10,
          change24h: 0,
          assets: [],
        },
      ];

      const result = separateAssetsAndBorrowing(
        categoriesWithMultipleBorrowings
      );

      expect(result.totalBorrowing).toBe(3000); // 2000 + 1000
      expect(result.borrowing[0].percentage).toBeCloseTo(66.67, 2); // 2000/3000 * 100
      expect(result.borrowing[1].percentage).toBeCloseTo(33.33, 2); // 1000/3000 * 100
    });
  });

  describe("transformForDisplay", () => {
    it("should create proper borrowing display data", () => {
      const result = transformForDisplay(mockAssetCategories);

      expect(result.assetsPieData).toHaveLength(2);
      expect(result.borrowingItems).toHaveLength(1);
      expect(result.netValue).toBe(6000);
      expect(result.totalBorrowing).toBe(2000);
      expect(result.hasBorrowing).toBe(true);
    });

    it("should handle empty categories", () => {
      const result = transformForDisplay([]);

      expect(result.assetsPieData).toHaveLength(0);
      expect(result.borrowingItems).toHaveLength(0);
      expect(result.netValue).toBe(0);
      expect(result.totalBorrowing).toBe(0);
      expect(result.hasBorrowing).toBe(false);
    });
  });

  // Position-level borrowing tests
  const mockCategoriesWithMixedPositions: AssetCategory[] = [
    {
      id: "defi",
      name: "DeFi",
      color: "#8b5cf6",
      totalValue: 1000, // Category net value (3000 assets - 2000 borrowed)
      percentage: 50,
      change24h: -1.5,
      assets: [
        {
          name: "USDC",
          symbol: "USDC",
          protocol: "Compound",
          amount: 2000,
          value: 2000, // Positive asset
          apr: 3.5,
          type: "lending",
        },
        {
          name: "ETH",
          symbol: "ETH",
          protocol: "Aave",
          amount: 1,
          value: 1000, // Positive asset
          apr: 2.1,
          type: "lending",
        },
        {
          name: "WBTC",
          symbol: "WBTC",
          protocol: "Compound",
          amount: -0.05,
          value: -2000, // Negative position (borrowed)
          apr: 8.2,
          type: "borrowing",
        },
      ],
    },
    {
      id: "stablecoin",
      name: "Stablecoin",
      color: "#22c55e",
      totalValue: 1500,
      percentage: 75,
      change24h: 0.1,
      assets: [
        {
          name: "DAI",
          symbol: "DAI",
          protocol: "MakerDAO",
          amount: 1500,
          value: 1500, // All positive
          apr: 1.8,
          type: "lending",
        },
      ],
    },
  ];

  describe("separatePositionsAndBorrowing", () => {
    it("should extract negative positions as individual borrowing items", () => {
      const result = separatePositionsAndBorrowing(
        mockCategoriesWithMixedPositions
      );

      expect(result.assetsForDisplay).toHaveLength(2); // Both categories have positive positions
      expect(result.borrowingPositions).toHaveLength(1); // One borrowed position
      expect(result.totalAssets).toBe(4500); // 2000 + 1000 + 1500
      expect(result.totalBorrowing).toBe(2000); // abs(-2000)
      expect(result.netValue).toBe(2500); // 4500 - 2000
      expect(result.hasBorrowing).toBe(true);
    });

    it("should recalculate category values after removing borrowed positions", () => {
      const result = separatePositionsAndBorrowing(
        mockCategoriesWithMixedPositions
      );

      const defiCategory = result.assetsForDisplay.find(
        cat => cat.id === "defi"
      );
      expect(defiCategory?.totalValue).toBe(3000); // Only positive positions: 2000 + 1000
      expect(defiCategory?.assets).toHaveLength(2); // Only USDC and ETH
      expect(defiCategory?.percentage).toBeCloseTo(66.67, 2); // 3000/4500 * 100, rounded to 2 decimals
    });

    it("should make borrowing position values positive for display", () => {
      const result = separatePositionsAndBorrowing(
        mockCategoriesWithMixedPositions
      );

      const borrowedPosition = result.borrowingPositions[0];
      expect(borrowedPosition.value).toBe(2000); // Made positive from -2000
      expect(borrowedPosition.amount).toBe(0.05); // Made positive from -0.05
      expect(borrowedPosition.symbol).toBe("WBTC");
    });

    it("should handle categories with only positive positions", () => {
      const positiveOnlyCategories: AssetCategory[] = [
        {
          id: "test",
          name: "Test",
          color: "#000000",
          totalValue: 1000,
          percentage: 100,
          change24h: 0,
          assets: [
            {
              name: "ETH",
              symbol: "ETH",
              protocol: "Test",
              amount: 1,
              value: 1000,
              apr: 0,
              type: "lending",
            },
          ],
        },
      ];

      const result = separatePositionsAndBorrowing(positiveOnlyCategories);
      expect(result.borrowingPositions).toHaveLength(0);
      expect(result.hasBorrowing).toBe(false);
      expect(result.assetsForDisplay).toHaveLength(1);
    });

    it("should exclude categories that have no positive positions", () => {
      const borrowingOnlyCategories: AssetCategory[] = [
        {
          id: "borrowed",
          name: "Borrowed Only",
          color: "#ff0000",
          totalValue: -1000,
          percentage: -100,
          change24h: 0,
          assets: [
            {
              name: "ETH",
              symbol: "ETH",
              protocol: "Aave",
              amount: -1,
              value: -1000,
              apr: 5.0,
              type: "borrowing",
            },
          ],
        },
      ];

      const result = separatePositionsAndBorrowing(borrowingOnlyCategories);
      expect(result.assetsForDisplay).toHaveLength(0); // No categories with positive positions
      expect(result.borrowingPositions).toHaveLength(1); // One borrowed position
    });
  });

  describe("validatePieChartWeights", () => {
    const validPieData: PieChartData[] = [
      { label: "ETH", value: 5000, percentage: 50, color: "#627eea" },
      { label: "BTC", value: 3000, percentage: 30, color: "#f7931a" },
      { label: "USDC", value: 2000, percentage: 20, color: "#2775ca" },
    ];

    it("should validate correct pie chart data", () => {
      const result = validatePieChartWeights(validPieData);

      expect(result.isValid).toBe(true);
      expect(result.totalPercentage).toBe(100);
      expect(result.totalValue).toBe(10000);
      expect(result.issues).toHaveLength(0);
    });

    it("should detect incorrect percentage totals", () => {
      const invalidPercentageData: PieChartData[] = [
        { label: "ETH", value: 5000, percentage: 60, color: "#627eea" }, // Wrong percentage
        { label: "BTC", value: 3000, percentage: 30, color: "#f7931a" },
        { label: "USDC", value: 2000, percentage: 20, color: "#2775ca" },
      ];

      const result = validatePieChartWeights(invalidPercentageData);

      expect(result.isValid).toBe(false);
      expect(result.totalPercentage).toBe(110);
      expect(
        result.issues.some(issue => issue.includes("don't add up to 100%"))
      ).toBe(true);
    });

    it("should detect negative values", () => {
      const negativeValueData: PieChartData[] = [
        { label: "ETH", value: -1000, percentage: -10, color: "#627eea" },
        { label: "BTC", value: 3000, percentage: 30, color: "#f7931a" },
      ];

      const result = validatePieChartWeights(negativeValueData);

      expect(result.isValid).toBe(false);
      expect(
        result.issues.some(issue => issue.includes("Negative value found"))
      ).toBe(true);
      expect(
        result.issues.some(issue => issue.includes("Negative percentage found"))
      ).toBe(true);
    });

    it("should detect missing colors", () => {
      const missingColorData: PieChartData[] = [
        { label: "ETH", value: 5000, percentage: 50, color: "" },
        { label: "BTC", value: 5000, percentage: 50, color: "#f7931a" },
      ];

      const result = validatePieChartWeights(missingColorData);

      expect(result.isValid).toBe(false);
      expect(
        result.issues.some(issue => issue.includes("Missing color for: ETH"))
      ).toBe(true);
    });

    it("should handle empty data", () => {
      const result = validatePieChartWeights([]);

      expect(result.isValid).toBe(false);
      expect(result.totalPercentage).toBe(0);
      expect(result.totalValue).toBe(0);
    });
  });

  describe("New API structure compatibility", () => {
    // Test the borrowing utilities work correctly with the new separated API structure
    const mockSeparatedAssetCategories: AssetCategory[] = [
      {
        id: "stablecoin",
        name: "Stablecoin",
        color: "#22c55e",
        totalValue: 5000,
        percentage: 62.5,
        change24h: 1.2,
        assets: [
          {
            name: "USDC",
            symbol: "USDC",
            protocol: "Compound",
            amount: 5000,
            value: 5000,
            apr: 3.5,
            type: "lending",
          },
        ],
      },
      {
        id: "defi",
        name: "DeFi",
        color: "#8b5cf6",
        totalValue: 3000,
        percentage: 37.5,
        change24h: -2.1,
        assets: [
          {
            name: "ETH",
            symbol: "ETH",
            protocol: "Aave",
            amount: 1,
            value: 3000,
            apr: 2.1,
            type: "lending",
          },
        ],
      },
    ];

    const mockSeparatedBorrowingCategories: AssetCategory[] = [
      {
        id: "borrowed-eth",
        name: "ETH Borrowed",
        color: "#ef4444",
        totalValue: -2000, // Marked as negative for internal processing
        percentage: 100,
        change24h: 0,
        assets: [
          {
            name: "ETH",
            symbol: "ETH",
            protocol: "Aave",
            amount: 0.5, // Keep amount positive for display
            value: -2000, // Negative for borrowing
            apr: 8.2,
            type: "borrowing",
          },
        ],
      },
    ];

    it("should handle pre-separated assets correctly", () => {
      const combinedCategories = [
        ...mockSeparatedAssetCategories,
        ...mockSeparatedBorrowingCategories,
      ];

      const result = separateAssetsAndBorrowing(combinedCategories);

      expect(result.assets).toHaveLength(2);
      expect(result.borrowing).toHaveLength(1);
      expect(result.totalAssets).toBe(8000);
      expect(result.totalBorrowing).toBe(2000);
      expect(result.netValue).toBe(6000);
    });

    it("should create valid pie chart data from pre-separated data", () => {
      const combinedCategories = [
        ...mockSeparatedAssetCategories,
        ...mockSeparatedBorrowingCategories,
      ];

      const result = transformForDisplay(combinedCategories);

      // Pie chart should only show assets (positive values)
      expect(result.assetsPieData).toHaveLength(2);
      expect(result.assetsPieData.every(item => item.value > 0)).toBe(true);
      expect(result.assetsPieData.every(item => item.percentage > 0)).toBe(
        true
      );

      // Validate the pie chart data
      const validation = validatePieChartWeights(result.assetsPieData);
      expect(validation.isValid).toBe(true);
    });
  });
});
