/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { KeyTakeaway } from "../../../../src/components/RiskAssessment/components/KeyTakeaway";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock GlassCard component
vi.mock("../../../../src/components/ui", () => ({
  GlassCard: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`glass-card ${className || ""}`} data-testid="glass-card">
      {children}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Info: ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="info-icon" />
  ),
}));

describe("KeyTakeaway", () => {
  const defaultProps = {
    message:
      "This portfolio exhibits a high-risk, high-reward profile with significant price swings.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<KeyTakeaway {...defaultProps} />);

    expect(screen.getByText("Key Takeaway")).toBeInTheDocument();
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
  });

  it("displays the info icon", () => {
    render(<KeyTakeaway {...defaultProps} />);

    const icon = screen.getByTestId("info-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass(
      "w-5",
      "h-5",
      "text-blue-400",
      "mt-1",
      "flex-shrink-0"
    );
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("applies the correct styling classes", () => {
    const { container } = render(<KeyTakeaway {...defaultProps} />);

    const glassCard = screen.getByTestId("glass-card");
    expect(glassCard).toHaveClass(
      "p-6",
      "bg-blue-900/20",
      "border",
      "border-blue-800/30"
    );
  });

  it("renders the message with correct styling", () => {
    render(<KeyTakeaway {...defaultProps} />);

    const messageElement = screen.getByText(defaultProps.message);
    expect(messageElement).toHaveClass(
      "text-blue-200",
      "text-sm",
      "leading-relaxed"
    );
  });

  it("renders the title with correct styling", () => {
    render(<KeyTakeaway {...defaultProps} />);

    const titleElement = screen.getByText("Key Takeaway");
    expect(titleElement).toHaveClass(
      "text-lg",
      "font-medium",
      "text-blue-300",
      "mb-2"
    );
  });

  it("applies custom className when provided", () => {
    const { container } = render(
      <KeyTakeaway {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("handles long messages correctly", () => {
    const longMessage =
      "This is a very long message that should wrap properly and maintain readability while providing comprehensive insights about the portfolio risk assessment and recommendations for the user to consider when making investment decisions.";

    render(<KeyTakeaway message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
    expect(screen.getByText(longMessage)).toHaveClass("leading-relaxed");
  });

  it("handles empty message gracefully", () => {
    render(<KeyTakeaway message="" />);

    expect(screen.getByText("Key Takeaway")).toBeInTheDocument();
    const messageElement = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === "p" && content === "";
    });
    expect(messageElement).toBeInTheDocument();
  });

  it("applies motion props correctly", () => {
    const delay = 0.5;
    render(<KeyTakeaway {...defaultProps} delay={delay} />);

    // Since we mocked framer-motion, we just verify the component renders
    // In a real scenario, you'd test animation behavior with appropriate mocks
    expect(screen.getByText("Key Takeaway")).toBeInTheDocument();
  });

  it("maintains proper semantic structure", () => {
    render(<KeyTakeaway {...defaultProps} />);

    // Check that the heading is properly structured
    const heading = screen.getByRole("heading", { level: 4 });
    expect(heading).toHaveTextContent("Key Takeaway");

    // Check that the content follows the heading
    const message = screen.getByText(defaultProps.message);
    expect(message.tagName.toLowerCase()).toBe("p");
  });

  it("uses proper layout structure with flexbox", () => {
    const { container } = render(<KeyTakeaway {...defaultProps} />);

    const flexContainer = container.querySelector(
      ".flex.items-start.space-x-3"
    );
    expect(flexContainer).toBeInTheDocument();
  });

  it("handles special characters in message", () => {
    const messageWithSpecialChars =
      "Risk level: >50% volatility & <-20% drawdown—consider diversification!";

    render(<KeyTakeaway message={messageWithSpecialChars} />);

    expect(screen.getByText(messageWithSpecialChars)).toBeInTheDocument();
  });

  it("provides proper icon accessibility", () => {
    render(<KeyTakeaway {...defaultProps} />);

    const icon = screen.getByTestId("info-icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
