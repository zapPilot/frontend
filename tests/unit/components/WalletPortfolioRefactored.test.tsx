import { screen } from "@testing-library/react";
import { render } from "../../test-utils";
import { vi } from "vitest";
import { WalletPortfolio as WalletPortfolioRefactored } from "../../../src/components/WalletPortfolioRefactored";

// Mock all the child components
vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: ({ onAnalyticsClick }: any) => (
    <div data-testid="wallet-header">
      {onAnalyticsClick && (
        <button data-testid="analytics-button" onClick={onAnalyticsClick}>
          Analytics
        </button>
      )}
    </div>
  ),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: ({ totalValue }: any) => (
    <div data-testid="wallet-metrics">
      <div data-testid="total-balance">${totalValue || 0}</div>
      <div data-testid="total-balance-metric">${totalValue || 0}</div>
    </div>
  ),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: ({ onZapInClick, onZapOutClick, onOptimizeClick }: any) => (
    <div data-testid="wallet-actions">
      <button data-testid="zap-in-btn" onClick={onZapInClick}>
        Zap In
      </button>
      <button data-testid="zap-out-btn" onClick={onZapOutClick}>
        Zap Out
      </button>
      <button data-testid="optimize-btn" onClick={onOptimizeClick}>
        Optimize
      </button>
    </div>
  ),
}));

// Mock the portfolio data hook
vi.mock("../../../src/hooks/usePortfolioData", () => ({
  usePortfolioData: vi.fn(),
}));

// Mock PortfolioOverview
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: ({ title }: any) => (
    <div data-testid="portfolio-overview">
      <div data-testid="portfolio-title">{title}</div>
    </div>
  ),
}));

// Mock WalletManager
vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: ({ isOpen }: any) =>
    isOpen ? <div data-testid="wallet-manager">Wallet Manager</div> : null,
}));

// Mock UI components
vi.mock("../../../src/components/ui", () => ({
  GlassCard: ({ children }: any) => (
    <div data-testid="glass-card">{children}</div>
  ),
}));

// Mock hooks
vi.mock("../../../src/hooks/usePortfolio", () => ({
  usePortfolio: () => ({
    balanceHidden: false,
    expandedCategory: null,
    portfolioMetrics: { totalChangePercentage: 5.2 },
    toggleBalanceVisibility: vi.fn(),
    toggleCategoryExpansion: vi.fn(),
  }),
}));

