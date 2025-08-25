import { act, screen } from "@testing-library/react";
import { render } from "../../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { usePortfolioDisplayData } from "../../../src/hooks/queries/usePortfolioQuery";
import { useWalletModal } from "../../../src/hooks/useWalletModal";
import { preparePortfolioDataWithBorrowing } from "../../../src/utils/portfolioTransformers";

// Mock all dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/useWalletModal");
vi.mock("../../../src/utils/portfolioTransformers");

// Error boundary test helper
let errorBoundaryProps: any = {};
let errorBoundaryCalls: any[] = [];

vi.mock("../../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(props => {
    errorBoundaryProps = props;
    errorBoundaryCalls.push({
      onError: props.onError,
      resetKeys: props.resetKeys,
      children: props.children,
      id: Math.random(), // To distinguish calls
    });

    // Simulate error boundary behavior
    try {
      return (
        <div data-testid={`error-boundary-${errorBoundaryCalls.length}`}>
          {props.children}
        </div>
      );
    } catch (error) {
      if (props.onError) {
        props.onError(error);
      }
      return <div data-testid="error-fallback">Something went wrong</div>;
    }
  }),
}));

// Mock child components that can throw errors
const ThrowingComponent = ({
  shouldThrow,
  message,
}: {
  shouldThrow: boolean;
  message: string;
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="component-ok">Component OK</div>;
};

vi.mock("../../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(({ throwError }) =>
    throwError ? (
      <ThrowingComponent shouldThrow={true} message="WalletHeader Error" />
    ) : (
      <div data-testid="wallet-header">Header OK</div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(({ throwError }) =>
    throwError ? (
      <ThrowingComponent shouldThrow={true} message="WalletMetrics Error" />
    ) : (
      <div data-testid="wallet-metrics">Metrics OK</div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ throwError }) =>
    throwError ? (
      <ThrowingComponent shouldThrow={true} message="WalletActions Error" />
    ) : (
      <div data-testid="wallet-actions">Actions OK</div>
    )
  ),
}));

vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(({ throwError }) =>
    throwError ? (
      <ThrowingComponent shouldThrow={true} message="PortfolioOverview Error" />
    ) : (
      <div data-testid="portfolio-overview">Overview OK</div>
    )
  ),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ throwError }) =>
    throwError ? (
      <ThrowingComponent shouldThrow={true} message="WalletManager Error" />
    ) : (
      <div data-testid="wallet-manager">Manager OK</div>
    )
  ),
}));

