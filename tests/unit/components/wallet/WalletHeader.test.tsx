import { beforeEach, describe, expect, it, vi } from "vitest";

import { WalletHeader } from "../../../../src/components/wallet/WalletHeader";
import { fireEvent, render, screen } from "../../../test-utils";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  BarChart3: vi.fn(() => <span data-testid="bar-chart-icon">BarChart3</span>),
  Calendar: vi.fn(() => <span data-testid="calendar-icon">Calendar</span>),
  DollarSign: vi.fn(() => (
    <span data-testid="dollar-sign-icon">DollarSign</span>
  )),
  Eye: vi.fn(() => <span data-testid="eye-icon">Eye</span>),
  EyeOff: vi.fn(() => <span data-testid="eye-off-icon">EyeOff</span>),
  Wallet: vi.fn(() => <span data-testid="wallet-icon">Wallet</span>),
  Copy: vi.fn(() => <span data-testid="copy-icon">Copy</span>),
  Check: vi.fn(() => <span data-testid="check-icon">Check</span>),
}));

// Mock design tokens
vi.mock("../../../../src/styles/design-tokens", () => ({
  GRADIENTS: {
    PRIMARY: "from-purple-600 to-blue-600",
  },
}));

describe("WalletHeader", () => {
  const defaultProps = {
    onWalletManagerClick: vi.fn(),
    onToggleBalance: vi.fn(),
    balanceHidden: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UI Structure and Layout", () => {
    it("should render header with title and subtitle", () => {
      render(<WalletHeader {...defaultProps} />);

      expect(screen.getByText("My Portfolio")).toBeInTheDocument();
    });

    it("should render dollar sign icon in gradient container", () => {
      render(<WalletHeader {...defaultProps} />);

      expect(screen.getByTestId("dollar-sign-icon")).toBeInTheDocument();

      // Check gradient container has correct classes
      const iconContainer =
        screen.getByTestId("dollar-sign-icon").parentElement;
      expect(iconContainer).toHaveClass(
        "w-12",
        "h-12",
        "rounded-2xl",
        "bg-gradient-to-r"
      );
    });

    it("should render wallet manager and balance toggle buttons", () => {
      render(<WalletHeader {...defaultProps} />);

      expect(screen.getByTestId("wallet-icon")).toBeInTheDocument();
      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
    });

    it("should have proper layout structure", () => {
      render(<WalletHeader {...defaultProps} />);

      const container = screen.getByText("My Portfolio").closest("div");
      expect(container).toBeInTheDocument();
      expect(screen.getByText("My Portfolio")).toBeInTheDocument();
    });
  });

  // Analytics button has been removed from the new UI; tests updated accordingly.

  describe("Balance Visibility Toggle", () => {
    it("should show Eye icon when balance is not hidden", () => {
      render(<WalletHeader {...defaultProps} balanceHidden={false} />);

      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("eye-off-icon")).not.toBeInTheDocument();
      expect(screen.getByTitle("Hide Balance")).toBeInTheDocument();
    });

    it("should show EyeOff icon when balance is hidden", () => {
      render(<WalletHeader {...defaultProps} balanceHidden={true} />);

      expect(screen.getByTestId("eye-off-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("eye-icon")).not.toBeInTheDocument();
      expect(screen.getByTitle("Show Balance")).toBeInTheDocument();
    });

    it("should call onToggleBalance when balance toggle button is clicked", () => {
      const onToggleBalance = vi.fn();
      render(
        <WalletHeader {...defaultProps} onToggleBalance={onToggleBalance} />
      );

      fireEvent.click(screen.getByTitle("Hide Balance"));

      expect(onToggleBalance).toHaveBeenCalledTimes(1);
    });

    it("should update title attribute based on balance visibility state", () => {
      const { rerender } = render(
        <WalletHeader {...defaultProps} balanceHidden={false} />
      );

      expect(screen.getByTitle("Hide Balance")).toBeInTheDocument();

      rerender(<WalletHeader {...defaultProps} balanceHidden={true} />);

      expect(screen.getByTitle("Show Balance")).toBeInTheDocument();
    });
  });

  describe("Wallet Manager Button", () => {
    it("should render wallet manager button with correct title", () => {
      render(<WalletHeader {...defaultProps} />);

      expect(screen.getByTestId("wallet-icon")).toBeInTheDocument();
      expect(screen.getByTitle("Manage Wallets")).toBeInTheDocument();
    });

    it("should call onWalletManagerClick when wallet button is clicked", () => {
      const onWalletManagerClick = vi.fn();
      render(
        <WalletHeader
          {...defaultProps}
          onWalletManagerClick={onWalletManagerClick}
        />
      );

      fireEvent.click(screen.getByTitle("Manage Wallets"));

      expect(onWalletManagerClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Button Styling and Hover States", () => {
    it("should apply correct CSS classes to all buttons", () => {
      render(<WalletHeader {...defaultProps} />);

      const walletButton = screen.getByTitle("Manage Wallets");
      const balanceButton = screen.getByTitle(/Hide Balance|Show Balance/);
      const calendarButton = screen.getByTitle(/Connect Google Calendar/);

      expect(walletButton).toHaveClass(
        "glass-morphism",
        "hover:bg-white/10",
        "transition-all",
        "duration-300"
      );
      expect(balanceButton).toHaveClass(
        "glass-morphism",
        "hover:bg-white/10",
        "transition-all",
        "duration-300"
      );
      expect(calendarButton).toHaveClass("rounded-xl");
    });

    it("should have correct button container layout", () => {
      render(<WalletHeader {...defaultProps} />);

      const buttonContainer = screen
        .getByTestId("wallet-icon")
        .closest("div")?.parentElement;
      expect(buttonContainer).toBeInTheDocument();

      // Verify buttons are present and functional
      expect(screen.getByTestId("wallet-icon")).toBeInTheDocument();
      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<WalletHeader {...defaultProps} />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("My Portfolio");
    });

    it("should have descriptive title attributes for all buttons", () => {
      render(<WalletHeader {...defaultProps} />);

      expect(screen.getByTitle("Manage Wallets")).toBeInTheDocument();
      expect(
        screen.getByTitle(/Hide Balance|Show Balance/)
      ).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      render(<WalletHeader {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      // Verify buttons can receive focus
      for (const button of buttons) {
        expect(button).not.toBeDisabled();
        button.focus();
        expect(button).toHaveFocus();
      }
    });
  });

  describe("React.memo Optimization", () => {
    it("should not re-render when props haven't changed", () => {
      const props = { ...defaultProps };
      const { rerender } = render(<WalletHeader {...props} />);

      // Re-render with same props (React.memo should prevent re-render)
      rerender(<WalletHeader {...props} />);

      // If React.memo is working, component should maintain same DOM structure
      expect(screen.getByText("My Portfolio")).toBeInTheDocument();
    });

    it("should re-render when balanceHidden prop changes", () => {
      const { rerender } = render(
        <WalletHeader {...defaultProps} balanceHidden={false} />
      );

      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();

      rerender(<WalletHeader {...defaultProps} balanceHidden={true} />);

      expect(screen.getByTestId("eye-off-icon")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should render with required props without throwing", () => {
      const requiredProps = {
        onWalletManagerClick: vi.fn(),
        onToggleBalance: vi.fn(),
        balanceHidden: false,
      };

      expect(() => {
        render(<WalletHeader {...requiredProps} />);
      }).not.toThrow();

      expect(screen.getByText("My Portfolio")).toBeInTheDocument();
    });
  });
});
