import { render, screen } from "@testing-library/react";
import React, { ErrorInfo, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";
import { useUser } from "../../../src/contexts/UserContext";

// Mock dependencies
vi.mock("../../../src/hooks/useWalletPortfolioState");
vi.mock("../../../src/contexts/UserContext");

// Mock all the child components that WalletPortfolio uses
vi.mock("../../../src/components/ui/GlassCard", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
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

// Mock ThirdWeb
vi.mock("thirdweb/react", () => ({
  useActiveAccount: vi.fn(() => null),
  ConnectButton: vi.fn(() => <button>Connect</button>),
}));

vi.mock("../../../src/components/Web3/SimpleConnectButton", () => ({
  SimpleConnectButton: vi.fn(() => <button>Simple Connect</button>),
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
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
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
        </div>
      );
    }

    return this.props.children;
  }
}

describe("WalletPortfolio - Error Boundary and Recovery Tests", () => {
  const mockUseWalletPortfolioState = vi.mocked(useWalletPortfolioState);
  const mockUseUser = vi.mocked(useUser);

  // Store original console methods
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    // Complete mock reset to ensure clean state
    vi.clearAllMocks();

    // Suppress console errors during error boundary tests
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    console.error = vi.fn();
    console.warn = vi.fn();

    // Default working state
    mockUseWalletPortfolioState.mockReturnValue({
      totalValue: 15000,
      portfolioData: [],
      pieChartData: [],
      isLoading: false,
      apiError: null,
      retry: vi.fn(),
      isRetrying: false,
      isConnected: true,
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: { totalValue: 15000, totalChangePercentage: 5.2 },
      toggleBalanceVisibility: vi.fn(),
      toggleCategoryExpansion: vi.fn(),
      isWalletManagerOpen: false,
      openWalletManager: vi.fn(),
      closeWalletManager: vi.fn(),
    });

    // Setup UserContext mock
    mockUseUser.mockReturnValue({
      userInfo: {
        userId: "test-user-id",
        email: "test@example.com",
        name: "Test User",
      },
      loading: false,
      error: null,
      isConnected: true,
      connectedWallet: "0x1234567890abcdef",
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    // Restore original console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("Component-Level Error Handling", () => {
    it("should handle render-time errors in components", () => {
      const onError = vi.fn();

      // Create an error component that throws during render
      const ErrorComponent = () => {
        throw new Error("Component render error");
      };

      render(
        <TestErrorBoundary onError={onError}>
          <ErrorComponent />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Component render error"
      );
      expect(onError).toHaveBeenCalled();
    });

    it("should handle partial hook state", () => {
      const onError = vi.fn();

      // Return undefined to simulate hook returning undefined/null
      mockUseWalletPortfolioState.mockReturnValue(undefined as any);

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should catch the error when hook returns undefined
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("should demonstrate error boundary behavior with component errors", () => {
      const onError = vi.fn();

      // Create conditional error component
      let shouldThrow = true;
      const ConditionalErrorComponent = () => {
        if (shouldThrow) {
          throw new Error("Conditional render error");
        }
        return <div data-testid="success-content">Success</div>;
      };

      const { rerender } = render(
        <TestErrorBoundary onError={onError}>
          <ConditionalErrorComponent />
        </TestErrorBoundary>
      );

      // Should show error boundary initially
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();

      // Fix the error and rerender with new error boundary instance
      shouldThrow = false;
      onError.mockClear();

      rerender(
        <TestErrorBoundary key="new-boundary" onError={onError}>
          <ConditionalErrorComponent />
        </TestErrorBoundary>
      );

      // Should now render successfully
      expect(screen.getByTestId("success-content")).toBeInTheDocument();
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(onError).not.toHaveBeenCalled();
    });

    it("should handle API error states gracefully", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: [],
        pieChartData: [],
        isLoading: false,
        apiError: "API connection failed",
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalValue: 0, totalChangePercentage: 0 },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should render without error boundary (API errors are handled in UI)
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });
  });

  describe("Error Prevention and Resilience", () => {
    it("should handle null/undefined props gracefully", () => {
      render(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should render successfully with default behavior
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });

    it("should handle extreme state values", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: Number.MAX_SAFE_INTEGER,
        portfolioData: [],
        pieChartData: [],
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: Number.MAX_SAFE_INTEGER,
          totalChangePercentage: 999999,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });
  });
});
