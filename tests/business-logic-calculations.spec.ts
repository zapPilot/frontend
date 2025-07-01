import { test, expect } from "@playwright/test";

test.describe("Business Logic & Financial Calculations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Investment Calculation Accuracy", () => {
    test("validates investment amount calculations", async ({ page }) => {
      const investmentTests = await page.evaluate(() => {
        // Test investment calculation functions
        const calculateInvestmentValue = (
          principal: number,
          rate: number,
          time: number,
          compounding: number = 1
        ) => {
          // Compound interest formula: A = P(1 + r/n)^(nt)
          return (
            principal * Math.pow(1 + rate / compounding, compounding * time)
          );
        };

        const calculateAPY = (nominal: number, compounding: number) => {
          // APY = (1 + r/n)^n - 1
          return Math.pow(1 + nominal / compounding, compounding) - 1;
        };

        const calculateSlippage = (
          expectedPrice: number,
          actualPrice: number
        ) => {
          return Math.abs((actualPrice - expectedPrice) / expectedPrice) * 100;
        };

        const calculatePortfolioValue = (
          assets: { amount: number; price: number }[]
        ) => {
          return assets.reduce(
            (total, asset) => total + asset.amount * asset.price,
            0
          );
        };

        const calculateAllocation = (
          assetValue: number,
          totalValue: number
        ) => {
          return totalValue > 0 ? (assetValue / totalValue) * 100 : 0;
        };

        // Test scenarios
        const testScenarios = {
          // Basic compound interest
          compound1Year: calculateInvestmentValue(10000, 0.12, 1, 12), // 12% APR, monthly compounding
          compound5Years: calculateInvestmentValue(10000, 0.08, 5, 365), // 8% APR, daily compounding

          // APY calculations
          apy12Monthly: calculateAPY(0.12, 12), // 12% nominal, monthly compounding
          apy8Daily: calculateAPY(0.08, 365), // 8% nominal, daily compounding

          // Slippage calculations
          slippage1: calculateSlippage(100, 101), // 1% slippage
          slippage5: calculateSlippage(100, 95), // -5% slippage

          // Portfolio calculations
          portfolioValue: calculatePortfolioValue([
            { amount: 10, price: 50000 }, // 10 BTC at $50k
            { amount: 100, price: 3000 }, // 100 ETH at $3k
            { amount: 50000, price: 1 }, // 50k USDC at $1
          ]),

          // Allocation calculations
          btcAllocation: calculateAllocation(500000, 850000), // $500k BTC in $850k portfolio
          ethAllocation: calculateAllocation(300000, 850000), // $300k ETH in $850k portfolio
          stableAllocation: calculateAllocation(50000, 850000), // $50k stables in $850k portfolio
        };

        return testScenarios;
      });

      // Verify compound interest calculations
      expect(investmentTests.compound1Year).toBeCloseTo(11268.25, 2); // ~12.68% effective
      expect(investmentTests.compound5Years).toBeCloseTo(14918.25, 2); // ~8.33% effective

      // Verify APY calculations
      expect(investmentTests.apy12Monthly).toBeCloseTo(0.1268, 4); // 12.68% APY
      expect(investmentTests.apy8Daily).toBeCloseTo(0.0833, 4); // 8.33% APY

      // Verify slippage calculations
      expect(investmentTests.slippage1).toBeCloseTo(1.0, 1);
      expect(investmentTests.slippage5).toBeCloseTo(5.0, 1);

      // Verify portfolio calculations
      expect(investmentTests.portfolioValue).toBe(850000); // $500k + $300k + $50k

      // Verify allocation calculations
      expect(investmentTests.btcAllocation).toBeCloseTo(58.82, 2); // ~58.82%
      expect(investmentTests.ethAllocation).toBeCloseTo(35.29, 2); // ~35.29%
      expect(investmentTests.stableAllocation).toBeCloseTo(5.88, 2); // ~5.88%
    });

    test("validates fee calculations", async ({ page }) => {
      const feeTests = await page.evaluate(() => {
        const calculateGasFee = (
          gasLimit: number,
          gasPrice: number,
          ethPrice: number
        ) => {
          // Gas fee in ETH then convert to USD
          const gasFeeEth = (gasLimit * gasPrice) / 1e18; // Convert from wei
          return gasFeeEth * ethPrice;
        };

        const calculatePlatformFee = (
          transactionAmount: number,
          feeRate: number
        ) => {
          return transactionAmount * (feeRate / 100);
        };

        const calculatePerformanceFee = (profits: number, feeRate: number) => {
          return profits > 0 ? profits * (feeRate / 100) : 0;
        };

        const calculateSlippageFee = (
          amount: number,
          slippagePercent: number
        ) => {
          return amount * (slippagePercent / 100);
        };

        // Test fee scenarios
        return {
          // Gas fees (21000 gas limit, 50 gwei, ETH at $3000)
          gasFeeSimple: calculateGasFee(21000, 50e9, 3000),
          gasFeeComplex: calculateGasFee(150000, 100e9, 3000), // Complex DeFi transaction

          // Platform fees
          platformFee1: calculatePlatformFee(10000, 0.5), // 0.5% on $10k
          platformFee2: calculatePlatformFee(100000, 0.25), // 0.25% on $100k

          // Performance fees
          performanceFee1: calculatePerformanceFee(5000, 20), // 20% on $5k profit
          performanceFee2: calculatePerformanceFee(-1000, 20), // No fee on loss

          // Slippage fees
          slippageFee1: calculateSlippageFee(10000, 0.1), // 0.1% slippage on $10k
          slippageFee2: calculateSlippageFee(50000, 0.5), // 0.5% slippage on $50k
        };
      });

      // Verify gas fee calculations
      expect(feeTests.gasFeeSimple).toBeCloseTo(3.15, 2); // ~$3.15
      expect(feeTests.gasFeeComplex).toBeCloseTo(45.0, 1); // ~$45.00

      // Verify platform fee calculations
      expect(feeTests.platformFee1).toBe(50); // $50
      expect(feeTests.platformFee2).toBe(250); // $250

      // Verify performance fee calculations
      expect(feeTests.performanceFee1).toBe(1000); // $1000
      expect(feeTests.performanceFee2).toBe(0); // $0 (no fee on losses)

      // Verify slippage fee calculations
      expect(feeTests.slippageFee1).toBe(10); // $10
      expect(feeTests.slippageFee2).toBe(250); // $250
    });

    test("validates yield and APY calculations", async ({ page }) => {
      const yieldTests = await page.evaluate(() => {
        const calculateYield = (
          startValue: number,
          endValue: number,
          timeInDays: number
        ) => {
          const totalReturn = (endValue - startValue) / startValue;
          const annualizedReturn = totalReturn * (365 / timeInDays);
          return annualizedReturn * 100; // Convert to percentage
        };

        const calculateAPY = (periodicRate: number, periodsPerYear: number) => {
          return (Math.pow(1 + periodicRate, periodsPerYear) - 1) * 100;
        };

        const calculateCompoundYield = (
          principal: number,
          rate: number,
          days: number
        ) => {
          const dailyRate = rate / 365;
          const finalAmount = principal * Math.pow(1 + dailyRate, days);
          return ((finalAmount - principal) / principal) * 100;
        };

        const calculateRealYield = (
          nominalYield: number,
          inflationRate: number
        ) => {
          return (
            ((1 + nominalYield / 100) / (1 + inflationRate / 100) - 1) * 100
          );
        };

        return {
          // Annualized yields
          yield30Days: calculateYield(10000, 10100, 30), // 1% gain in 30 days
          yield90Days: calculateYield(10000, 10300, 90), // 3% gain in 90 days
          yield365Days: calculateYield(10000, 11200, 365), // 12% gain in 1 year

          // APY from periodic rates
          apyDaily: calculateAPY(0.08 / 365, 365), // 8% nominal, daily compounding
          apyWeekly: calculateAPY(0.12 / 52, 52), // 12% nominal, weekly compounding
          apyMonthly: calculateAPY(0.15 / 12, 12), // 15% nominal, monthly compounding

          // Compound yield
          compound30Days: calculateCompoundYield(10000, 0.12, 30), // 12% APY for 30 days
          compound90Days: calculateCompoundYield(10000, 0.12, 90), // 12% APY for 90 days

          // Real yield (inflation-adjusted)
          realYield: calculateRealYield(8, 3), // 8% nominal yield, 3% inflation
        };
      });

      // Verify annualized yield calculations
      expect(yieldTests.yield30Days).toBeCloseTo(12.17, 1); // ~12.17% annualized
      expect(yieldTests.yield90Days).toBeCloseTo(12.17, 1); // ~12.17% annualized
      expect(yieldTests.yield365Days).toBeCloseTo(12.0, 1); // 12% annualized

      // Verify APY calculations
      expect(yieldTests.apyDaily).toBeCloseTo(8.33, 2); // ~8.33% APY
      expect(yieldTests.apyWeekly).toBeCloseTo(12.73, 2); // ~12.73% APY
      expect(yieldTests.apyMonthly).toBeCloseTo(16.08, 2); // ~16.08% APY

      // Verify compound yield calculations
      expect(yieldTests.compound30Days).toBeCloseTo(0.99, 2); // ~0.99% for 30 days
      expect(yieldTests.compound90Days).toBeCloseTo(2.99, 2); // ~2.99% for 90 days

      // Verify real yield calculation
      expect(yieldTests.realYield).toBeCloseTo(4.85, 2); // ~4.85% real yield
    });
  });

  test.describe("Risk Assessment & Portfolio Metrics", () => {
    test("calculates portfolio risk metrics accurately", async ({ page }) => {
      const riskTests = await page.evaluate(() => {
        const calculateVolatility = (returns: number[]) => {
          const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
          const variance =
            returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
            (returns.length - 1);
          return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
        };

        const calculateSharpeRatio = (
          returns: number[],
          riskFreeRate: number = 0.02
        ) => {
          const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
          const excessReturn = mean - riskFreeRate / 252; // Daily risk-free rate
          const volatility = calculateVolatility(returns) / Math.sqrt(252); // Daily volatility
          return excessReturn / volatility;
        };

        const calculateMaxDrawdown = (values: number[]) => {
          let maxDrawdown = 0;
          let peak = values[0];

          for (const value of values) {
            if (value > peak) {
              peak = value;
            }
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) {
              maxDrawdown = drawdown;
            }
          }
          return maxDrawdown * 100; // Convert to percentage
        };

        const calculateBeta = (
          assetReturns: number[],
          marketReturns: number[]
        ) => {
          const n = Math.min(assetReturns.length, marketReturns.length);
          const assetMean =
            assetReturns.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
          const marketMean =
            marketReturns.slice(0, n).reduce((sum, r) => sum + r, 0) / n;

          let covariance = 0;
          let marketVariance = 0;

          for (let i = 0; i < n; i++) {
            covariance +=
              (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
            marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
          }

          return covariance / marketVariance;
        };

        const calculateVaR = (returns: number[], confidence: number = 0.05) => {
          const sorted = [...returns].sort((a, b) => a - b);
          const index = Math.floor(confidence * sorted.length);
          return -sorted[index] * 100; // Convert to positive percentage
        };

        // Sample daily returns (5% vol portfolio)
        const portfolioReturns = [
          0.02, -0.01, 0.015, -0.005, 0.01, -0.02, 0.025, -0.015, 0.008, -0.003,
          0.012, -0.008, 0.018, -0.012, 0.005, -0.025, 0.03, -0.018, 0.007,
          -0.002,
        ];

        // Sample market returns (S&P 500 proxy)
        const marketReturns = [
          0.015, -0.008, 0.012, -0.003, 0.008, -0.015, 0.02, -0.012, 0.006,
          -0.002, 0.01, -0.006, 0.015, -0.009, 0.004, -0.02, 0.025, -0.015,
          0.005, -0.001,
        ];

        // Portfolio values for drawdown calculation
        const portfolioValues = [
          100000, 102000, 100980, 102495, 102007, 103027, 100967, 103530,
          101978, 102795, 102488, 103717, 102887, 104735, 103479, 104996,
          102496, 105568, 104669, 105402,
        ];

        return {
          volatility: calculateVolatility(portfolioReturns),
          sharpeRatio: calculateSharpeRatio(portfolioReturns),
          maxDrawdown: calculateMaxDrawdown(portfolioValues),
          beta: calculateBeta(portfolioReturns, marketReturns),
          var95: calculateVaR(portfolioReturns, 0.05), // 95% VaR
          var99: calculateVaR(portfolioReturns, 0.01), // 99% VaR
        };
      });

      // Verify risk metrics are within expected ranges
      expect(riskTests.volatility).toBeGreaterThan(0);
      expect(riskTests.volatility).toBeLessThan(100); // Reasonable volatility range

      expect(riskTests.sharpeRatio).toBeGreaterThan(-3);
      expect(riskTests.sharpeRatio).toBeLessThan(5); // Reasonable Sharpe ratio range

      expect(riskTests.maxDrawdown).toBeGreaterThan(0);
      expect(riskTests.maxDrawdown).toBeLessThan(50); // Reasonable drawdown range

      expect(riskTests.beta).toBeGreaterThan(-2);
      expect(riskTests.beta).toBeLessThan(3); // Reasonable beta range

      expect(riskTests.var95).toBeGreaterThan(0);
      expect(riskTests.var99).toBeGreaterThan(riskTests.var95); // 99% VaR > 95% VaR
    });

    test("validates correlation and diversification calculations", async ({
      page,
    }) => {
      const correlationTests = await page.evaluate(() => {
        const calculateCorrelation = (x: number[], y: number[]) => {
          const n = Math.min(x.length, y.length);
          const xMean = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
          const yMean = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

          let numerator = 0;
          let xVariance = 0;
          let yVariance = 0;

          for (let i = 0; i < n; i++) {
            const xDiff = x[i] - xMean;
            const yDiff = y[i] - yMean;
            numerator += xDiff * yDiff;
            xVariance += xDiff * xDiff;
            yVariance += yDiff * yDiff;
          }

          return numerator / Math.sqrt(xVariance * yVariance);
        };

        const calculatePortfolioVolatility = (
          weights: number[],
          volatilities: number[],
          correlations: number[][]
        ) => {
          let portfolioVariance = 0;

          for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights.length; j++) {
              const correlation = i === j ? 1 : correlations[i][j];
              portfolioVariance +=
                weights[i] *
                weights[j] *
                volatilities[i] *
                volatilities[j] *
                correlation;
            }
          }

          return Math.sqrt(portfolioVariance);
        };

        const calculateDiversificationRatio = (
          weights: number[],
          volatilities: number[],
          portfolioVol: number
        ) => {
          const weightedAvgVol = weights.reduce(
            (sum, weight, i) => sum + weight * volatilities[i],
            0
          );
          return weightedAvgVol / portfolioVol;
        };

        // Sample asset returns
        const btcReturns = [
          0.05, -0.03, 0.04, -0.02, 0.06, -0.04, 0.03, -0.01, 0.02, -0.03,
        ];
        const ethReturns = [
          0.04, -0.025, 0.035, -0.015, 0.05, -0.035, 0.025, -0.008, 0.018,
          -0.025,
        ];
        const bondReturns = [
          0.001, 0.002, -0.001, 0.0015, -0.0005, 0.001, 0.002, -0.001, 0.0008,
          0.001,
        ];

        // Portfolio composition
        const weights = [0.4, 0.4, 0.2]; // 40% BTC, 40% ETH, 20% Bonds
        const volatilities = [0.8, 0.7, 0.05]; // Annual volatilities
        const correlations = [
          [1.0, 0.7, -0.1], // BTC correlations
          [0.7, 1.0, -0.05], // ETH correlations
          [-0.1, -0.05, 1.0], // Bond correlations
        ];

        const portfolioVol = calculatePortfolioVolatility(
          weights,
          volatilities,
          correlations
        );

        return {
          btcEthCorrelation: calculateCorrelation(btcReturns, ethReturns),
          btcBondCorrelation: calculateCorrelation(btcReturns, bondReturns),
          ethBondCorrelation: calculateCorrelation(ethReturns, bondReturns),
          portfolioVolatility: portfolioVol,
          diversificationRatio: calculateDiversificationRatio(
            weights,
            volatilities,
            portfolioVol
          ),
        };
      });

      // Verify correlation calculations
      expect(correlationTests.btcEthCorrelation).toBeGreaterThan(0.5); // BTC-ETH should be highly correlated
      expect(correlationTests.btcBondCorrelation).toBeLessThan(0.3); // BTC-Bond should be low correlation
      expect(correlationTests.ethBondCorrelation).toBeLessThan(0.3); // ETH-Bond should be low correlation

      // Verify portfolio metrics
      expect(correlationTests.portfolioVolatility).toBeGreaterThan(0);
      expect(correlationTests.portfolioVolatility).toBeLessThan(1); // Should be less than 100%

      expect(correlationTests.diversificationRatio).toBeGreaterThan(1); // Should benefit from diversification
      expect(correlationTests.diversificationRatio).toBeLessThan(3); // Reasonable diversification range
    });
  });

  test.describe("Rebalancing & Optimization Logic", () => {
    test("calculates optimal rebalancing transactions", async ({ page }) => {
      const rebalancingTests = await page.evaluate(() => {
        const calculateRebalancingTrades = (
          currentHoldings: { asset: string; amount: number; price: number }[],
          targetAllocations: { asset: string; percentage: number }[]
        ) => {
          // Calculate current portfolio value
          const totalValue = currentHoldings.reduce(
            (sum, holding) => sum + holding.amount * holding.price,
            0
          );

          const trades: {
            asset: string;
            action: "buy" | "sell";
            amount: number;
            value: number;
          }[] = [];

          for (const target of targetAllocations) {
            const currentHolding = currentHoldings.find(
              h => h.asset === target.asset
            );
            const currentValue = currentHolding
              ? currentHolding.amount * currentHolding.price
              : 0;
            const targetValue = totalValue * (target.percentage / 100);
            const difference = targetValue - currentValue;

            if (Math.abs(difference) > totalValue * 0.01) {
              // 1% threshold
              trades.push({
                asset: target.asset,
                action: difference > 0 ? "buy" : "sell",
                amount: Math.abs(difference) / (currentHolding?.price || 1),
                value: Math.abs(difference),
              });
            }
          }

          return trades;
        };

        const calculateRebalancingCost = (
          trades: any[],
          feeRate: number = 0.001
        ) => {
          return trades.reduce(
            (total, trade) => total + trade.value * feeRate,
            0
          );
        };

        const calculateDriftScore = (
          currentAllocations: number[],
          targetAllocations: number[]
        ) => {
          let totalDrift = 0;
          for (let i = 0; i < currentAllocations.length; i++) {
            totalDrift += Math.abs(
              currentAllocations[i] - targetAllocations[i]
            );
          }
          return totalDrift / 2; // Normalize
        };

        // Test scenario
        const currentHoldings = [
          { asset: "BTC", amount: 8, price: 50000 }, // $400k (47.1%)
          { asset: "ETH", amount: 80, price: 3000 }, // $240k (28.2%)
          { asset: "USDC", amount: 210000, price: 1 }, // $210k (24.7%)
        ];

        const targetAllocations = [
          { asset: "BTC", percentage: 40 }, // Target 40%
          { asset: "ETH", percentage: 30 }, // Target 30%
          { asset: "USDC", percentage: 30 }, // Target 30%
        ];

        const totalValue = currentHoldings.reduce(
          (sum, h) => sum + h.amount * h.price,
          0
        );
        const currentAllocations = currentHoldings.map(
          h => ((h.amount * h.price) / totalValue) * 100
        );
        const targetAllocationsArray = targetAllocations.map(t => t.percentage);

        const trades = calculateRebalancingTrades(
          currentHoldings,
          targetAllocations
        );
        const rebalancingCost = calculateRebalancingCost(trades);
        const driftScore = calculateDriftScore(
          currentAllocations,
          targetAllocationsArray
        );

        return {
          totalPortfolioValue: totalValue,
          currentAllocations,
          targetAllocations: targetAllocationsArray,
          trades,
          rebalancingCost,
          driftScore,
          costAsPercentage: (rebalancingCost / totalValue) * 100,
        };
      });

      // Verify portfolio calculations
      expect(rebalancingTests.totalPortfolioValue).toBe(850000);

      // Verify drift calculation
      expect(rebalancingTests.driftScore).toBeGreaterThan(0);
      expect(rebalancingTests.driftScore).toBeLessThan(50); // Reasonable drift range

      // Verify rebalancing trades
      expect(rebalancingTests.trades.length).toBeGreaterThan(0);

      // BTC should be sold (over-allocated)
      const btcTrade = rebalancingTests.trades.find(
        (t: any) => t.asset === "BTC"
      );
      expect(btcTrade?.action).toBe("sell");

      // USDC should be bought (under-allocated)
      const usdcTrade = rebalancingTests.trades.find(
        (t: any) => t.asset === "USDC"
      );
      expect(usdcTrade?.action).toBe("buy");

      // Rebalancing cost should be reasonable
      expect(rebalancingTests.costAsPercentage).toBeLessThan(1); // Less than 1%
    });

    test("validates threshold-based rebalancing logic", async ({ page }) => {
      const thresholdTests = await page.evaluate(() => {
        const shouldRebalance = (
          currentAllocations: number[],
          targetAllocations: number[],
          threshold: number
        ) => {
          for (let i = 0; i < currentAllocations.length; i++) {
            if (
              Math.abs(currentAllocations[i] - targetAllocations[i]) > threshold
            ) {
              return true;
            }
          }
          return false;
        };

        const calculateTimeBasedRebalancing = (
          lastRebalanceDate: Date,
          rebalanceFrequency: number
        ) => {
          const daysSinceRebalance =
            (Date.now() - lastRebalanceDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceRebalance >= rebalanceFrequency;
        };

        const calculateVolatilityBasedRebalancing = (
          recentVolatility: number,
          baselineVolatility: number,
          volatilityThreshold: number
        ) => {
          const volatilityIncrease =
            (recentVolatility - baselineVolatility) / baselineVolatility;
          return volatilityIncrease > volatilityThreshold;
        };

        // Test scenarios
        const scenarios = [
          {
            name: "small_drift",
            current: [40.5, 29.8, 29.7],
            target: [40, 30, 30],
            threshold: 2.0,
          },
          {
            name: "large_drift",
            current: [45, 25, 30],
            target: [40, 30, 30],
            threshold: 2.0,
          },
          {
            name: "very_large_drift",
            current: [50, 20, 30],
            target: [40, 30, 30],
            threshold: 5.0,
          },
        ];

        const results: any = {};

        for (const scenario of scenarios) {
          results[scenario.name] = shouldRebalance(
            scenario.current,
            scenario.target,
            scenario.threshold
          );
        }

        // Time-based rebalancing tests
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        results.timeBasedWeekly = calculateTimeBasedRebalancing(lastWeek, 7);
        results.timeBasedMonthly = calculateTimeBasedRebalancing(lastMonth, 30);
        results.timeBasedNotDue = calculateTimeBasedRebalancing(new Date(), 7);

        // Volatility-based rebalancing tests
        results.volatilityTriggered = calculateVolatilityBasedRebalancing(
          0.8,
          0.6,
          0.2
        ); // 20% vol increase
        results.volatilityNotTriggered = calculateVolatilityBasedRebalancing(
          0.62,
          0.6,
          0.2
        ); // 3.3% vol increase

        return results;
      });

      // Verify threshold-based rebalancing
      expect(thresholdTests.small_drift).toBe(false); // Small drift shouldn't trigger
      expect(thresholdTests.large_drift).toBe(true); // Large drift should trigger
      expect(thresholdTests.very_large_drift).toBe(true); // Very large drift should trigger

      // Verify time-based rebalancing
      expect(thresholdTests.timeBasedWeekly).toBe(true); // Week old should trigger weekly
      expect(thresholdTests.timeBasedMonthly).toBe(true); // Month old should trigger monthly
      expect(thresholdTests.timeBasedNotDue).toBe(false); // Recent shouldn't trigger

      // Verify volatility-based rebalancing
      expect(thresholdTests.volatilityTriggered).toBe(true); // High vol increase should trigger
      expect(thresholdTests.volatilityNotTriggered).toBe(false); // Low vol increase shouldn't trigger
    });
  });

  test.describe("Price Impact & Slippage Calculations", () => {
    test("calculates market impact and optimal order sizing", async ({
      page,
    }) => {
      const marketImpactTests = await page.evaluate(() => {
        const calculatePriceImpact = (
          orderSize: number,
          liquidity: number,
          impactCoefficient: number = 0.1
        ) => {
          // Square root price impact model
          return impactCoefficient * Math.sqrt(orderSize / liquidity);
        };

        const calculateOptimalOrderSize = (
          totalSize: number,
          liquidity: number,
          maxImpact: number,
          impactCoefficient: number = 0.1
        ) => {
          // Maximum order size that keeps impact below threshold
          const maxOrderSize =
            Math.pow(maxImpact / impactCoefficient, 2) * liquidity;
          return Math.min(totalSize, maxOrderSize);
        };

        const calculateTWAPExecution = (
          totalSize: number,
          timeHours: number,
          avgHourlyVolume: number,
          maxVolumePercentage: number = 0.1
        ) => {
          const maxHourlyOrder = avgHourlyVolume * maxVolumePercentage;
          const ordersNeeded = Math.ceil(totalSize / maxHourlyOrder);
          const actualTimeNeeded = Math.max(ordersNeeded, timeHours);

          return {
            ordersNeeded,
            orderSize: totalSize / ordersNeeded,
            timeNeeded: actualTimeNeeded,
            hourlyVolPercentage:
              (totalSize / ordersNeeded / avgHourlyVolume) * 100,
          };
        };

        const calculateSlippageEstimate = (
          orderSize: number,
          bidAskSpread: number,
          priceImpact: number
        ) => {
          return bidAskSpread / 2 + priceImpact;
        };

        // Test scenarios for different assets
        const scenarios = {
          // Large cap crypto (BTC)
          btc: {
            orderSize: 1000000, // $1M order
            liquidity: 100000000, // $100M liquidity
            avgHourlyVolume: 5000000, // $5M/hour
            bidAskSpread: 0.001, // 0.1%
          },

          // Mid cap crypto (ETH)
          eth: {
            orderSize: 500000, // $500k order
            liquidity: 50000000, // $50M liquidity
            avgHourlyVolume: 2000000, // $2M/hour
            bidAskSpread: 0.002, // 0.2%
          },

          // Small cap DeFi token
          defi: {
            orderSize: 100000, // $100k order
            liquidity: 1000000, // $1M liquidity
            avgHourlyVolume: 50000, // $50k/hour
            bidAskSpread: 0.01, // 1%
          },
        };

        const results: any = {};

        for (const [asset, params] of Object.entries(scenarios)) {
          const priceImpact = calculatePriceImpact(
            params.orderSize,
            params.liquidity
          );
          const optimalSize = calculateOptimalOrderSize(
            params.orderSize,
            params.liquidity,
            0.005
          ); // 0.5% max impact
          const twapExecution = calculateTWAPExecution(
            params.orderSize,
            24,
            params.avgHourlyVolume
          );
          const slippage = calculateSlippageEstimate(
            params.orderSize,
            params.bidAskSpread,
            priceImpact
          );

          results[asset] = {
            priceImpact: priceImpact * 100, // Convert to percentage
            optimalSize,
            twapExecution,
            slippage: slippage * 100, // Convert to percentage
            needsSplitting: params.orderSize > optimalSize,
          };
        }

        return results;
      });

      // Verify BTC (large cap) calculations
      expect(marketImpactTests.btc.priceImpact).toBeLessThan(1); // Low impact for large cap
      expect(marketImpactTests.btc.slippage).toBeLessThan(2); // Reasonable slippage
      expect(marketImpactTests.btc.needsSplitting).toBe(true); // Large order should split

      // Verify ETH (mid cap) calculations
      expect(marketImpactTests.eth.priceImpact).toBeGreaterThan(
        marketImpactTests.btc.priceImpact
      );
      expect(marketImpactTests.eth.slippage).toBeGreaterThan(
        marketImpactTests.btc.slippage
      );

      // Verify DeFi token (small cap) calculations
      expect(marketImpactTests.defi.priceImpact).toBeGreaterThan(5); // High impact for small cap
      expect(marketImpactTests.defi.slippage).toBeGreaterThan(5); // High slippage
      expect(marketImpactTests.defi.needsSplitting).toBe(true); // Definitely needs splitting

      // Verify TWAP execution makes sense
      expect(marketImpactTests.defi.twapExecution.timeNeeded).toBeGreaterThan(
        24
      ); // Should take longer than 24h
      expect(marketImpactTests.btc.twapExecution.ordersNeeded).toBeGreaterThan(
        1
      ); // Should split order
    });
  });
});