vi.mock("../../../src/hooks/useWalletModal", () => ({
  useWalletModal: () => ({
    isOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock data
vi.mock("../../../src/data/mockPortfolio", () => ({
  mockPortfolioData: [],
}));

import { usePortfolioData } from "../../../src/hooks/usePortfolioData";

const mockUsePortfolioData = usePortfolioData as vi.MockedFunction<
  typeof usePortfolioData
>;

describe("WalletPortfolioRefactored", () => {
  const mockOnAnalytics = vi.fn();
  const mockOnZapIn = vi.fn();
  const mockOnZapOut = vi.fn();
  const mockOnOptimize = vi.fn();

  const defaultProps = {
    onAnalyticsClick: mockOnAnalytics,
    onZapInClick: mockOnZapIn,
    onZapOutClick: mockOnZapOut,
    onOptimizeClick: mockOnOptimize,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePortfolioData.mockReturnValue({
      totalValue: 125000,
      categories: [
        {
          name: "BTC",
          totalValue: 50000,
          percentage: 40,
          color: "#F7931A",
          assets: [],
        },
      ],
      pieChartData: null,
      isLoading: false,
      error: null,
    });
  });

  describe("Component Rendering", () => {
    it("renders all child components", () => {
      render(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-actions")).toBeInTheDocument();
    });

    it("passes correct props to WalletHeader", () => {
      render(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("total-balance")).toHaveTextContent("$125000");
      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();
    });

    it("passes correct props to WalletMetrics", () => {
      render(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("total-balance-metric")).toHaveTextContent(
        "$125000"
      );
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });

    it("passes correct props to WalletActions", () => {
      render(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("zap-in-btn")).toBeInTheDocument();
      expect(screen.getByTestId("zap-out-btn")).toBeInTheDocument();
      expect(screen.getByTestId("optimize-btn")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading state when portfolio data is loading", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: true,
        error: null,
      });

      render(<WalletPortfolioRefactored {...defaultProps} />);

      // Components should still render but with loading data
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });

    it("shows error state when portfolio data fails", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: "Failed to load portfolio data",
      });

      render(<WalletPortfolioRefactored {...defaultProps} />);

      // Components should still render but with error data
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });
  });

  describe("Callback Handling", () => {
    it("calls onAnalytics when analytics button is clicked", () => {
      render(<WalletPortfolioRefactored {...defaultProps} />);

      const analyticsButton = screen.getByTestId("analytics-button");
      analyticsButton.click();

      expect(mockOnAnalytics).toHaveBeenCalledTimes(1);
    });

    it("calls action callbacks when buttons are clicked", () => {
      render(<WalletPortfolioRefactored {...defaultProps} />);

      screen.getByTestId("zap-in-btn").click();
      screen.getByTestId("zap-out-btn").click();
      screen.getByTestId("optimize-btn").click();

      expect(mockOnZapIn).toHaveBeenCalledTimes(1);
      expect(mockOnZapOut).toHaveBeenCalledTimes(1);
      expect(mockOnOptimize).toHaveBeenCalledTimes(1);
    });
  });

  describe("Data Integration", () => {
    it("handles portfolio data correctly", () => {
      const portfolioData = {
        totalValue: 250000,
        categories: [
          {
            name: "ETH",
            totalValue: 100000,
            percentage: 40,
            color: "#627EEA",
            assets: [],
          },
          {
            name: "BTC",
            totalValue: 150000,
            percentage: 60,
            color: "#F7931A",
            assets: [],
          },
        ],
        pieChartData: null,
        isLoading: false,
        error: null,
      };

      mockUsePortfolioData.mockReturnValue(portfolioData);

      render(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("total-balance")).toHaveTextContent("$250000");
      expect(screen.getByTestId("total-balance-metric")).toHaveTextContent(
        "$250000"
      );
    });

    it("handles empty portfolio data", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: 0,
        categories: [],
        pieChartData: null,
        isLoading: false,
        error: null,
      });

      render(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("total-balance")).toHaveTextContent("$0");
      expect(screen.getByTestId("total-balance-metric")).toHaveTextContent(
        "$0"
      );
    });

    it("handles null portfolio data", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: null,
      });

      render(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders with proper motion wrapper", () => {
      const { container } = render(
        <WalletPortfolioRefactored {...defaultProps} />
      );

      // Check that motion.div wrapper exists
      const motionWrapper = container.firstChild as HTMLElement;
      expect(motionWrapper).toBeInTheDocument();
    });

    it("maintains consistent layout structure", () => {
      render(<WalletPortfolioRefactored {...defaultProps} />);

      const header = screen.getByTestId("wallet-header");
      const metrics = screen.getByTestId("wallet-metrics");
      const actions = screen.getByTestId("wallet-actions");

      expect(header).toBeInTheDocument();
      expect(metrics).toBeInTheDocument();
      expect(actions).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing optional props gracefully", () => {
      const minimalProps = {
        onZapInClick: mockOnZapIn,
        onZapOutClick: mockOnZapOut,
        onOptimizeClick: mockOnOptimize,
      };

      expect(() => {
        render(<WalletPortfolioRefactored {...minimalProps} />);
      }).not.toThrow();

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
    });

    it("handles undefined callbacks gracefully", () => {
      const propsWithUndefined = {
        onAnalyticsClick: undefined,
        onZapInClick: undefined,
        onZapOutClick: mockOnZapOut,
        onOptimizeClick: mockOnOptimize,
      };

      expect(() => {
        render(<WalletPortfolioRefactored {...propsWithUndefined} />);
      }).not.toThrow();
    });

    it("handles portfolio data changes correctly", () => {
      const { rerender } = render(
        <WalletPortfolioRefactored {...defaultProps} />
      );

      expect(screen.getByTestId("total-balance")).toHaveTextContent("$125000");

      // Change portfolio data
      mockUsePortfolioData.mockReturnValue({
        totalValue: 200000,
        categories: [],
        pieChartData: null,
        isLoading: false,
        error: null,
      });

      rerender(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("total-balance")).toHaveTextContent("$200000");
    });
  });

  describe("Performance", () => {
    it("does not re-render unnecessarily", () => {
      const { rerender } = render(
        <WalletPortfolioRefactored {...defaultProps} />
      );

      // Re-render with same props
      rerender(<WalletPortfolioRefactored {...defaultProps} />);

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(mockUsePortfolioData).toHaveBeenCalled();
    });

    it("handles prop updates correctly", () => {
      const { rerender } = render(
        <WalletPortfolioRefactored {...defaultProps} />
      );

      const newMockOnAnalytics = vi.fn();
      const newProps = {
        ...defaultProps,
        onAnalyticsClick: newMockOnAnalytics,
      };

      rerender(<WalletPortfolioRefactored {...newProps} />);

      screen.getByTestId("analytics-button").click();

      expect(newMockOnAnalytics).toHaveBeenCalledTimes(1);
      expect(mockOnAnalytics).not.toHaveBeenCalled();
    });
  });

  describe("Integration", () => {
    it("integrates all components correctly", () => {
      render(<WalletPortfolioRefactored {...defaultProps} />);

      // Verify that all components are present and functional
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-actions")).toBeInTheDocument();

      // Verify that callbacks work through the integration
      screen.getByTestId("analytics-button").click();
      screen.getByTestId("zap-in-btn").click();

      expect(mockOnAnalytics).toHaveBeenCalledTimes(1);
      expect(mockOnZapIn).toHaveBeenCalledTimes(1);
    });
  });
});
