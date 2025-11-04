import { render, screen } from "@testing-library/react";
import React, { ErrorInfo, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { useLandingPageData } from "../../../src/hooks/queries/usePortfolioQuery";
import {
  usePortfolioState,
  usePortfolioStateHelpers,
} from "../../../src/hooks/usePortfolioState";
import { createCategoriesFromApiData } from "../../../src/utils/portfolio.utils";

// Mock dependencies for decomposed architecture
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/usePortfolioState");
vi.mock("../../../src/utils/portfolio.utils");

// Mock child components to test error boundaries at different levels
vi.mock("../../../src/components/ui/BaseCard", () => ({
  BaseCard: vi.fn(({ children }) => (
    <div data-testid="base-card">{children}</div>
  )),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(() => <div data-testid="wallet-header">Header</div>),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(() => <div data-testid="wallet-metrics">Metrics</div>),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(() => <div data-testid="wallet-actions">Actions</div>),
}));

vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(() => (
    <div data-testid="portfolio-overview">Overview</div>
  )),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen }) =>
    isOpen ? <div data-testid="wallet-manager">Manager</div> : null
  ),
}));

// Mock UI components to avoid dynamic import issues
vi.mock("../../../src/components/ui/GradientButton", () => ({
  GradientButton: vi.fn(({ children, onClick, icon: Icon, ...props }) => (
    <button onClick={onClick} {...props}>
      {Icon && <Icon />}
      {children}
    </button>
  )),
}));

vi.mock("../../../src/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: vi.fn(({ size, className }) => (
    <div data-testid="loading-spinner" className={className} data-size={size}>
      Loading...
    </div>
  )),
}));

// Mock ThirdWeb
vi.mock("thirdweb/react", () => ({
  useActiveAccount: vi.fn(() => null),
  ConnectButton: vi.fn(() => <button>Connect</button>),
}));

