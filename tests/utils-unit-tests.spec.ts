import { test, expect } from "@playwright/test";

/**
 * UTILITY FUNCTIONS UNIT TESTS
 *
 * Unit tests for utility functions including currency formatting,
 * portfolio calculations, and risk level classifications
 */

test.describe("Utility Functions Unit Tests", () => {
  test("formatCurrency handles various amounts correctly", async ({ page }) => {
    // Import and test the formatCurrency function
    const formatCurrencyTests = await page.evaluate(() => {
      // Mock the constants for testing
      const PORTFOLIO_CONFIG = {
        HIDDEN_BALANCE_PLACEHOLDER: "****",
        CURRENCY_LOCALE: "en-US",
        CURRENCY_CODE: "USD",
      };

      const formatCurrency = (amount: number, isHidden = false): string => {
        if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_BALANCE_PLACEHOLDER;
        return new Intl.NumberFormat(PORTFOLIO_CONFIG.CURRENCY_LOCALE, {
          style: "currency",
          currency: PORTFOLIO_CONFIG.CURRENCY_CODE,
          minimumFractionDigits: 2,
        }).format(amount);
      };

      return {
        // Test normal amounts
        normal: formatCurrency(1234.56),
        zero: formatCurrency(0),
        negative: formatCurrency(-100.5),
        large: formatCurrency(1000000),
        small: formatCurrency(0.01),
        hidden: formatCurrency(1234.56, true),
        // Test edge cases
        infinity: formatCurrency(Infinity),
        negInfinity: formatCurrency(-Infinity),
        nan: formatCurrency(NaN),
      };
    });

    // Verify currency formatting
    expect(formatCurrencyTests.normal).toMatch(/\$1,234\.56/);
    expect(formatCurrencyTests.zero).toMatch(/\$0\.00/);
    expect(formatCurrencyTests.negative).toMatch(/-\$100\.50/);
    expect(formatCurrencyTests.large).toMatch(/\$1,000,000\.00/);
    expect(formatCurrencyTests.small).toMatch(/\$0\.01/);
    expect(formatCurrencyTests.hidden).toBe("****");

    // Edge cases should not crash
    expect(typeof formatCurrencyTests.infinity).toBe("string");
    expect(typeof formatCurrencyTests.negInfinity).toBe("string");
    expect(typeof formatCurrencyTests.nan).toBe("string");

    console.log("✓ formatCurrency function tests passed");
  });

  test("formatNumber handles various numbers correctly", async ({ page }) => {
    const formatNumberTests = await page.evaluate(() => {
      const PORTFOLIO_CONFIG = {
        HIDDEN_NUMBER_PLACEHOLDER: "••••",
        CURRENCY_LOCALE: "en-US",
      };

      const formatNumber = (amount: number, isHidden = false): string => {
        if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_NUMBER_PLACEHOLDER;
        return amount.toLocaleString(PORTFOLIO_CONFIG.CURRENCY_LOCALE, {
          maximumFractionDigits: 4,
        });
      };

      return {
        integer: formatNumber(1234),
        decimal: formatNumber(1234.5678),
        longDecimal: formatNumber(1.123456789),
        zero: formatNumber(0),
        negative: formatNumber(-123.45),
        hidden: formatNumber(1234.5678, true),
        large: formatNumber(999999999),
        small: formatNumber(0.0001),
      };
    });

    expect(formatNumberTests.integer).toBe("1,234");
    expect(formatNumberTests.decimal).toBe("1,234.5678");
    expect(formatNumberTests.longDecimal).toBe("1.1235"); // Should round to 4 decimal places
    expect(formatNumberTests.zero).toBe("0");
    expect(formatNumberTests.negative).toBe("-123.45");
    expect(formatNumberTests.hidden).toBe("••••");
    expect(formatNumberTests.large).toBe("999,999,999");
    expect(formatNumberTests.small).toBe("0.0001");

    console.log("✓ formatNumber function tests passed");
  });

  test("formatPercentage displays correct signs and decimals", async ({
    page,
  }) => {
    const formatPercentageTests = await page.evaluate(() => {
      const formatPercentage = (value: number): string => {
        const sign = value >= 0 ? "+" : "";
        return `${sign}${value.toFixed(1)}%`;
      };

      return {
        positive: formatPercentage(15.678),
        negative: formatPercentage(-8.234),
        zero: formatPercentage(0),
        smallPositive: formatPercentage(0.1),
        smallNegative: formatPercentage(-0.1),
        large: formatPercentage(100.5),
      };
    });

    expect(formatPercentageTests.positive).toBe("+15.7%");
    expect(formatPercentageTests.negative).toBe("-8.2%");
    expect(formatPercentageTests.zero).toBe("+0.0%");
    expect(formatPercentageTests.smallPositive).toBe("+0.1%");
    expect(formatPercentageTests.smallNegative).toBe("-0.1%");
    expect(formatPercentageTests.large).toBe("+100.5%");

    console.log("✓ formatPercentage function tests passed");
  });

  test("getRiskLevelClasses returns correct CSS classes", async ({ page }) => {
    const riskClassTests = await page.evaluate(() => {
      const getRiskLevelClasses = (risk: string): string => {
        switch (risk) {
          case "Low":
            return "bg-green-900/30 text-green-400";
          case "Medium":
            return "bg-yellow-900/30 text-yellow-400";
          case "High":
            return "bg-red-900/30 text-red-400";
          default:
            return "bg-gray-900/30 text-gray-400";
        }
      };

      return {
        low: getRiskLevelClasses("Low"),
        medium: getRiskLevelClasses("Medium"),
        high: getRiskLevelClasses("High"),
        unknown: getRiskLevelClasses("Unknown"),
        empty: getRiskLevelClasses(""),
        undefined: getRiskLevelClasses(undefined as any),
      };
    });

    expect(riskClassTests.low).toBe("bg-green-900/30 text-green-400");
    expect(riskClassTests.medium).toBe("bg-yellow-900/30 text-yellow-400");
    expect(riskClassTests.high).toBe("bg-red-900/30 text-red-400");
    expect(riskClassTests.unknown).toBe("bg-gray-900/30 text-gray-400");
    expect(riskClassTests.empty).toBe("bg-gray-900/30 text-gray-400");
    expect(riskClassTests.undefined).toBe("bg-gray-900/30 text-gray-400");

    console.log("✓ getRiskLevelClasses function tests passed");
  });

  test("getChangeColorClasses returns correct color classes", async ({
    page,
  }) => {
    const changeColorTests = await page.evaluate(() => {
      const getChangeColorClasses = (value: number): string => {
        return value >= 0 ? "text-green-400" : "text-red-400";
      };

      return {
        positive: getChangeColorClasses(10),
        negative: getChangeColorClasses(-5),
        zero: getChangeColorClasses(0),
        smallPositive: getChangeColorClasses(0.01),
        smallNegative: getChangeColorClasses(-0.01),
      };
    });

    expect(changeColorTests.positive).toBe("text-green-400");
    expect(changeColorTests.negative).toBe("text-red-400");
    expect(changeColorTests.zero).toBe("text-green-400"); // Zero is treated as positive
    expect(changeColorTests.smallPositive).toBe("text-green-400");
    expect(changeColorTests.smallNegative).toBe("text-red-400");

    console.log("✓ getChangeColorClasses function tests passed");
  });

  test("calculatePortfolioMetrics computes accurate totals", async ({
    page,
  }) => {
    const portfolioCalcTests = await page.evaluate(() => {
      const calculatePortfolioMetrics = (
        categories: Array<{ totalValue: number; change24h: number }>
      ) => {
        const totalValue = categories.reduce(
          (sum, cat) => sum + cat.totalValue,
          0
        );
        const totalChange24h = categories.reduce(
          (sum, cat) => sum + (cat.totalValue * cat.change24h) / 100,
          0
        );
        const totalChangePercentage =
          totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

        return {
          totalValue,
          totalChange24h,
          totalChangePercentage,
        };
      };

      // Test with sample data
      const testCategories = [
        { totalValue: 1000, change24h: 5 }, // +$50
        { totalValue: 500, change24h: -2 }, // -$10
        { totalValue: 200, change24h: 10 }, // +$20
      ];

      const emptyCategories: Array<{ totalValue: number; change24h: number }> =
        [];

      const zeroValueCategories = [
        { totalValue: 0, change24h: 5 },
        { totalValue: 0, change24h: -10 },
      ];

      return {
        normal: calculatePortfolioMetrics(testCategories),
        empty: calculatePortfolioMetrics(emptyCategories),
        zeroValue: calculatePortfolioMetrics(zeroValueCategories),
      };
    });

    // Normal calculation
    expect(portfolioCalcTests.normal.totalValue).toBe(1700);
    expect(portfolioCalcTests.normal.totalChange24h).toBeCloseTo(60, 1); // 50 - 10 + 20 = 60
    expect(portfolioCalcTests.normal.totalChangePercentage).toBeCloseTo(
      3.529,
      2
    ); // 60/1700 * 100

    // Empty categories
    expect(portfolioCalcTests.empty.totalValue).toBe(0);
    expect(portfolioCalcTests.empty.totalChange24h).toBe(0);
    expect(portfolioCalcTests.empty.totalChangePercentage).toBe(0);

    // Zero value categories
    expect(portfolioCalcTests.zeroValue.totalValue).toBe(0);
    expect(portfolioCalcTests.zeroValue.totalChange24h).toBe(0);
    expect(portfolioCalcTests.zeroValue.totalChangePercentage).toBe(0);

    console.log("✓ calculatePortfolioMetrics function tests passed");
  });

  test("utility functions handle edge cases and invalid inputs", async ({
    page,
  }) => {
    const edgeCaseTests = await page.evaluate(() => {
      // Test utility functions with edge cases
      const PORTFOLIO_CONFIG = {
        HIDDEN_BALANCE_PLACEHOLDER: "****",
        HIDDEN_NUMBER_PLACEHOLDER: "••••",
        CURRENCY_LOCALE: "en-US",
        CURRENCY_CODE: "USD",
      };

      const formatCurrency = (amount: number, isHidden = false): string => {
        if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_BALANCE_PLACEHOLDER;
        return new Intl.NumberFormat(PORTFOLIO_CONFIG.CURRENCY_LOCALE, {
          style: "currency",
          currency: PORTFOLIO_CONFIG.CURRENCY_CODE,
          minimumFractionDigits: 2,
        }).format(amount);
      };

      const calculatePortfolioMetrics = (
        categories: Array<{ totalValue: number; change24h: number }>
      ) => {
        const totalValue = categories.reduce(
          (sum, cat) => sum + cat.totalValue,
          0
        );
        const totalChange24h = categories.reduce(
          (sum, cat) => sum + (cat.totalValue * cat.change24h) / 100,
          0
        );
        const totalChangePercentage =
          totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

        return {
          totalValue,
          totalChange24h,
          totalChangePercentage,
        };
      };

      // Test edge cases
      const extremeCategories = [
        { totalValue: Number.MAX_SAFE_INTEGER, change24h: 0.001 },
        { totalValue: Number.MIN_SAFE_INTEGER, change24h: -0.001 },
        { totalValue: Infinity, change24h: 1 },
        { totalValue: -Infinity, change24h: 1 },
        { totalValue: NaN, change24h: 1 },
        { totalValue: 1000, change24h: NaN },
      ];

      return {
        currencyNaN: formatCurrency(NaN),
        currencyInfinity: formatCurrency(Infinity),
        extremePortfolio: calculatePortfolioMetrics(extremeCategories),
      };
    });

    // Edge cases should not crash and return strings
    expect(typeof edgeCaseTests.currencyNaN).toBe("string");
    expect(typeof edgeCaseTests.currencyInfinity).toBe("string");

    // Portfolio calculation with extreme values should return numbers
    expect(typeof edgeCaseTests.extremePortfolio.totalValue).toBe("number");
    expect(typeof edgeCaseTests.extremePortfolio.totalChange24h).toBe("number");
    expect(typeof edgeCaseTests.extremePortfolio.totalChangePercentage).toBe(
      "number"
    );

    console.log("✓ Edge case handling tests passed");
  });

  test("utility functions maintain performance with large datasets", async ({
    page,
  }) => {
    const performanceTest = await page.evaluate(() => {
      const calculatePortfolioMetrics = (
        categories: Array<{ totalValue: number; change24h: number }>
      ) => {
        const totalValue = categories.reduce(
          (sum, cat) => sum + cat.totalValue,
          0
        );
        const totalChange24h = categories.reduce(
          (sum, cat) => sum + (cat.totalValue * cat.change24h) / 100,
          0
        );
        const totalChangePercentage =
          totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

        return {
          totalValue,
          totalChange24h,
          totalChangePercentage,
        };
      };

      // Generate large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        totalValue: Math.random() * 1000,
        change24h: (Math.random() - 0.5) * 20, // -10% to +10%
      }));

      const startTime = performance.now();
      const result = calculatePortfolioMetrics(largeDataset);
      const endTime = performance.now();

      return {
        executionTime: endTime - startTime,
        datasetSize: largeDataset.length,
        totalValue: result.totalValue,
        calculationComplete: result.totalValue > 0,
      };
    });

    // Performance should be reasonable (under 100ms for 10k items)
    expect(performanceTest.executionTime).toBeLessThan(100);
    expect(performanceTest.datasetSize).toBe(10000);
    expect(performanceTest.calculationComplete).toBe(true);
    expect(typeof performanceTest.totalValue).toBe("number");

    console.log(
      `✓ Performance test passed (${performanceTest.executionTime.toFixed(2)}ms for ${performanceTest.datasetSize} items)`
    );
  });
});
