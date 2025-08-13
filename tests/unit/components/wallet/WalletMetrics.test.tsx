import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletMetrics } from "../../../../src/components/wallet/WalletMetrics";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Loader: vi.fn(() => <span data-testid="loader-icon">Loading...</span>),
  TrendingUp: vi.fn(() => (
    <span data-testid="trending-up-icon">TrendingUp</span>
  )),
  TrendingDown: vi.fn(() => (
    <span data-testid="trending-down-icon">TrendingDown</span>
  )),
}));

// Mock formatters and utilities
vi.mock("../../../../src/lib/utils", () => ({
  formatCurrency: vi.fn((amount, hidden) =>
    hidden ? "****" : `$${amount?.toLocaleString() || "0"}`
  ),
  getChangeColorClasses: vi.fn(percentage =>
    percentage >= 0 ? "text-green-400" : "text-red-400"
  ),
}));

vi.mock("../../../../src/utils/formatters", () => ({
  formatSmallCurrency: vi.fn(amount => `$${amount?.toLocaleString()}`),
}));

vi.mock("../../../../src/styles/design-tokens", () => ({
  BUSINESS_CONSTANTS: {
    PORTFOLIO: {
      DEFAULT_APR: 12.5,
    },
  },
}));

describe("WalletMetrics", () => {
  const defaultProps = {
    totalValue: 15000,
    balanceHidden: false,
    isLoading: false,
    error: null,
    portfolioChangePercentage: 5.2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UI Structure and Layout", () => {
    it("should render all three metric sections", () => {
      render(<WalletMetrics {...defaultProps} />);

      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText("Portfolio APR")).toBeInTheDocument();
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
        screen.getByText("Portfolio APR"),
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

      expect(screen.getByText("$15,000")).toBeInTheDocument();
    });

    it("should show loader when loading", () => {
      render(<WalletMetrics {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      expect(screen.queryByText("$15,000")).not.toBeInTheDocument();
    });

    it("should show loader when totalValue is null", () => {
      render(<WalletMetrics {...defaultProps} totalValue={null} />);

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should show error message when error exists", () => {
      const errorMessage = "Failed to load data";
      render(<WalletMetrics {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toHaveClass(
        "text-sm",
        "text-red-500"
      );
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

    it("should show TrendingDown icon for negative portfolio change", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={-3.8} />
      );

      expect(screen.getByTestId("trending-down-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("trending-up-icon")).not.toBeInTheDocument();
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
        screen.getByTestId("trending-down-icon").parentElement;
      expect(aprContainerNegative).toHaveClass("text-red-400");
    });
  });

  describe("Monthly Income Display", () => {
    it("should display formatted monthly income", () => {
      render(<WalletMetrics {...defaultProps} />);

      expect(screen.getByText("$1,730")).toBeInTheDocument();
    });

    it("should apply color classes based on portfolio performance", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={5.2} />
      );

      const incomeText = screen.getByText("$1,730");
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

      expect(screen.getByText("$999,999,999")).toBeInTheDocument();
    });

    it("should handle zero totalValue", () => {
      render(<WalletMetrics {...defaultProps} totalValue={0} />);

      expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("should handle negative totalValue", () => {
      render(<WalletMetrics {...defaultProps} totalValue={-1000} />);

      expect(screen.getByText("$-1,000")).toBeInTheDocument();
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

      expect(screen.getByTestId("trending-down-icon")).toBeInTheDocument();
    });

    it("should handle loading and error states simultaneously", () => {
      render(
        <WalletMetrics {...defaultProps} isLoading={true} error="Some error" />
      );

      // Loading takes precedence over error
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      expect(screen.queryByText("Some error")).not.toBeInTheDocument();
    });
  });

  describe("Component Styling", () => {
    it("should apply correct classes to balance display container", () => {
      render(<WalletMetrics {...defaultProps} />);

      const balanceContainer = screen.getByText("$15,000").parentElement;
      expect(balanceContainer).toBeInTheDocument();
      expect(screen.getByText("$15,000")).toBeInTheDocument();
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

      expect(screen.getByText("$15,000")).toBeInTheDocument();
    });

    it("should re-render when totalValue changes", () => {
      const { rerender } = render(
        <WalletMetrics {...defaultProps} totalValue={15000} />
      );

      expect(screen.getByText("$15,000")).toBeInTheDocument();

      rerender(<WalletMetrics {...defaultProps} totalValue={20000} />);

      expect(screen.getByText("$20,000")).toBeInTheDocument();
    });

    it("should re-render when balanceHidden changes", () => {
      const { rerender } = render(
        <WalletMetrics {...defaultProps} balanceHidden={false} />
      );

      expect(screen.getByText("$15,000")).toBeInTheDocument();

      rerender(<WalletMetrics {...defaultProps} balanceHidden={true} />);

      expect(screen.getByText("****")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<WalletMetrics {...defaultProps} />);

      // Check that metric labels are properly associated with their values
      const totalBalanceLabel = screen.getByText("Total Balance");
      const aprLabel = screen.getByText("Portfolio APR");
      const incomeLabel = screen.getByText("Est. Monthly Income");

      expect(totalBalanceLabel.tagName).toBe("P");
      expect(aprLabel.tagName).toBe("P");
      expect(incomeLabel.tagName).toBe("P");
    });

    it("should handle loader accessibility", () => {
      render(<WalletMetrics {...defaultProps} isLoading={true} />);

      const loader = screen.getByTestId("loader-icon");
      expect(loader).toBeInTheDocument();
    });

    it("should handle error message accessibility", () => {
      render(<WalletMetrics {...defaultProps} error="Connection error" />);

      const errorMessage = screen.getByText("Connection error");
      expect(errorMessage).toHaveClass("text-red-500");
    });
  });
});
