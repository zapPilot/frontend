import React, { ErrorInfo, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";

// Mock the hook
vi.mock("../../../src/hooks/useWalletPortfolioState");

// Test Error Boundary Component
class TestErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }) {
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
          <button 
            data-testid="reset-error" 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mock child components that can throw errors
vi.mock("../../../src/components/ui/GlassCard", () => ({
  GlassCard: vi.fn(({ children, throwError }: { children: ReactNode; throwError?: boolean }) => {
    if (throwError) {
      throw new Error("GlassCard render error");
    }
    return <div data-testid="glass-card">{children}</div>;
  }),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(({ throwError, onAnalyticsClick }: { throwError?: boolean; onAnalyticsClick?: () => void }) => {
    if (throwError) {
      throw new Error("WalletHeader render error");
    }
    return (
      <div data-testid="wallet-header">
        {onAnalyticsClick && (
          <button data-testid="analytics-button" onClick={onAnalyticsClick}>
            Analytics
          </button>
        )}
      </div>
    );
  }),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(({ throwError, totalValue }: { throwError?: boolean; totalValue?: number | null }) => {
    if (throwError) {
      throw new Error("WalletMetrics render error");
    }
    return (
      <div data-testid="wallet-metrics">
        <div data-testid="total-value">${totalValue}</div>
      </div>
    );
  }),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ throwError, onZapInClick }: { throwError?: boolean; onZapInClick?: () => void }) => {
    if (throwError) {
      throw new Error("WalletActions render error");
    }
    return (
      <div data-testid="wallet-actions">
        <button data-testid="zap-in-button" onClick={onZapInClick}>Zap In</button>
      </div>
    );
  }),
}));

vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(({ 
    throwError, 
    onRetry, 
    apiError,
    isLoading 
  }: { 
    throwError?: boolean; 
    onRetry?: () => void;
    apiError?: string | null;
    isLoading?: boolean;
  }) => {
    if (throwError) {
      throw new Error("PortfolioOverview render error");
    }
    return (
      <div data-testid="portfolio-overview">
        <div data-testid="api-error">{apiError || "no-error"}</div>
        <div data-testid="loading-state">{isLoading ? "loading" : "not-loading"}</div>
        {onRetry && (
          <button data-testid="retry-button" onClick={onRetry}>Retry</button>
        )}
      </div>
    );
  }),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen, onClose, throwError }: { 
    isOpen: boolean; 
    onClose: () => void;
    throwError?: boolean;
  }) => {
    if (throwError && isOpen) {
      throw new Error("WalletManager render error");
    }
    return isOpen ? (
      <div data-testid="wallet-manager">
        <button data-testid="close-modal" onClick={onClose}>Close</button>
      </div>
    ) : null;
  }),
}));