vi.mock("../../../src/components/Web3/SimpleConnectButton", () => ({
  SimpleConnectButton: vi.fn(() => <button>Simple Connect</button>),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  AlertCircle: vi.fn(() => (
    <span data-testid="alert-circle-icon">AlertCircle</span>
  )),
  ArrowDownLeft: vi.fn(() => (
    <span data-testid="arrow-down-left-icon">ArrowDownLeft</span>
  )),
  ArrowUpRight: vi.fn(() => (
    <span data-testid="arrow-up-right-icon">ArrowUpRight</span>
  )),
  BarChart3: vi.fn(() => <span data-testid="bar-chart3-icon">BarChart3</span>),
  DollarSign: vi.fn(() => (
    <span data-testid="dollar-sign-icon">DollarSign</span>
  )),
  Eye: vi.fn(() => <span data-testid="eye-icon">Eye</span>),
  EyeOff: vi.fn(() => <span data-testid="eye-off-icon">EyeOff</span>),
  Loader: vi.fn(() => <span data-testid="loader-icon">Loader</span>),
  Settings: vi.fn(() => <span data-testid="settings-icon">Settings</span>),
  TrendingDown: vi.fn(() => (
    <span data-testid="trending-down-icon">TrendingDown</span>
  )),
  TrendingUp: vi.fn(() => (
    <span data-testid="trending-up-icon">TrendingUp</span>
  )),
  Wallet: vi.fn(() => <span data-testid="wallet-icon">Wallet</span>),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

// Test Error Boundary Component
class TestErrorBoundary extends React.Component<
  {
    children: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: (string | number)[];
  },
  {
    hasError: boolean;
    error: Error | null;
    prevResetKeys?: (string | number)[];
  }
> {
  constructor(props: {
    children: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: (string | number)[];
  }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      prevResetKeys: props.resetKeys,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(
    props: { resetKeys?: (string | number)[] },
    state: { hasError: boolean; prevResetKeys?: (string | number)[] }
  ) {
    // Reset error boundary when resetKeys change
    if (
      state.hasError &&
      state.prevResetKeys !== props.resetKeys &&
      props.resetKeys?.some((key, idx) => state.prevResetKeys?.[idx] !== key)
    ) {
      return {
        hasError: false,
        error: null,
        prevResetKeys: props.resetKeys,
      };
    }
    return { ...state, prevResetKeys: props.resetKeys };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Something went wrong</h2>
          <p data-testid="error-message">{this.state.error?.message}</p>
          <button
            data-testid="error-retry"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mock data for testing
const mockUserInfo = { userId: "test-user-123" };
const mockCategories = [
  {
    id: "btc",
    name: "BTC",
    totalValue: 7500,
    percentage: 50,
    color: "#F7931A",
    change24h: 5.2,
    assets: [],
  },
];

describe("WalletPortfolio - Error Boundary and Recovery Tests (Decomposed)", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUseLandingPageData = vi.mocked(useLandingPageData);
  const mockUsePortfolioState = vi.mocked(usePortfolioState);
  const mockUsePortfolioStateHelpers = vi.mocked(usePortfolioStateHelpers);
  const mockCreateCategoriesFromApiData = vi.mocked(
    createCategoriesFromApiData
  );

  // Store original console methods
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    vi.clearAllMocks();

    // Suppress console errors during error boundary tests
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    console.error = vi.fn();
    console.warn = vi.fn();

    // Default working state for all hooks
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      loading: false,
    });

    mockUseLandingPageData.mockReturnValue({
      data: {
        total_net_usd: 15000,
        weighted_apr: 0.125,
        estimated_monthly_income: 1000,
        portfolio_allocation: {
          btc: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
          eth: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
          stablecoins: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
          others: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
        },
        pool_details: [],
        total_positions: 0,
        protocols_count: 0,
        chains_count: 0,
        last_updated: null,
        apr_coverage: {
          matched_pools: 0,
          total_pools: 0,
          coverage_percentage: 0,
          matched_asset_value_usd: 0,
        },
        total_assets_usd: 15000,
        total_debt_usd: 0,
        category_summary_debt: {
          btc: 0,
          eth: 0,
          stablecoins: 0,
          others: 0,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    mockCreateCategoriesFromApiData.mockReturnValue(mockCategories);

    // Setup portfolio state mock
    mockUsePortfolioState.mockReturnValue({
      type: "has_data",
      isConnected: true,
      isLoading: false,
      hasError: false,
      hasZeroData: false,
      totalValue: 15000,
      errorMessage: null,
      isRetrying: false,
    });

    mockUsePortfolioStateHelpers.mockReturnValue({
      shouldShowLoading: false,
      shouldShowConnectPrompt: false,
      shouldShowNoDataMessage: false,
      shouldShowPortfolioContent: true,
      shouldShowError: false,
      getDisplayTotalValue: () => 15000,
    });
  });

  afterEach(() => {
    // Restore original console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("Individual Hook Error Handling", () => {
    it("should handle useUser hook throwing an error", () => {
      const onError = vi.fn();
      mockUseUser.mockImplementation(() => {
        throw new Error("UserContext provider not found");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "UserContext provider not found"
      );
      expect(onError).toHaveBeenCalled();
    });

    it("should handle useLandingPageData hook throwing an error", () => {
      const onError = vi.fn();
      mockUseLandingPageData.mockImplementation(() => {
        throw new Error("Failed to initialize portfolio query");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Failed to initialize portfolio query"
      );
      expect(onError).toHaveBeenCalled();
    });

    it("should handle usePortfolio hook throwing an error", () => {
      const onError = vi.fn();
      mockUsePortfolioState.mockImplementation(() => {
        throw new Error("Portfolio metrics calculation failed");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Portfolio metrics calculation failed"
      );
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("Hook Data Validation Errors", () => {
    it("should handle invalid return data from hooks", () => {
      const onError = vi.fn();
      // Mock useUser returning invalid data structure
      mockUseUser.mockReturnValue(undefined as any);

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();
    });

    it("should handle null/undefined data gracefully where expected", () => {
      // These are valid null states that should NOT cause errors
      mockUseUser.mockReturnValue({
        userInfo: null, // Valid when disconnected
        isConnected: false,
        loading: false,
      });

      mockUseLandingPageData.mockReturnValue({
        data: null, // Valid when loading or error
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should not trigger error boundary
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });
  });

  describe("Error Recovery and Reset Mechanisms", () => {
    it("should recover from errors when resetKeys change (user connection state)", () => {
      const onError = vi.fn();

      // Initial error state
      mockUseLandingPageData.mockImplementation(() => {
        throw new Error("Network connection failed");
      });

      const { rerender } = render(
        <TestErrorBoundary
          onError={onError}
          resetKeys={["disconnected", "no-user"]}
        >
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should show error boundary
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();

      // Fix the hook and change resetKeys (simulating user connection change)
      mockUseLandingPageData.mockReturnValue({
        data: {
          total_net_usd: 15000,
          weighted_apr: 0.125,
          estimated_monthly_income: 1000,
          portfolio_allocation: {
            btc: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
            eth: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
            stablecoins: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
            others: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
          },
          pool_details: [],
          total_positions: 0,
          protocols_count: 0,
          chains_count: 0,
          last_updated: null,
          apr_coverage: {
            matched_pools: 0,
            total_pools: 0,
            coverage_percentage: 0,
            matched_asset_value_usd: 0,
          },
          total_assets_usd: 15000,
          total_debt_usd: 0,
          category_summary_debt: {
            btc: 0,
            eth: 0,
            stablecoins: 0,
            others: 0,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(
        <TestErrorBoundary
          onError={onError}
          resetKeys={["connected", "test-user-123"]} // Changed resetKeys
        >
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should recover and show normal component
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });

    it("should demonstrate error boundary isolation between sections", () => {
      // Mock one section component to throw error
      const ErrorComponent = () => {
        throw new Error("Section-specific error");
      };

      // Create a custom wrapper that mimics WalletPortfolio structure
      const TestWalletPortfolioWithSectionErrors = () => {
        return (
          <div>
            <TestErrorBoundary>
              <div data-testid="section-1">Section 1 OK</div>
            </TestErrorBoundary>

            <TestErrorBoundary>
              <ErrorComponent />
            </TestErrorBoundary>

            <TestErrorBoundary>
              <div data-testid="section-3">Section 3 OK</div>
            </TestErrorBoundary>
          </div>
        );
      };

      render(<TestWalletPortfolioWithSectionErrors />);

      // Section 1 and 3 should render normally
      expect(screen.getByTestId("section-1")).toBeInTheDocument();
      expect(screen.getByTestId("section-3")).toBeInTheDocument();

      // Only the error section should show error boundary
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Section-specific error"
      );
    });
  });

  describe("Cascading Error Scenarios", () => {
    it("should handle multiple hook failures gracefully", () => {
      const onError = vi.fn();

      // Multiple hooks throwing errors
      mockUseUser.mockImplementation(() => {
        throw new Error("User context failed");
      });

      mockUseLandingPageData.mockImplementation(() => {
        throw new Error("Portfolio data failed");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should catch the first error (useUser is called first)
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "User context failed"
      );
      expect(onError).toHaveBeenCalled();
    });

    it("should handle errors during hook dependency chain", () => {
      const onError = vi.fn();

      // Make usePortfolio fail when it receives categories from useLandingPageData
      mockUsePortfolioState.mockImplementation(() => {
        throw new Error("Cannot process portfolio categories");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Cannot process portfolio categories"
      );
    });
  });

  describe("Error Boundary Configuration", () => {
    it("should demonstrate different error boundary resetKeys behavior", () => {
      const onError = vi.fn();
      let shouldError = true;

      mockUseLandingPageData.mockImplementation(() => {
        if (shouldError) {
          throw new Error("Initial error");
        }
        return {
          data: {
            total_net_usd: 15000,
            weighted_apr: 0.125,
            estimated_monthly_income: 1000,
            portfolio_allocation: {
              btc: {
                total_value: 0,
                percentage_of_portfolio: 0,
                wallet_tokens_value: 0,
                other_sources_value: 0,
              },
              eth: {
                total_value: 0,
                percentage_of_portfolio: 0,
                wallet_tokens_value: 0,
                other_sources_value: 0,
              },
              stablecoins: {
                total_value: 0,
                percentage_of_portfolio: 0,
                wallet_tokens_value: 0,
                other_sources_value: 0,
              },
              others: {
                total_value: 0,
                percentage_of_portfolio: 0,
                wallet_tokens_value: 0,
                other_sources_value: 0,
              },
            },
            pool_details: [],
            total_positions: 0,
            protocols_count: 0,
            chains_count: 0,
            last_updated: null,
            apr_coverage: {
              matched_pools: 0,
              total_pools: 0,
              coverage_percentage: 0,
              matched_asset_value_usd: 0,
            },
            total_assets_usd: 15000,
            total_debt_usd: 0,
            category_summary_debt: {
              btc: 0,
              eth: 0,
              stablecoins: 0,
              others: 0,
            },
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isRefetching: false,
        };
      });

      const { rerender } = render(
        <TestErrorBoundary onError={onError} resetKeys={["initial-state"]}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should show error initially
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();

      // Fix the error but don't change resetKeys
      shouldError = false;

      rerender(
        <TestErrorBoundary
          onError={onError}
          resetKeys={["initial-state"]} // Same resetKeys
        >
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should still show error boundary (resetKeys didn't change)
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();

      // Now change resetKeys
      rerender(
        <TestErrorBoundary
          onError={onError}
          resetKeys={["recovered-state"]} // Different resetKeys
        >
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should recover
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });
  });

  describe("Production Error Scenarios", () => {
    it("should handle real-world error: network timeout during hook initialization", () => {
      const onError = vi.fn();

      mockUseLandingPageData.mockImplementation(() => {
        throw new Error("Network timeout: ETIMEDOUT");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Network timeout: ETIMEDOUT"
      );
    });

    it("should handle memory pressure scenarios", () => {
      const onError = vi.fn();

      // Simulate out of memory error
      mockUsePortfolioState.mockImplementation(() => {
        throw new Error("JavaScript heap out of memory");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "JavaScript heap out of memory"
      );
    });
  });
});
