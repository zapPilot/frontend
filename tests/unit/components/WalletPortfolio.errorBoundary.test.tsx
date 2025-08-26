import { render, screen } from "@testing-library/react";
import React, { ErrorInfo, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { usePortfolioDisplayData } from "../../../src/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { useWalletModal } from "../../../src/hooks/useWalletModal";
import { preparePortfolioDataWithBorrowing } from "../../../src/utils/portfolio.utils";

// Mock dependencies for decomposed architecture
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/useWalletModal");
vi.mock("../../../src/utils/portfolio.utils");

// Mock child components to test error boundaries at different levels
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
    resetKeys?: Array<string | number>;
  },
  {
    hasError: boolean;
    error: Error | null;
    prevResetKeys?: Array<string | number>;
  }
> {
  constructor(props: {
    children: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: Array<string | number>;
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
    props: { resetKeys?: Array<string | number> },
    state: { hasError: boolean; prevResetKeys?: Array<string | number> }
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

const mockPortfolioMetrics = {
  totalValue: 10000,
  totalChangePercentage: 5.2,
  totalChangeValue: 500,
};

describe("WalletPortfolio - Error Boundary and Recovery Tests (Decomposed)", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUsePortfolioDisplayData = vi.mocked(usePortfolioDisplayData);
  const mockUseWalletModal = vi.mocked(useWalletModal);
  const mockPreparePortfolioDataWithBorrowing = vi.mocked(
    preparePortfolioDataWithBorrowing
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

    mockUsePortfolioDisplayData.mockReturnValue({
      totalValue: 15000,
      categories: mockCategories,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: mockPortfolioMetrics,
      toggleBalanceVisibility: vi.fn(),
      toggleCategoryExpansion: vi.fn(),
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockPreparePortfolioDataWithBorrowing.mockReturnValue({
      portfolioData: mockCategories,
      pieChartData: [],
      borrowingData: {
        assetsPieData: [],
        borrowingItems: [],
        netValue: 15000,
        totalBorrowing: 0,
        hasBorrowing: false,
      },
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

    it("should handle usePortfolioDisplayData hook throwing an error", () => {
      const onError = vi.fn();
      mockUsePortfolioDisplayData.mockImplementation(() => {
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
      mockUsePortfolio.mockImplementation(() => {
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

    it("should handle useWalletModal hook throwing an error", () => {
      const onError = vi.fn();
      mockUseWalletModal.mockImplementation(() => {
        throw new Error("Modal state initialization failed");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Modal state initialization failed"
      );
      expect(onError).toHaveBeenCalled();
    });

    it("should handle preparePortfolioDataWithBorrowing throwing an error", () => {
      const onError = vi.fn();
      mockPreparePortfolioDataWithBorrowing.mockImplementation(() => {
        throw new Error("Data transformation failed");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Data transformation failed"
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

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null, // Valid when loading or error
        categories: null,
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
      mockUsePortfolioDisplayData.mockImplementation(() => {
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
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 15000,
        categories: mockCategories,
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

      mockUsePortfolioDisplayData.mockImplementation(() => {
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

      // Make usePortfolio fail when it receives categories from usePortfolioDisplayData
      mockUsePortfolio.mockImplementation(categories => {
        if (categories && categories.length > 0) {
          throw new Error("Cannot process portfolio categories");
        }
        return {
          balanceHidden: false,
          expandedCategory: null,
          portfolioMetrics: null,
          toggleBalanceVisibility: vi.fn(),
          toggleCategoryExpansion: vi.fn(),
        };
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

      mockUsePortfolioDisplayData.mockImplementation(() => {
        if (shouldError) {
          throw new Error("Initial error");
        }
        return {
          totalValue: 15000,
          categories: mockCategories,
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

      mockUsePortfolioDisplayData.mockImplementation(() => {
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

    it("should handle real-world error: malformed API response during data transformation", () => {
      const onError = vi.fn();

      mockPreparePortfolioDataWithBorrowing.mockImplementation(() => {
        throw new Error("Cannot read property 'totalValue' of undefined");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Cannot read property 'totalValue' of undefined"
      );
    });

    it("should handle memory pressure scenarios", () => {
      const onError = vi.fn();

      // Simulate out of memory error
      mockUsePortfolio.mockImplementation(() => {
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
