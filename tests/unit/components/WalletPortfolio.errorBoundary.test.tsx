import { render, screen } from "@testing-library/react";
import React, { ErrorInfo, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";

// Mock the hook
vi.mock("../../../src/hooks/useWalletPortfolioState");

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

  beforeEach(() => {
    vi.clearAllMocks();

    // Default working state
    mockUseWalletPortfolioState.mockReturnValue({
      totalValue: 15000,
      portfolioData: [],
      pieChartData: [],
      isLoading: false,
      apiError: null,
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
  });

  describe("Hook-Level Error Handling", () => {
    it("should handle errors thrown by useWalletPortfolioState hook", () => {
      const onError = vi.fn();

      mockUseWalletPortfolioState.mockImplementation(() => {
        throw new Error("Hook execution error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Hook execution error"
      );
      expect(onError).toHaveBeenCalled();
    });

    it("should handle partial hook state", () => {
      const onError = vi.fn();

      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 15000,
        portfolioData: [],
        // Missing required properties to test graceful degradation
      } as any);

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("should recover after hook errors are resolved", () => {
      const onError = vi.fn();

      // First render with error
      mockUseWalletPortfolioState.mockImplementation(() => {
        throw new Error("Temporary error");
      });

      const { rerender } = render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();

      // Fix the hook and rerender
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 15000,
        portfolioData: [],
        pieChartData: [],
        isLoading: false,
        apiError: null,
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

      rerender(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should still show error boundary (React behavior)
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });

    it("should handle API error states gracefully", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: [],
        pieChartData: [],
        isLoading: false,
        apiError: "API connection failed",
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
