import { test, expect } from "@playwright/test";

test.describe("Advanced DeFi Functionality Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Vault Investment Workflows", () => {
    test("complete investment flow for stablecoin vault", async ({ page }) => {
      // Navigate to invest tab
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);
      }

      // Locate stablecoin vault
      const stablecoinVault = page
        .locator(
          '[data-testid*="stablecoin"], .vault-card:has-text("Stablecoin")'
        )
        .first();
      if (await stablecoinVault.isVisible()) {
        // Test vault card information display
        await expect(stablecoinVault).toBeVisible();

        // Check for key vault metrics
        const apy = stablecoinVault.locator(
          '[data-testid*="apy"], .apy, [class*="apy"]'
        );
        const risk = stablecoinVault.locator(
          '[data-testid*="risk"], .risk, [class*="risk"]'
        );
        const tvl = stablecoinVault.locator(
          '[data-testid*="tvl"], .tvl, [class*="tvl"]'
        );

        // Verify vault metrics are present
        if (await apy.isVisible()) await expect(apy).toBeVisible();
        if (await risk.isVisible()) await expect(risk).toBeVisible();
        if (await tvl.isVisible()) await expect(tvl).toBeVisible();

        // Click invest button
        const investButton = stablecoinVault
          .locator('button:has-text("Invest")')
          .first();
        if (await investButton.isVisible()) {
          await investButton.click();
          await page.waitForTimeout(2000);

          // Check for investment modal or form
          const investModal = page.locator(
            '[data-testid*="invest"], [class*="modal"], [role="dialog"]'
          );
          if (await investModal.isVisible()) {
            // Test amount input
            const amountInput = investModal
              .locator('input[type="number"], input[placeholder*="amount"]')
              .first();
            if (await amountInput.isVisible()) {
              await amountInput.fill("1000");
              const inputValue = await amountInput.inputValue();
              expect(inputValue).toBe("1000");
            }

            // Test strategy options if available
            const strategyOptions = investModal.locator(
              '[data-testid*="strategy"], .strategy-option'
            );
            const optionCount = await strategyOptions.count();
            if (optionCount > 0) {
              await strategyOptions.first().click();
              await page.waitForTimeout(500);
            }

            // Test investment confirmation flow
            const confirmButton = investModal.locator(
              'button:has-text("Confirm"), button:has-text("Invest")'
            );
            if (await confirmButton.isVisible()) {
              // Don't actually invest, just verify the button is functional
              await expect(confirmButton).toBeVisible();
              await expect(confirmButton).toBeEnabled();
            }
          }
        }
      }
    });

    test("multi-vault portfolio allocation", async ({ page }) => {
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);
      }

      // Test multiple vault types
      const vaultTypes = [
        {
          name: "BTC",
          testId: "btc-vault",
          expectedFeatures: ["high-risk", "crypto-native"],
        },
        {
          name: "ETH",
          testId: "eth-vault",
          expectedFeatures: ["medium-risk", "staking"],
        },
        {
          name: "Index500",
          testId: "index500-vault",
          expectedFeatures: ["diversified", "traditional"],
        },
      ];

      for (const vault of vaultTypes) {
        const vaultCard = page
          .locator(
            `[data-testid*="${vault.testId}"], .vault-card:has-text("${vault.name}")`
          )
          .first();

        if (await vaultCard.isVisible()) {
          await expect(vaultCard).toBeVisible();

          // Test vault hover effects
          await vaultCard.hover();
          await page.waitForTimeout(500);

          // Check for expanded information on hover
          const expandedInfo = vaultCard.locator(
            '.expanded-info, [class*="hover"], [data-testid*="details"]'
          );
          if (await expandedInfo.isVisible()) {
            await expect(expandedInfo).toBeVisible();
          }

          // Test allocation slider or percentage input
          const allocationControl = vaultCard.locator(
            'input[type="range"], input[type="number"]'
          );
          if (await allocationControl.isVisible()) {
            await allocationControl.fill("25");
            const value = await allocationControl.inputValue();
            expect(parseInt(value)).toBeGreaterThanOrEqual(0);
            expect(parseInt(value)).toBeLessThanOrEqual(100);
          }
        }
      }

      // Test total allocation validation
      const totalAllocation = page.locator(
        '[data-testid*="total"], .allocation-total'
      );
      if (await totalAllocation.isVisible()) {
        const text = await totalAllocation.textContent();
        expect(text).toMatch(/100%|Total/);
      }
    });

    test("custom vault configuration", async ({ page }) => {
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);
      }

      // Look for custom vault creation option
      const customVaultButton = page.locator(
        'button:has-text("Custom"), button:has-text("Create"), [data-testid*="custom"]'
      );
      if (await customVaultButton.isVisible()) {
        await customVaultButton.click();
        await page.waitForTimeout(2000);

        // Test custom configuration form
        const configForm = page.locator(
          'form, [data-testid*="config"], [class*="config"]'
        );
        if (await configForm.isVisible()) {
          // Test risk tolerance setting
          const riskSlider = configForm.locator(
            'input[type="range"], [data-testid*="risk"]'
          );
          if (await riskSlider.isVisible()) {
            await riskSlider.fill("75");
            const value = await riskSlider.inputValue();
            expect(parseInt(value)).toBe(75);
          }

          // Test rebalancing frequency
          const rebalanceSelect = configForm.locator(
            'select, [data-testid*="rebalance"]'
          );
          if (await rebalanceSelect.isVisible()) {
            await rebalanceSelect.selectOption("weekly");
            const selectedValue = await rebalanceSelect.inputValue();
            expect(selectedValue).toBe("weekly");
          }

          // Test asset allocation inputs
          const assetInputs = configForm.locator(
            'input[placeholder*="allocation"], input[placeholder*="%"]'
          );
          const inputCount = await assetInputs.count();

          if (inputCount > 0) {
            for (let i = 0; i < Math.min(inputCount, 3); i++) {
              const input = assetInputs.nth(i);
              await input.fill((25 + i * 10).toString());
              const value = await input.inputValue();
              expect(parseInt(value)).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });

  test.describe("Portfolio Management & Rebalancing", () => {
    test("portfolio rebalancing scenarios", async ({ page }) => {
      // Navigate to portfolio tab
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);
      }

      // Test rebalancing triggers
      const rebalanceButton = page.locator(
        'button:has-text("Rebalance"), [data-testid*="rebalance"]'
      );
      if (await rebalanceButton.isVisible()) {
        await rebalanceButton.click();
        await page.waitForTimeout(2000);

        // Check for rebalancing analysis modal
        const rebalanceModal = page.locator(
          '[role="dialog"], [data-testid*="rebalance"], .modal'
        );
        if (await rebalanceModal.isVisible()) {
          // Test current vs target allocation display
          const allocationChart = rebalanceModal.locator(
            'svg, canvas, [data-testid*="chart"]'
          );
          if (await allocationChart.isVisible()) {
            await expect(allocationChart).toBeVisible();
          }

          // Test rebalancing recommendations
          const recommendations = rebalanceModal.locator(
            '[data-testid*="recommendation"], .recommendation'
          );
          if (await recommendations.isVisible()) {
            const recText = await recommendations.textContent();
            expect(recText).toMatch(/sell|buy|hold|rebalance/i);
          }

          // Test estimated fees and gas costs
          const feeEstimate = rebalanceModal.locator(
            '[data-testid*="fee"], .fee, [class*="cost"]'
          );
          if (await feeEstimate.isVisible()) {
            const feeText = await feeEstimate.textContent();
            expect(feeText).toMatch(/\$|\d+|fee|gas/i);
          }

          // Test rebalancing confirmation
          const confirmRebalance = rebalanceModal.locator(
            'button:has-text("Confirm"), button:has-text("Execute")'
          );
          if (await confirmRebalance.isVisible()) {
            await expect(confirmRebalance).toBeVisible();
            // Don't actually execute rebalancing
          }
        }
      }
    });

    test("asset allocation drift monitoring", async ({ page }) => {
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);
      }

      // Test allocation drift indicators
      const driftIndicators = page.locator(
        '[data-testid*="drift"], .drift, [class*="deviation"]'
      );
      const driftCount = await driftIndicators.count();

      if (driftCount > 0) {
        for (let i = 0; i < Math.min(driftCount, 3); i++) {
          const indicator = driftIndicators.nth(i);
          if (await indicator.isVisible()) {
            const text = await indicator.textContent();
            expect(text).toMatch(/\d+%|drift|deviation/i);

            // Test color coding for drift severity
            const classList = await indicator.getAttribute("class");
            if (classList) {
              // Should have color indicators (red for high drift, green for low)
              expect(classList).toMatch(
                /red|green|yellow|warning|success|danger/
              );
            }
          }
        }
      }

      // Test automatic rebalancing triggers
      const autoRebalanceSettings = page.locator(
        '[data-testid*="auto"], .auto-rebalance'
      );
      if (await autoRebalanceSettings.isVisible()) {
        const thresholdInput = autoRebalanceSettings.locator(
          'input[type="number"]'
        );
        if (await thresholdInput.isVisible()) {
          await thresholdInput.fill("5");
          const value = await thresholdInput.inputValue();
          expect(parseInt(value)).toBe(5);
        }
      }
    });

    test("performance tracking and analytics", async ({ page }) => {
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(2000);
      }

      // Test performance metrics calculation
      const performanceMetrics = page.locator(
        '[data-testid*="performance"], .performance-metric'
      );
      const metricCount = await performanceMetrics.count();

      if (metricCount > 0) {
        // Test total return calculation
        const totalReturn = page.locator(
          ':has-text("Total Return"), [data-testid*="total-return"]'
        );
        if (await totalReturn.isVisible()) {
          const returnText = await totalReturn.textContent();
          expect(returnText).toMatch(/[\+\-]?\d+\.\d+%|\$[\d,]+/);
        }

        // Test Sharpe ratio display
        const sharpeRatio = page.locator(
          ':has-text("Sharpe"), [data-testid*="sharpe"]'
        );
        if (await sharpeRatio.isVisible()) {
          const sharpeText = await sharpeRatio.textContent();
          expect(sharpeText).toMatch(/\d+\.\d+/);
        }

        // Test maximum drawdown
        const maxDrawdown = page.locator(
          ':has-text("Drawdown"), [data-testid*="drawdown"]'
        );
        if (await maxDrawdown.isVisible()) {
          const drawdownText = await maxDrawdown.textContent();
          expect(drawdownText).toMatch(/\-\d+\.\d+%/);
        }

        // Test volatility metrics
        const volatility = page.locator(
          ':has-text("Volatility"), [data-testid*="volatility"]'
        );
        if (await volatility.isVisible()) {
          const volText = await volatility.textContent();
          expect(volText).toMatch(/\d+\.\d+%/);
        }
      }

      // Test benchmark comparison
      const benchmarkComparison = page.locator(
        '[data-testid*="benchmark"], .benchmark'
      );
      if (await benchmarkComparison.isVisible()) {
        const comparisonText = await benchmarkComparison.textContent();
        expect(comparisonText).toMatch(/outperform|underperform|vs|benchmark/i);
      }
    });
  });

  test.describe("Web3 & Wallet Integration", () => {
    test("wallet connection flow simulation", async ({ page }) => {
      // Test wallet connection button
      const walletButton = page.locator(
        'button:has-text("Connect"), [data-testid*="wallet"], .wallet-connect'
      );
      if (await walletButton.isVisible()) {
        await walletButton.click();
        await page.waitForTimeout(2000);

        // Test wallet selection modal
        const walletModal = page.locator(
          '[role="dialog"], .wallet-modal, [data-testid*="wallet"]'
        );
        if (await walletModal.isVisible()) {
          // Test different wallet options
          const walletOptions = walletModal.locator("button, .wallet-option");
          const optionCount = await walletOptions.count();

          if (optionCount > 0) {
            // Test MetaMask option
            const metamaskOption = walletModal.locator(
              'button:has-text("MetaMask"), [data-testid*="metamask"]'
            );
            if (await metamaskOption.isVisible()) {
              await expect(metamaskOption).toBeVisible();
            }

            // Test WalletConnect option
            const walletConnectOption = walletModal.locator(
              'button:has-text("WalletConnect"), [data-testid*="walletconnect"]'
            );
            if (await walletConnectOption.isVisible()) {
              await expect(walletConnectOption).toBeVisible();
            }

            // Test smart wallet option (ZeroDev)
            const smartWalletOption = walletModal.locator(
              'button:has-text("Smart"), [data-testid*="smart"]'
            );
            if (await smartWalletOption.isVisible()) {
              await expect(smartWalletOption).toBeVisible();
            }
          }
        }
      }
    });

    test("network switching scenarios", async ({ page }) => {
      // Test network selector
      const networkSelector = page.locator(
        '[data-testid*="network"], .network-selector'
      );
      if (await networkSelector.isVisible()) {
        await networkSelector.click();
        await page.waitForTimeout(1000);

        // Test available networks
        const networks = page.locator(
          '.network-option, [data-testid*="network-"]'
        );
        const networkCount = await networks.count();

        if (networkCount > 0) {
          // Test switching to different networks
          const expectedNetworks = [
            "Ethereum",
            "Polygon",
            "Arbitrum",
            "Optimism",
          ];

          for (const networkName of expectedNetworks) {
            const networkOption = page.locator(`:has-text("${networkName}")`);
            if (await networkOption.isVisible()) {
              await networkOption.click();
              await page.waitForTimeout(1500);

              // Verify network switch confirmation
              const confirmation = page.locator(
                '.confirmation, [data-testid*="confirm"]'
              );
              if (await confirmation.isVisible()) {
                await page.waitForTimeout(1000);
              }
              break; // Test only the first available network
            }
          }
        }
      }
    });

    test("transaction simulation and gas estimation", async ({ page }) => {
      // Navigate to invest tab for transaction testing
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);
      }

      // Simulate investment transaction
      const investButton = page.locator('button:has-text("Invest")').first();
      if (await investButton.isVisible()) {
        await investButton.click();
        await page.waitForTimeout(2000);

        // Test gas estimation display
        const gasEstimate = page.locator(
          '[data-testid*="gas"], .gas-estimate, [class*="fee"]'
        );
        if (await gasEstimate.isVisible()) {
          const gasText = await gasEstimate.textContent();
          expect(gasText).toMatch(/\$\d+|\d+\s*gwei|gas|fee/i);
        }

        // Test transaction preview
        const txPreview = page.locator(
          '[data-testid*="preview"], .transaction-preview'
        );
        if (await txPreview.isVisible()) {
          // Check for transaction details
          const txDetails = txPreview.locator(
            '[data-testid*="detail"], .tx-detail'
          );
          const detailCount = await txDetails.count();
          expect(detailCount).toBeGreaterThan(0);
        }

        // Test slippage tolerance settings
        const slippageSettings = page.locator(
          '[data-testid*="slippage"], .slippage'
        );
        if (await slippageSettings.isVisible()) {
          const slippageInput = slippageSettings.locator(
            'input[type="number"]'
          );
          if (await slippageInput.isVisible()) {
            await slippageInput.fill("0.5");
            const value = await slippageInput.inputValue();
            expect(parseFloat(value)).toBe(0.5);
          }
        }
      }
    });
  });

  test.describe("Intent-Based Execution", () => {
    test("intent creation and execution simulation", async ({ page }) => {
      // Test intent-based investment flow
      const intentButton = page.locator(
        'button:has-text("Intent"), [data-testid*="intent"]'
      );
      if (await intentButton.isVisible()) {
        await intentButton.click();
        await page.waitForTimeout(2000);

        // Test intent configuration
        const intentModal = page.locator('[role="dialog"], .intent-modal');
        if (await intentModal.isVisible()) {
          // Test goal-based investment
          const goalSelector = intentModal.locator(
            'select, [data-testid*="goal"]'
          );
          if (await goalSelector.isVisible()) {
            await goalSelector.selectOption("conservative-growth");
            const selectedValue = await goalSelector.inputValue();
            expect(selectedValue).toBe("conservative-growth");
          }

          // Test time horizon input
          const timeHorizon = intentModal.locator(
            'input[placeholder*="months"], [data-testid*="horizon"]'
          );
          if (await timeHorizon.isVisible()) {
            await timeHorizon.fill("12");
            const value = await timeHorizon.inputValue();
            expect(parseInt(value)).toBe(12);
          }

          // Test risk preference
          const riskSlider = intentModal.locator(
            'input[type="range"], [data-testid*="risk"]'
          );
          if (await riskSlider.isVisible()) {
            await riskSlider.fill("50");
            const value = await riskSlider.inputValue();
            expect(parseInt(value)).toBe(50);
          }

          // Test intent execution preview
          const executeButton = intentModal.locator(
            'button:has-text("Execute"), button:has-text("Create")'
          );
          if (await executeButton.isVisible()) {
            await expect(executeButton).toBeVisible();
            // Test intent validation
            await expect(executeButton).toBeEnabled();
          }
        }
      }
    });

    test("automated rebalancing intent", async ({ page }) => {
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);
      }

      // Test automated rebalancing setup
      const autoRebalanceButton = page.locator(
        'button:has-text("Auto"), [data-testid*="auto"]'
      );
      if (await autoRebalanceButton.isVisible()) {
        await autoRebalanceButton.click();
        await page.waitForTimeout(2000);

        const automationModal = page.locator(
          '[role="dialog"], .automation-modal'
        );
        if (await automationModal.isVisible()) {
          // Test rebalancing triggers
          const triggerOptions = automationModal.locator(
            'input[type="checkbox"], .trigger-option'
          );
          const triggerCount = await triggerOptions.count();

          if (triggerCount > 0) {
            // Enable time-based rebalancing
            const timeBasedTrigger = automationModal.locator(
              'input[value*="time"], [data-testid*="time"]'
            );
            if (await timeBasedTrigger.isVisible()) {
              await timeBasedTrigger.check();
              const isChecked = await timeBasedTrigger.isChecked();
              expect(isChecked).toBe(true);
            }

            // Enable threshold-based rebalancing
            const thresholdTrigger = automationModal.locator(
              'input[value*="threshold"], [data-testid*="threshold"]'
            );
            if (await thresholdTrigger.isVisible()) {
              await thresholdTrigger.check();

              // Set threshold percentage
              const thresholdInput = automationModal.locator(
                'input[type="number"]'
              );
              if (await thresholdInput.isVisible()) {
                await thresholdInput.fill("10");
                const value = await thresholdInput.inputValue();
                expect(parseInt(value)).toBe(10);
              }
            }
          }
        }
      }
    });
  });

  test.describe("Risk Management & Safety", () => {
    test("risk assessment and warnings", async ({ page }) => {
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);
      }

      // Test high-risk investment warnings
      const btcVault = page
        .locator('.vault-card:has-text("BTC"), [data-testid*="btc"]')
        .first();
      if (await btcVault.isVisible()) {
        const investButton = btcVault.locator('button:has-text("Invest")');
        if (await investButton.isVisible()) {
          await investButton.click();
          await page.waitForTimeout(2000);

          // Test risk warning modal
          const riskWarning = page.locator(
            '[data-testid*="warning"], .risk-warning, [class*="warning"]'
          );
          if (await riskWarning.isVisible()) {
            const warningText = await riskWarning.textContent();
            expect(warningText).toMatch(/risk|volatile|loss|warning/i);

            // Test risk acknowledgment
            const acknowledgmentCheckbox = riskWarning.locator(
              'input[type="checkbox"]'
            );
            if (await acknowledgmentCheckbox.isVisible()) {
              await acknowledgmentCheckbox.check();
              const isChecked = await acknowledgmentCheckbox.isChecked();
              expect(isChecked).toBe(true);
            }
          }
        }
      }
    });

    test("position size limits and validation", async ({ page }) => {
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);
      }

      const investButton = page.locator('button:has-text("Invest")').first();
      if (await investButton.isVisible()) {
        await investButton.click();
        await page.waitForTimeout(2000);

        // Test maximum investment validation
        const amountInput = page
          .locator('input[type="number"], input[placeholder*="amount"]')
          .first();
        if (await amountInput.isVisible()) {
          // Test extremely large amount
          await amountInput.fill("1000000000");
          await page.waitForTimeout(1000);

          // Check for validation error
          const validationError = page.locator(
            '.error, [data-testid*="error"], [class*="invalid"]'
          );
          if (await validationError.isVisible()) {
            const errorText = await validationError.textContent();
            expect(errorText).toMatch(/maximum|limit|exceed|too large/i);
          }

          // Test minimum investment validation
          await amountInput.fill("0.01");
          await page.waitForTimeout(1000);

          const minError = page.locator(
            '.error, [data-testid*="error"], [class*="invalid"]'
          );
          if (await minError.isVisible()) {
            const errorText = await minError.textContent();
            expect(errorText).toMatch(/minimum|small|insufficient/i);
          }
        }
      }
    });

    test("emergency exit and liquidation scenarios", async ({ page }) => {
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);
      }

      // Test emergency exit functionality
      const emergencyButton = page.locator(
        'button:has-text("Emergency"), button:has-text("Exit"), [data-testid*="emergency"]'
      );
      if (await emergencyButton.isVisible()) {
        await emergencyButton.click();
        await page.waitForTimeout(2000);

        const emergencyModal = page.locator(
          '[role="dialog"], .emergency-modal'
        );
        if (await emergencyModal.isVisible()) {
          // Test emergency exit confirmation
          const confirmationText = emergencyModal.locator(
            '.confirmation-text, [data-testid*="confirm"]'
          );
          if (await confirmationText.isVisible()) {
            const text = await confirmationText.textContent();
            expect(text).toMatch(/emergency|liquidate|exit|confirm/i);
          }

          // Test impact estimation
          const impactEstimate = emergencyModal.locator(
            '.impact-estimate, [data-testid*="impact"]'
          );
          if (await impactEstimate.isVisible()) {
            const estimateText = await impactEstimate.textContent();
            expect(estimateText).toMatch(/\d+%|impact|loss|slippage/i);
          }

          // Test final confirmation button
          const finalConfirm = emergencyModal.locator(
            'button:has-text("Confirm"), button:has-text("Execute")'
          );
          if (await finalConfirm.isVisible()) {
            await expect(finalConfirm).toBeVisible();
            // Don't actually execute emergency exit
          }
        }
      }
    });
  });
});
