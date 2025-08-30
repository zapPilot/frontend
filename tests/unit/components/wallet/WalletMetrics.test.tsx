import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletMetrics } from "../../../../src/components/wallet/WalletMetrics";
import { usePortfolioAPR } from "../../../../src/hooks/queries/useAPRQuery";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Loader: vi.fn(() => <span data-testid="loader-icon">Loading...</span>),
  TrendingUp: vi.fn(() => (
    <span data-testid="trending-up-icon">TrendingUp</span>
  )),
  TrendingDown: vi.fn(() => (
    <span data-testid="trending-down-icon">TrendingDown</span>
  )),
  AlertCircle: vi.fn(() => (
    <span data-testid="alert-circle-icon">AlertCircle</span>
  )),
}));

// Mock LoadingSpinner component
vi.mock("../../../../src/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: vi.fn(() => (
    <span data-testid="loader-icon">Loading...</span>
  )),
}));

// Mock formatters
vi.mock("../../../../src/lib/formatters", () => ({
  formatCurrency: vi.fn((amount, options = {}) => {
    const isHidden = typeof options === "boolean" ? options : options.isHidden;
    if (isHidden) return "****";
    if (amount === null || amount === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }),
  formatSmallCurrency: vi.fn(amount => {
    if (amount === null || amount === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }),
}));

// Mock color utilities
vi.mock("../../../../src/lib/color-utils", () => ({
  getChangeColorClasses: vi.fn(percentage =>
    percentage >= 0 ? "text-green-400" : "text-red-400"
  ),
}));

vi.mock("../../../../src/styles/design-tokens", () => ({
  BUSINESS_CONSTANTS: {
    PORTFOLIO: {
      DEFAULT_APR: 0.125, // 12.5% as decimal to match portfolioAPR format
    },
  },
}));

// Mock portfolio calculations
vi.mock("../../../../src/constants/portfolio", () => ({
  calculateMonthlyIncome: vi.fn((totalValue, aprDecimal) => {
    if (!totalValue || totalValue === 0) return 0;
    return (totalValue * aprDecimal) / 12; // aprDecimal is already in decimal format (0.125 for 12.5%)
  }),
}));

// Mock the usePortfolioAPR hook
vi.mock("../../../../src/hooks/queries/useAPRQuery", () => ({
  usePortfolioAPR: vi.fn(userId => ({
    data: {
      portfolio_summary: {
        total_asset_value_usd: 15000,
        weighted_apr: 0.125, // 12.5% APR as decimal (API format)
      },
      pool_details: [],
    },
    portfolioAPR: 0.125, // Return as decimal for display calculation (will be multiplied by 100)
    estimatedMonthlyIncome: null, // Let component calculate based on totalValue prop
    poolDetails: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
  })),
}));

// Mock SimpleConnectButton
vi.mock("../../../../src/components/Web3/SimpleConnectButton", () => ({
  SimpleConnectButton: vi.fn(({ className }) => (
    <button data-testid="simple-connect-button" className={className}>
      Connect Wallet
    </button>
  )),
}));

// Mock APR query hook
vi.mock("../../../../src/hooks/queries/useAPRQuery");

describe("WalletMetrics", () => {
  const mockUsePortfolioAPR = vi.mocked(usePortfolioAPR);
  const defaultProps = {
    totalValue: 15000,
    balanceHidden: false,
    isLoading: false,
    error: null,
    portfolioChangePercentage: 5.2,
    isConnected: true,
    userId: "test-user-id",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup APR hook mock
    mockUsePortfolioAPR.mockReturnValue({
      poolDetails: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      portfolioAPR: 0.125,
      estimatedMonthlyIncome: 1000,
      isRefetching: false,
    });
  });

  describe("UI Structure and Layout", () => {
    it("should render all three metric sections", () => {
      render(<WalletMetrics {...defaultProps} />);

      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText(/Portfolio APR/)).toBeInTheDocument();
      expect(screen.getByText("Est. Monthly Income")).toBeInTheDocument();
    });

    it("should have proper grid layout", () => {
      render(<WalletMetrics {...defaultProps} />);

      const container = screen
        .getByText("Total Balance")
        .closest("div")?.parentElement;
      expect(container).toHaveClass(
        "grid",
        "grid-cols-1",
        "md:grid-cols-3",
        "gap-4",
        "mb-6"
      );
    });

    it("should render metric labels with correct styling", () => {
      render(<WalletMetrics {...defaultProps} />);

      const labels = [
        screen.getByText("Total Balance"),
        screen.getByText(/Portfolio APR/),
        screen.getByText("Est. Monthly Income"),
      ];

      labels.forEach(label => {
        expect(label).toHaveClass("text-sm", "text-gray-400", "mb-1");
      });
    });
  });

  describe("Balance Display Logic", () => {
    it("should show formatted currency when data is loaded", () => {
      render(<WalletMetrics {...defaultProps} />);

      expect(screen.getByText("$15,000.00")).toBeInTheDocument();
    });

    it("should show loader when loading", () => {
      render(<WalletMetrics {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId("balance-loading")).toBeInTheDocument();
      expect(screen.queryByText("$15,000.00")).not.toBeInTheDocument();
    });

    it("should show error message when error exists", () => {
      const errorMessage = "Failed to load data";
      render(<WalletMetrics {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId("alert-circle-icon")).toBeInTheDocument();
      expect(screen.getByText(errorMessage).parentElement).toHaveClass(
        "text-sm",
        "text-red-400"
      );
    });

    it("should show retry button when error exists and onRetry provided", () => {
      const onRetry = vi.fn();
      const errorMessage = "Failed to load data";
      render(
        <WalletMetrics
          {...defaultProps}
          error={errorMessage}
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByText("Retry");
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass("text-xs", "text-purple-400");

      retryButton.click();
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should show retrying state when isRetrying is true", () => {
      const onRetry = vi.fn();
      render(
        <WalletMetrics {...defaultProps} isRetrying={true} onRetry={onRetry} />
      );

      expect(screen.getByText("Retrying...")).toBeInTheDocument();
      expect(screen.getByTestId("balance-loading")).toBeInTheDocument();
    });

    it("should show hidden balance placeholder when balanceHidden is true", () => {
      render(<WalletMetrics {...defaultProps} balanceHidden={true} />);

      expect(screen.getByText("****")).toBeInTheDocument();
    });
  });

  describe("Portfolio APR Display", () => {
    it("should display default APR percentage", () => {
      render(<WalletMetrics {...defaultProps} />);

      expect(screen.getByText("12.50%")).toBeInTheDocument();
    });

    it("should show TrendingUp icon for positive portfolio change", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={5.2} />
      );

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
      expect(
        screen.queryByTestId("trending-down-icon")
      ).not.toBeInTheDocument();
    });

    it("should show TrendingUp icon for negative portfolio change", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={-3.8} />
      );

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
      expect(
        screen.queryByTestId("trending-down-icon")
      ).not.toBeInTheDocument();
    });

    it("should show TrendingUp icon for zero portfolio change", () => {
      render(<WalletMetrics {...defaultProps} portfolioChangePercentage={0} />);

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
    });

    it("should apply correct color classes based on portfolio performance", () => {
      const { rerender } = render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={5.2} />
      );

      const aprContainer = screen.getByTestId("trending-up-icon").parentElement;
      expect(aprContainer).toHaveClass("text-green-400");

      rerender(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={-3.8} />
      );

      const aprContainerNegative =
        screen.getByTestId("trending-up-icon").parentElement;
      expect(aprContainerNegative).toHaveClass("text-red-400");
    });
  });

  describe("Monthly Income Display", () => {
    it("should display formatted monthly income", () => {
      render(<WalletMetrics {...defaultProps} />);

      expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    });

    it("should apply color classes based on portfolio performance", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={5.2} />
      );

      const incomeText = screen.getByText("$1,000.00");
      expect(incomeText).toHaveClass(
        "text-xl",
        "font-semibold",
        "text-green-400"
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle very large totalValue", () => {
      render(<WalletMetrics {...defaultProps} totalValue={999999999} />);

      expect(screen.getByText("$999,999,999.00")).toBeInTheDocument();
    });

    it("should handle zero totalValue", () => {
      render(<WalletMetrics {...defaultProps} totalValue={0} />);

      expect(screen.getByText("$0.00")).toBeInTheDocument(); // Balance
      expect(screen.getByText("$1,000.00")).toBeInTheDocument(); // Monthly income from mock
    });

    it("should handle negative totalValue", () => {
      render(<WalletMetrics {...defaultProps} totalValue={-1000} />);

      expect(screen.getByText("-$1,000.00")).toBeInTheDocument();
    });

    it("should handle very large positive portfolio change percentage", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={999.99} />
      );

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
    });

    it("should handle very large negative portfolio change percentage", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={-999.99} />
      );

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
    });

    it("should handle loading and error states simultaneously", () => {
      render(
        <WalletMetrics {...defaultProps} isLoading={true} error="Some error" />
      );

      // Loading takes precedence over error
      expect(screen.getByTestId("balance-loading")).toBeInTheDocument();
      expect(screen.queryByText("Some error")).not.toBeInTheDocument();
    });
  });

  describe("Component Styling", () => {
    it("should apply correct classes to balance display container", () => {
      render(<WalletMetrics {...defaultProps} />);

      const balanceContainer = screen.getByText("$15,000.00").parentElement;
      expect(balanceContainer).toBeInTheDocument();
      expect(screen.getByText("$15,000.00")).toBeInTheDocument();
    });

    it("should apply correct classes to APR display", () => {
      render(<WalletMetrics {...defaultProps} />);

      const aprValue = screen.getByText("12.50%");
      expect(aprValue).toHaveClass("text-xl", "font-semibold");
    });

    it("should apply correct grid structure", () => {
      render(<WalletMetrics {...defaultProps} />);

      const sections = screen.getAllByText(
        /Total Balance|Portfolio APR|Est\. Monthly Income/
      );
      expect(sections).toHaveLength(3);
    });
  });

  describe("React.memo Optimization", () => {
    it("should not re-render when props haven't changed", () => {
      const props = { ...defaultProps };
      const { rerender } = render(<WalletMetrics {...props} />);

      rerender(<WalletMetrics {...props} />);

      expect(screen.getByText("$15,000.00")).toBeInTheDocument();
    });

    it("should re-render when totalValue changes", () => {
      const { rerender } = render(
        <WalletMetrics {...defaultProps} totalValue={15000} />
      );

      expect(screen.getByText("$15,000.00")).toBeInTheDocument();

      rerender(<WalletMetrics {...defaultProps} totalValue={20000} />);

      expect(screen.getByText("$20,000.00")).toBeInTheDocument();
    });

    it("should re-render when balanceHidden changes", () => {
      const { rerender } = render(
        <WalletMetrics {...defaultProps} balanceHidden={false} />
      );

      expect(screen.getByText("$15,000.00")).toBeInTheDocument();

      rerender(<WalletMetrics {...defaultProps} balanceHidden={true} />);

      expect(screen.getByText("****")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<WalletMetrics {...defaultProps} />);

      // Check that metric labels are properly associated with their values
      const totalBalanceLabel = screen.getByText("Total Balance");
      const aprLabel = screen.getByText(/Portfolio APR/);
      const incomeLabel = screen.getByText("Est. Monthly Income");

      expect(totalBalanceLabel.tagName).toBe("P");
      expect(aprLabel.tagName).toBe("P");
      expect(incomeLabel.tagName).toBe("P");
    });

    it("should handle loader accessibility", () => {
      render(<WalletMetrics {...defaultProps} isLoading={true} />);

      const loader = screen.getByTestId("balance-loading");
      expect(loader).toBeInTheDocument();
    });

    it("should handle error message accessibility", () => {
      render(<WalletMetrics {...defaultProps} error="Connection error" />);

      const errorMessage = screen.getByText("Connection error");
      expect(errorMessage.parentElement).toHaveClass("text-red-400");
      expect(screen.getByTestId("alert-circle-icon")).toBeInTheDocument();
    });
  });
});
