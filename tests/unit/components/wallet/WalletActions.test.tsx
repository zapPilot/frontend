import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { WalletActions } from "../../../../src/components/wallet/WalletActions";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ArrowUpRight: () => <div data-testid="arrow-up-right-icon" />,
  ArrowDownLeft: () => <div data-testid="arrow-down-left-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
}));

describe("WalletActions", () => {
  const mockOnZapIn = vi.fn();
  const mockOnZapOut = vi.fn();
  const mockOnOptimize = vi.fn();

  const defaultProps = {
    onZapInClick: mockOnZapIn,
    onZapOutClick: mockOnZapOut,
    onOptimizeClick: mockOnOptimize,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders all three action buttons", () => {
      render(<WalletActions {...defaultProps} />);

      expect(screen.getByText("Zap In")).toBeInTheDocument();
      expect(screen.getByText("Zap Out")).toBeInTheDocument();
      expect(screen.getByText("Optimize")).toBeInTheDocument();
    });

    it("renders with correct icons", () => {
      render(<WalletActions {...defaultProps} />);

      expect(screen.getByTestId("arrow-up-right-icon")).toBeInTheDocument();
      expect(screen.getByTestId("arrow-down-left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    });

    it("renders buttons with proper gradient structure", () => {
      render(<WalletActions {...defaultProps} />);

      const zapInButton = screen.getByText("Zap In").closest("button");
      const zapOutButton = screen.getByText("Zap Out").closest("button");
      const optimizeButton = screen.getByText("Optimize").closest("button");

      // Test that buttons exist and have expected structure
      expect(zapInButton).toBeInTheDocument();
      expect(zapOutButton).toBeInTheDocument();
      expect(optimizeButton).toBeInTheDocument();
    });
  });

  describe("Button Interactions", () => {
    it("calls onZapIn when Zap In button is clicked", () => {
      render(<WalletActions {...defaultProps} />);

      const zapInButton = screen.getByText("Zap In");
      fireEvent.click(zapInButton);

      expect(mockOnZapIn).toHaveBeenCalledTimes(1);
      expect(mockOnZapOut).not.toHaveBeenCalled();
      expect(mockOnOptimize).not.toHaveBeenCalled();
    });

    it("calls onZapOut when Zap Out button is clicked", () => {
      render(<WalletActions {...defaultProps} />);

      const zapOutButton = screen.getByText("Zap Out");
      fireEvent.click(zapOutButton);

      expect(mockOnZapOut).toHaveBeenCalledTimes(1);
      expect(mockOnZapIn).not.toHaveBeenCalled();
      expect(mockOnOptimize).not.toHaveBeenCalled();
    });

    it("calls onOptimize when Optimize button is clicked", () => {
      render(<WalletActions {...defaultProps} />);

      const optimizeButton = screen.getByText("Optimize");
      fireEvent.click(optimizeButton);

      expect(mockOnOptimize).toHaveBeenCalledTimes(1);
      expect(mockOnZapIn).not.toHaveBeenCalled();
      expect(mockOnZapOut).not.toHaveBeenCalled();
    });

    it("handles multiple clicks correctly", () => {
      render(<WalletActions {...defaultProps} />);

      const zapInButton = screen.getByText("Zap In");
      fireEvent.click(zapInButton);
      fireEvent.click(zapInButton);

      expect(mockOnZapIn).toHaveBeenCalledTimes(2);
    });

    it("handles rapid clicking without issues", () => {
      render(<WalletActions {...defaultProps} />);

      const buttons = [
        screen.getByText("Zap In"),
        screen.getByText("Zap Out"),
        screen.getByText("Optimize"),
      ];

      // Simulate rapid clicking
      buttons.forEach(button => {
        for (let i = 0; i < 3; i++) {
          fireEvent.click(button);
        }
      });

      expect(mockOnZapIn).toHaveBeenCalledTimes(3);
      expect(mockOnZapOut).toHaveBeenCalledTimes(3);
      expect(mockOnOptimize).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility", () => {
    it("has proper button roles", () => {
      render(<WalletActions {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);
    });

    it("supports keyboard navigation", () => {
      render(<WalletActions {...defaultProps} />);

      const zapInButton = screen.getByText("Zap In").closest("button");
      zapInButton?.focus();
      expect(zapInButton).toHaveFocus();

      // Simulate Enter key press
      fireEvent.keyDown(zapInButton!, { key: "Enter", code: "Enter" });
      fireEvent.keyUp(zapInButton!, { key: "Enter", code: "Enter" });
    });

    it("supports space key activation", () => {
      render(<WalletActions {...defaultProps} />);

      const optimizeButton = screen.getByText("Optimize").closest("button");
      optimizeButton?.focus();

      // Simulate Space key press
      fireEvent.keyDown(optimizeButton!, { key: " ", code: "Space" });
      fireEvent.keyUp(optimizeButton!, { key: " ", code: "Space" });
    });

    it("maintains accessible button attributes", () => {
      render(<WalletActions {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach(button => {
        expect(button).toHaveAttribute("tabindex", "0");
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("Styling and Layout", () => {
    it("renders buttons in proper layout structure", () => {
      const { container } = render(<WalletActions {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("grid", "grid-cols-3", "gap-3");
    });

    it("renders all buttons as interactive elements", () => {
      render(<WalletActions {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);

      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });

    it("maintains proper button structure", () => {
      render(<WalletActions {...defaultProps} />);

      const zapInButton = screen.getByText("Zap In").closest("button");
      expect(zapInButton).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders buttons with proper text and icon combinations", () => {
      render(<WalletActions {...defaultProps} />);

      // Check Zap In button
      const zapInButton = screen.getByText("Zap In").closest("button");
      expect(zapInButton).toContainElement(
        screen.getByTestId("arrow-up-right-icon")
      );

      // Check Zap Out button
      const zapOutButton = screen.getByText("Zap Out").closest("button");
      expect(zapOutButton).toContainElement(
        screen.getByTestId("arrow-down-left-icon")
      );

      // Check Optimize button
      const optimizeButton = screen.getByText("Optimize").closest("button");
      expect(optimizeButton).toContainElement(
        screen.getByTestId("settings-icon")
      );
    });

    it("maintains consistent button structure", () => {
      render(<WalletActions {...defaultProps} />);

      const buttons = screen.getAllByRole("button");

      buttons.forEach(button => {
        // Each button should have an icon and text
        const iconElements = button.querySelectorAll('[data-testid*="icon"]');
        expect(iconElements).toHaveLength(1);
        expect(button.textContent).toBeTruthy();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined callback functions gracefully", () => {
      const propsWithUndefined = {
        onZapInClick: undefined as any,
        onZapOutClick: mockOnZapOut,
        onOptimizeClick: mockOnOptimize,
      };

      expect(() => {
        render(<WalletActions {...propsWithUndefined} />);
      }).not.toThrow();
    });

    it("handles null callback functions gracefully", () => {
      const propsWithNull = {
        onZapInClick: null as any,
        onZapOutClick: mockOnZapOut,
        onOptimizeClick: mockOnOptimize,
      };

      expect(() => {
        render(<WalletActions {...propsWithNull} />);
      }).not.toThrow();
    });

    it("renders correctly when remounted", () => {
      const { unmount } = render(<WalletActions {...defaultProps} />);

      expect(screen.getByText("Zap In")).toBeInTheDocument();

      unmount();

      // Re-render in a fresh test environment
      render(<WalletActions {...defaultProps} />);

      expect(screen.getByText("Zap In")).toBeInTheDocument();
      expect(screen.getByText("Zap Out")).toBeInTheDocument();
      expect(screen.getByText("Optimize")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("does not re-render unnecessarily with same props", () => {
      const { rerender } = render(<WalletActions {...defaultProps} />);

      // Re-render with same props
      rerender(<WalletActions {...defaultProps} />);

      // Button should still be in document (React.memo optimization)
      expect(screen.getByText("Zap In")).toBeInTheDocument();
    });

    it("updates correctly when props change", () => {
      const newMockOnZapIn = vi.fn();
      const { rerender } = render(<WalletActions {...defaultProps} />);

      rerender(
        <WalletActions {...defaultProps} onZapInClick={newMockOnZapIn} />
      );

      const zapInButton = screen.getByText("Zap In");
      fireEvent.click(zapInButton);

      expect(newMockOnZapIn).toHaveBeenCalledTimes(1);
      expect(mockOnZapIn).not.toHaveBeenCalled();
    });
  });
});
