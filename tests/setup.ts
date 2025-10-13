import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { chartMatchers } from "./utils/chartTypeGuards";

// Configure React Testing Library to work better with React 18+
configure({
  // Increase default timeout for async operations
  asyncTimeout: 5000,
});

// Configure global React environment for act() support
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock console.error to suppress act() warnings in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("not configured to support act") ||
        message.includes("Warning: ReactDOM.render is no longer supported"))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

// Mock React Query's error boundary logging to avoid console noise during tests
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    // Silence QueryErrorResetBoundary console errors during testing
    useQueryErrorResetBoundary: () => ({ reset: vi.fn() }),
  };
});

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Extend Vitest's expect with custom chart matchers
expect.extend(chartMatchers);

// Clean up after each test case
afterEach(() => {
  cleanup();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = "";
  thresholds: ReadonlyArray<number> = [];

  constructor(
    _callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.root = (options?.root as Element) || null;
    this.rootMargin = options?.rootMargin || "";
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : [options?.threshold || 0];
  }

  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// Mock PointerEvent for framer-motion
(global as any).PointerEvent = class PointerEvent extends Event {
  pointerId: number;
  width: number;
  height: number;
  pressure: number;
  tangentialPressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  pointerType: string;
  isPrimary: boolean;
  altitudeAngle: number = 0;
  azimuthAngle: number = 0;

  constructor(type: string, eventInitDict: any = {}) {
    super(type, eventInitDict);
    this.pointerId = eventInitDict.pointerId || 0;
    this.width = eventInitDict.width || 1;
    this.height = eventInitDict.height || 1;
    this.pressure = eventInitDict.pressure || 0;
    this.tangentialPressure = eventInitDict.tangentialPressure || 0;
    this.tiltX = eventInitDict.tiltX || 0;
    this.tiltY = eventInitDict.tiltY || 0;
    this.twist = eventInitDict.twist || 0;
    this.pointerType = eventInitDict.pointerType || "";
    this.isPrimary = eventInitDict.isPrimary || false;
  }

  getCoalescedEvents() {
    return [];
  }
  getPredictedEvents() {
    return [];
  }
};

// Mock HTMLElement.setPointerCapture and releasePointerCapture
HTMLElement.prototype.setPointerCapture = vi.fn();
HTMLElement.prototype.releasePointerCapture = vi.fn();

// Mock Next.js dynamic imports to return the actual component in tests
// This allows individual component mocks to take precedence
vi.mock("next/dynamic", () => {
  return {
    default: (
      importFunc: () => Promise<any>,
      _options?: { loading?: () => JSX.Element }
    ) => {
      // Return a component that immediately resolves the import
      const DynamicComponent = (props: any) => {
        try {
          // Try to resolve the import immediately for tests
          const modulePromise = importFunc();

          // If it's a Promise, we can't resolve it synchronously, so return a mock
          if (modulePromise && typeof modulePromise.then === "function") {
            // Determine what component is being imported based on the import function
            const importString = importFunc.toString();

            // For PortfolioOverview, return a mock aligned with current props
            if (importString.includes("PortfolioOverview")) {
              // Calculate total from portfolioState or pieChartData like the real component would
              const calculatedTotal =
                props?.portfolioState?.totalValue ??
                props?.pieChartData?.reduce(
                  (sum, item) => sum + (item.value || 0),
                  0
                ) ??
                25000; // Default fallback for tests

              const formatCurrency = amount => {
                return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              };

              return React.createElement(
                "div",
                {
                  "data-testid": "portfolio-overview",
                  "data-dynamic": "true",
                },
                [
                  React.createElement(
                    "div",
                    {
                      key: "loading-state",
                      "data-testid": "loading-state",
                    },
                    props?.portfolioState?.isLoading ? "loading" : "not-loading"
                  ),
                  React.createElement(
                    "div",
                    {
                      key: "error-state",
                      "data-testid": "error-state",
                    },
                    props?.portfolioState?.errorMessage || "no-error"
                  ),
                  React.createElement(
                    "div",
                    {
                      key: "pie-chart",
                      "data-testid": "pie-chart-mock",
                    },
                    [
                      (() => {
                        // Prefer explicit prop, otherwise default to visible since context isn't accessible here
                        const hidden = props?.balanceHidden === true;
                        return React.createElement(
                          "div",
                          {
                            key: "pie-chart-visibility",
                            "data-testid": "pie-chart-visibility-state",
                          },
                          hidden ? "hidden" : "visible"
                        );
                      })(),
                      React.createElement(
                        "div",
                        {
                          key: "pie-chart-balance",
                          "data-testid": "pie-chart-balance",
                        },
                        props?.balanceHidden
                          ? "••••••••"
                          : formatCurrency(calculatedTotal)
                      ),
                      React.createElement(
                        "div",
                        {
                          key: "pie-chart-data",
                          "data-testid": "pie-chart-data",
                        },
                        props?.pieChartData && props.pieChartData.length > 0
                          ? "has-data"
                          : "no-data"
                      ),
                    ]
                  ),
                  React.createElement(
                    "div",
                    {
                      key: "portfolio-data",
                      "data-testid": "portfolio-data-count",
                    },
                    props?.pieChartData?.length || 0
                  ),
                ]
              );
            }

            // Special-case WalletManager so tests can interact with its props synchronously
            if (importString.includes("WalletManager")) {
              return React.createElement(
                "div",
                { "data-testid": "wallet-manager-mock" },
                [
                  // Only show confirm button when modal would be open
                  props?.isOpen
                    ? React.createElement(
                        "button",
                        {
                          key: "confirm",
                          type: "button",
                          "data-testid": "confirm-email-subscribe",
                          onClick: () => props?.onEmailSubscribed?.(),
                        },
                        "Confirm Subscribe"
                      )
                    : null,
                ]
              );
            }

            // In test environment, return a generic placeholder for other components
            return React.createElement(
              "div",
              {
                "data-testid": "dynamic-component-mock",
                "data-dynamic": "true",
              },
              "Dynamic Component Mock"
            );
          }
        } catch (error) {
          // If import fails, return placeholder
          return React.createElement(
            "div",
            {
              "data-testid": "dynamic-component-error",
              "data-error": error?.message || "Import failed",
            },
            "Dynamic Import Error"
          );
        }

        // Fallback placeholder
        return React.createElement(
          "div",
          {
            "data-testid": "dynamic-component-fallback",
          },
          "Dynamic Component"
        );
      };

      DynamicComponent.displayName = "DynamicComponent";
      return DynamicComponent;
    },
  };
});

// Import React for the dynamic component mock
import React from "react";

// Provide a default mock for UserContext to avoid provider requirements in unit tests
vi.mock("@/contexts/UserContext", () => {
  return {
    useUser: () => ({
      userInfo: null,
      loading: false,
      error: null,
      isConnected: false,
      connectedWallet: null,
      refetch: vi.fn(),
    }),
    UserProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});