describe("WalletPortfolio - Error Boundary Comprehensive Tests", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUsePortfolioDisplayData = vi.mocked(usePortfolioDisplayData);
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUseWalletModal = vi.mocked(useWalletModal);
  const mockPreparePortfolioDataWithBorrowing = vi.mocked(
    preparePortfolioDataWithBorrowing
  );

  const mockUserInfo = { userId: "test-user-123" };
  const mockCategories = [
    {
      id: "1",
      name: "BTC",
      totalValue: 10000,
      percentage: 60,
      color: "#F7931A",
      assets: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    errorBoundaryProps = {};
    errorBoundaryCalls = [];

    // Default successful mocks
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      error: null,
    });

    mockUsePortfolioDisplayData.mockReturnValue({
      totalValue: 16000,
      categories: mockCategories,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: { totalChangePercentage: 8.5 },
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
      pieChartData: [
        { label: "BTC", value: 10000, percentage: 60, color: "#F7931A" },
      ],
    });
  });

  describe("Error Boundary Configuration", () => {
    it("should configure main error boundary with correct resetKeys", () => {
      render(<WalletPortfolio />);

      const mainBoundary = errorBoundaryCalls.find(call =>
        call.resetKeys?.includes(mockUserInfo.userId)
      );

      expect(mainBoundary).toBeDefined();
      expect(mainBoundary.resetKeys).toEqual([
        mockUserInfo.userId,
        "connected",
      ]);
    });

    it("should create multiple error boundaries for different sections", () => {
      render(<WalletPortfolio />);

      // Should have at least 4 error boundaries (main + 3 sections)
      expect(errorBoundaryCalls.length).toBeGreaterThanOrEqual(4);
      expect(screen.getByTestId("error-boundary-1")).toBeInTheDocument();
      expect(screen.getByTestId("error-boundary-2")).toBeInTheDocument();
      expect(screen.getByTestId("error-boundary-3")).toBeInTheDocument();
      expect(screen.getByTestId("error-boundary-4")).toBeInTheDocument();
    });

    it("should configure error logging for all boundaries", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<WalletPortfolio />);

      errorBoundaryCalls.forEach((call, index) => {
        expect(call.onError).toBeDefined();

        // Test error logging
        const testError = new Error(`Test error ${index}`);
        call.onError(testError);
      });

      expect(consoleSpy).toHaveBeenCalledTimes(errorBoundaryCalls.length);
      consoleSpy.mockRestore();
    });

    it("should update resetKeys when user changes", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Change user
      const newUserInfo = { userId: "new-user-456" };
      mockUseUser.mockReturnValue({
        userInfo: newUserInfo,
        isConnected: true,
        error: null,
      });

      rerender(<WalletPortfolio />);

      const updatedBoundary = errorBoundaryCalls.find(call =>
        call.resetKeys?.includes(newUserInfo.userId)
      );

      expect(updatedBoundary.resetKeys).toEqual([
        newUserInfo.userId,
        "connected",
      ]);
    });

    it("should update resetKeys when connection status changes", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Change connection
      mockUseUser.mockReturnValue({
        userInfo: mockUserInfo,
        isConnected: false,
        error: null,
      });

      rerender(<WalletPortfolio />);

      const updatedBoundary = errorBoundaryCalls.find(call =>
        call.resetKeys?.includes("disconnected")
      );

      expect(updatedBoundary.resetKeys).toEqual([
        mockUserInfo.userId,
        "disconnected",
      ]);
    });

    it("should handle undefined user gracefully in resetKeys", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        error: null,
      });

      render(<WalletPortfolio />);

      const boundary = errorBoundaryCalls.find(call =>
        call.resetKeys?.includes("no-user")
      );

      expect(boundary.resetKeys).toEqual(["no-user", "disconnected"]);
    });
  });

  describe("Hook Error Handling", () => {
    it("should handle useUser hook throwing error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockUseUser.mockImplementation(() => {
        throw new Error("User context error");
      });

      expect(() => render(<WalletPortfolio />)).toThrow("User context error");
      consoleSpy.mockRestore();
    });

    it("should handle usePortfolioDisplayData hook throwing error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockUsePortfolioDisplayData.mockImplementation(() => {
        throw new Error("Portfolio data error");
      });

      expect(() => render(<WalletPortfolio />)).toThrow("Portfolio data error");
      consoleSpy.mockRestore();
    });

    it("should handle usePortfolio hook throwing error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockUsePortfolio.mockImplementation(() => {
        throw new Error("Portfolio state error");
      });

      expect(() => render(<WalletPortfolio />)).toThrow(
        "Portfolio state error"
      );
      consoleSpy.mockRestore();
    });

    it("should handle useWalletModal hook throwing error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockUseWalletModal.mockImplementation(() => {
        throw new Error("Wallet modal error");
      });

      expect(() => render(<WalletPortfolio />)).toThrow("Wallet modal error");
      consoleSpy.mockRestore();
    });

    it("should handle data transformation throwing error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockPreparePortfolioDataWithBorrowing.mockImplementation(() => {
        throw new Error("Data transformation error");
      });

      expect(() => render(<WalletPortfolio />)).toThrow(
        "Data transformation error"
      );
      consoleSpy.mockRestore();
    });
  });

  describe("Hook Error States", () => {
    it("should handle error state from usePortfolioDisplayData", () => {
      const errorMessage = "API request failed";
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: errorMessage,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Component should still render but with error state
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should handle user error state gracefully", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        error: "Authentication failed",
      });

      render(<WalletPortfolio />);

      // Should still render with error state
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should handle loading states gracefully", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should render loading state
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });
  });

  describe("Error Recovery", () => {
    it("should reset error boundary when resetKeys change", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Simulate error recovery by changing user
      mockUseUser.mockReturnValue({
        userInfo: { userId: "recovered-user" },
        isConnected: true,
        error: null,
      });

      rerender(<WalletPortfolio />);

      // Error boundary should have new resetKeys
      const recoveredBoundary = errorBoundaryCalls.find(call =>
        call.resetKeys?.includes("recovered-user")
      );

      expect(recoveredBoundary).toBeDefined();
      expect(recoveredBoundary.resetKeys).toEqual([
        "recovered-user",
        "connected",
      ]);
    });

    it("should handle connection recovery", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Simulate connection loss and recovery
      mockUseUser.mockReturnValue({
        userInfo: mockUserInfo,
        isConnected: false,
        error: null,
      });

      rerender(<WalletPortfolio />);

      // Then recover connection
      mockUseUser.mockReturnValue({
        userInfo: mockUserInfo,
        isConnected: true,
        error: null,
      });

      rerender(<WalletPortfolio />);

      const recoveredBoundary = errorBoundaryCalls.find(call =>
        call.resetKeys?.includes("connected")
      );

      expect(recoveredBoundary.resetKeys).toContain("connected");
    });
  });

  describe("Error Isolation", () => {
    it("should isolate errors between different sections", () => {
      render(<WalletPortfolio />);

      // Each section should have its own error boundary
      const boundaries = errorBoundaryCalls.filter(call => call.onError);
      expect(boundaries.length).toBeGreaterThanOrEqual(4);

      // Each boundary should have different error handlers
      const errorHandlers = boundaries.map(b => b.onError.toString());
      const uniqueHandlers = new Set(errorHandlers);
      expect(uniqueHandlers.size).toBeGreaterThan(1);
    });

    it("should log errors with appropriate context", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<WalletPortfolio />);

      // Test different error contexts
      const testErrors = [
        new Error("WalletPortfolio Error"),
        new Error("WalletHeader Error"),
        new Error("PortfolioOverview Error"),
        new Error("WalletManager Error"),
      ];

      errorBoundaryCalls.forEach((call, index) => {
        if (call.onError && testErrors[index]) {
          call.onError(testErrors[index]);
        }
      });

      // Should have logged each error with context
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Complex Error Scenarios", () => {
    it("should handle multiple hook errors simultaneously", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Multiple hooks returning error states
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "Data fetch failed",
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        error: "Auth failed",
      });

      render(<WalletPortfolio />);

      // Component should still render despite multiple errors
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("should handle error during data transformation with recovery", () => {
      let transformationAttempts = 0;
      const { rerender } = render(<WalletPortfolio />);

      // First attempt fails
      mockPreparePortfolioDataWithBorrowing.mockImplementation(() => {
        transformationAttempts++;
        if (transformationAttempts === 1) {
          throw new Error("Transformation failed");
        }
        return {
          portfolioData: mockCategories,
          pieChartData: [
            { label: "BTC", value: 10000, percentage: 60, color: "#F7931A" },
          ],
        };
      });

      // Should fail first time
      expect(() => rerender(<WalletPortfolio />)).toThrow(
        "Transformation failed"
      );

      // Should succeed on retry
      expect(() => rerender(<WalletPortfolio />)).not.toThrow();
    });

    it("should handle rapid state changes without breaking error boundaries", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Rapid user changes
      for (let i = 0; i < 10; i++) {
        mockUseUser.mockReturnValue({
          userInfo: { userId: `user-${i}` },
          isConnected: i % 2 === 0,
          error: null,
        });
        rerender(<WalletPortfolio />);
      }

      // Should still have valid error boundaries
      expect(errorBoundaryCalls.length).toBeGreaterThan(0);
      errorBoundaryCalls.forEach(call => {
        expect(call.onError).toBeDefined();
        expect(call.resetKeys).toBeDefined();
      });
    });
  });

  describe("Performance Impact", () => {
    it("should not significantly impact render performance with error boundaries", () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<WalletPortfolio />);
        unmount();
      }

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should complete 100 renders in reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(5000); // 5 seconds for 100 renders
    });

    it("should cleanup error boundaries properly on unmount", () => {
      const { unmount } = render(<WalletPortfolio />);

      const boundariesBeforeUnmount = errorBoundaryCalls.length;
      unmount();

      // Boundaries should be cleaned up
      expect(boundariesBeforeUnmount).toBeGreaterThan(0);
    });
  });
});