describe("WalletPortfolio - Error Boundary and Recovery Tests", () => {
  const mockUseWalletPortfolioState = vi.mocked(useWalletPortfolioState);

  const defaultMockState = {
    totalValue: 15000,
    portfolioData: [],
    pieChartData: [],
    isLoading: false,
    apiError: null,
    retry: vi.fn(),
    isRetrying: false,
    balanceHidden: false,
    expandedCategory: null,
    portfolioMetrics: { totalChangePercentage: 5.2 },
    toggleBalanceVisibility: vi.fn(),
    toggleCategoryExpansion: vi.fn(),
    isWalletManagerOpen: false,
    openWalletManager: vi.fn(),
    closeWalletManager: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWalletPortfolioState.mockReturnValue(defaultMockState);
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
      expect(screen.getByTestId("error-message")).toHaveTextContent("Hook execution error");
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Hook execution error" }),
        expect.any(Object)
      );
    });

    it("should handle undefined hook return value", () => {
      const onError = vi.fn();
      mockUseWalletPortfolioState.mockReturnValue(undefined as any);

      expect(() => {
        render(
          <TestErrorBoundary onError={onError}>
            <WalletPortfolio />
          </TestErrorBoundary>
        );
      }).not.toThrow();

      // Component should either handle gracefully or be caught by error boundary
    });

    it("should handle partial hook state", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 1000,
        isLoading: false,
        // Missing other required properties
      } as any);

      const onError = vi.fn();

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should handle gracefully without throwing
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
    });
  });

  describe("Child Component Error Handling", () => {
    it("should catch errors from GlassCard component", () => {
      const onError = vi.fn();
      vi.mocked(require("../../../src/components/ui/GlassCard").GlassCard).mockImplementation(() => {
        throw new Error("GlassCard render error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("GlassCard render error");
    });

    it("should catch errors from WalletHeader component", () => {
      const onError = vi.fn();
      vi.mocked(require("../../../src/components/wallet/WalletHeader").WalletHeader).mockImplementation(() => {
        throw new Error("WalletHeader render error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("WalletHeader render error");
    });

    it("should catch errors from WalletMetrics component", () => {
      const onError = vi.fn();
      vi.mocked(require("../../../src/components/wallet/WalletMetrics").WalletMetrics).mockImplementation(() => {
        throw new Error("WalletMetrics render error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("WalletMetrics render error");
    });

    it("should catch errors from WalletActions component", () => {
      const onError = vi.fn();
      vi.mocked(require("../../../src/components/wallet/WalletActions").WalletActions).mockImplementation(() => {
        throw new Error("WalletActions render error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("WalletActions render error");
    });

    it("should catch errors from PortfolioOverview component", () => {
      const onError = vi.fn();
      vi.mocked(require("../../../src/components/PortfolioOverview").PortfolioOverview).mockImplementation(() => {
        throw new Error("PortfolioOverview render error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("PortfolioOverview render error");
    });

    it("should catch errors from WalletManager modal when open", () => {
      const onError = vi.fn();
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
      });

      vi.mocked(require("../../../src/components/WalletManager").WalletManager).mockImplementation(() => {
        throw new Error("WalletManager render error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("WalletManager render error");
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("should recover from error boundary after reset", async () => {
      const onError = vi.fn();
      
      // First render with error
      mockUseWalletPortfolioState.mockImplementationOnce(() => {
        throw new Error("Initial error");
      });

      const { rerender } = render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();

      // Reset error boundary
      fireEvent.click(screen.getByTestId("reset-error"));

      // Mock successful state for next render
      mockUseWalletPortfolioState.mockReturnValue(defaultMockState);

      rerender(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should render successfully now
      await waitFor(() => {
        expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
        expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      });
    });

    it("should handle callback errors gracefully", () => {
      const onError = vi.fn();
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio onAnalyticsClick={errorCallback} />
        </TestErrorBoundary>
      );

      // Click should trigger error in callback
      expect(() => {
        fireEvent.click(screen.getByTestId("analytics-button"));
      }).toThrow("Callback error");
    });

    it("should recover from API errors", async () => {
      const retryMock = vi.fn();
      
      // Start with API error
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: "Network failure",
        totalValue: null,
        retry: retryMock,
      });

      const { rerender } = render(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("api-error")).toHaveTextContent("Network failure");
      
      // Trigger retry
      fireEvent.click(screen.getByTestId("retry-button"));
      expect(retryMock).toHaveBeenCalledTimes(1);

      // Simulate successful recovery
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: null,
        totalValue: 20000,
      });

      rerender(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent("no-error");
        expect(screen.getByTestId("total-value")).toHaveTextContent("$20000");
      });
    });

    it("should handle loading to error to success cycle", async () => {
      // Start with loading
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isLoading: true,
        totalValue: null,
      });

      const { rerender } = render(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");

      // Transition to error
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isLoading: false,
        apiError: "Load failed",
        totalValue: null,
      });

      rerender(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("loading-state")).toHaveTextContent("not-loading");
      expect(screen.getByTestId("api-error")).toHaveTextContent("Load failed");

      // Transition to success
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isLoading: false,
        apiError: null,
        totalValue: 25000,
      });

      rerender(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent("no-error");
        expect(screen.getByTestId("total-value")).toHaveTextContent("$25000");
      });
    });
  });

  describe("Error Context and Information", () => {
    it("should provide meaningful error context in error boundary", () => {
      const onError = vi.fn();
      mockUseWalletPortfolioState.mockImplementation(() => {
        throw new Error("Context error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Context error",
          stack: expect.stringContaining("Context error"),
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("should handle errors with additional context", () => {
      const onError = vi.fn();
      const complexError = new Error("Complex error");
      complexError.stack = "Complex error stack trace";
      
      mockUseWalletPortfolioState.mockImplementation(() => {
        throw complexError;
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(complexError, expect.any(Object));
    });
  });

  describe("Multiple Error Scenarios", () => {
    it("should handle sequential errors", () => {
      const onError = vi.fn();
      
      // First error
      mockUseWalletPortfolioState.mockImplementationOnce(() => {
        throw new Error("First error");
      });

      const { rerender } = render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-message")).toHaveTextContent("First error");

      // Reset and cause second error
      fireEvent.click(screen.getByTestId("reset-error"));

      mockUseWalletPortfolioState.mockImplementationOnce(() => {
        throw new Error("Second error");
      });

      rerender(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-message")).toHaveTextContent("Second error");
      expect(onError).toHaveBeenCalledTimes(2);
    });

    it("should handle concurrent error scenarios", async () => {
      const onError = vi.fn();
      
      // Mock multiple components throwing errors
      vi.mocked(require("../../../src/components/wallet/WalletHeader").WalletHeader).mockImplementation(() => {
        throw new Error("Header error");
      });

      render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should only catch the first error encountered
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("should handle errors during different lifecycle phases", async () => {
      const onError = vi.fn();
      
      // Error during initial render
      mockUseWalletPortfolioState.mockImplementationOnce(() => {
        throw new Error("Mount error");
      });

      const { rerender } = render(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId("error-message")).toHaveTextContent("Mount error");

      // Reset and simulate update error
      fireEvent.click(screen.getByTestId("reset-error"));

      mockUseWalletPortfolioState.mockReturnValue(defaultMockState);

      rerender(
        <TestErrorBoundary onError={onError}>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should render successfully after reset
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });
  });

  describe("Error Prevention and Resilience", () => {
    it("should handle null/undefined props gracefully", () => {
      render(
        <TestErrorBoundary>
          <WalletPortfolio 
            onAnalyticsClick={undefined}
            onOptimizeClick={null as any}
            onZapInClick={undefined}
            onZapOutClick={null as any}
          />
        </TestErrorBoundary>
      );

      // Should render without errors despite undefined/null props
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });

    it("should handle extreme state values", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        totalValue: Number.POSITIVE_INFINITY,
        portfolioMetrics: { totalChangePercentage: Number.NEGATIVE_INFINITY },
      });

      render(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should handle infinite values without crashing
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
      expect(screen.getByTestId("total-value")).toHaveTextContent("$Infinity");
    });

    it("should handle malformed data structures", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        portfolioData: "invalid data" as any,
        pieChartData: { invalid: "structure" } as any,
      });

      render(
        <TestErrorBoundary>
          <WalletPortfolio />
        </TestErrorBoundary>
      );

      // Should handle gracefully (components should validate their props)
      expect(screen.queryByTestId("error-boundary")).not.toBeInTheDocument();
    });
  });
});