/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DrawdownStatus } from "../../../../src/components/RiskAssessment/components/DrawdownStatus";

// Mock the utility functions
vi.mock("../../../../src/utils/risk", () => ({
  formatCurrency: vi.fn((value: number) => `$${value.toLocaleString()}`),
  formatDate: vi.fn((date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  ),
  isInDrawdown: vi.fn((currentDrawdownPct: number) => currentDrawdownPct < -1),
}));

describe("DrawdownStatus", () => {
  const defaultProps = {
    currentDrawdownPct: -5.5,
    peakValue: 100000,
    troughValue: 85000,
    maxDrawdownDate: "2024-03-15T00:00:00Z",
    recoveryNeededPct: 15.2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<DrawdownStatus {...defaultProps} />);

    expect(screen.getByText("Historical context:")).toBeInTheDocument();
    expect(screen.getByText("Current Status")).toBeInTheDocument();
  });

  it("displays peak and trough values correctly", () => {
    render(<DrawdownStatus {...defaultProps} />);

    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("$85,000")).toBeInTheDocument();
  });

  it("shows recovery needed percentage when positive", () => {
    render(<DrawdownStatus {...defaultProps} />);

    expect(screen.getByText("15.2%")).toBeInTheDocument();
    expect(
      screen.getByText(/requiring a.*gain to fully recover/)
    ).toBeInTheDocument();
  });

  it("hides recovery percentage when zero", () => {
    const propsWithoutRecovery = {
      ...defaultProps,
      recoveryNeededPct: 0,
    };

    render(<DrawdownStatus {...propsWithoutRecovery} />);

    expect(
      screen.queryByText(/requiring a.*gain to fully recover/)
    ).not.toBeInTheDocument();
  });

  it("displays correct status when in drawdown", () => {
    const inDrawdownProps = {
      ...defaultProps,
      currentDrawdownPct: -8.2,
    };

    render(<DrawdownStatus {...inDrawdownProps} />);

    expect(screen.getByText("In Drawdown (-8.2%)")).toBeInTheDocument();
    expect(
      screen.getByText("Portfolio is currently below its previous peak value")
    ).toBeInTheDocument();
  });

  it("displays correct status when not in drawdown", () => {
    const notInDrawdownProps = {
      ...defaultProps,
      currentDrawdownPct: 0.5,
    };

    render(<DrawdownStatus {...notInDrawdownProps} />);

    expect(screen.getByText("Above Previous Peak")).toBeInTheDocument();
    expect(
      screen.getByText("Portfolio has recovered from maximum drawdown")
    ).toBeInTheDocument();
  });

  it("applies correct CSS classes for drawdown state", () => {
    const { container } = render(<DrawdownStatus {...defaultProps} />);

    const statusContainer = container.querySelector(".bg-red-900\\/20");
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toHaveClass("border-red-800/30");
  });

  it("applies correct CSS classes for recovery state", () => {
    const notInDrawdownProps = {
      ...defaultProps,
      currentDrawdownPct: 1.0,
    };

    const { container } = render(<DrawdownStatus {...notInDrawdownProps} />);

    const statusContainer = container.querySelector(".bg-green-900\\/20");
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toHaveClass("border-green-800/30");
  });

  it("includes proper accessibility attributes", () => {
    render(<DrawdownStatus {...defaultProps} />);

    const statusElement = screen.getByRole("status");
    expect(statusElement).toHaveAttribute("aria-live", "polite");
  });

  it("applies custom className when provided", () => {
    const { container } = render(
      <DrawdownStatus {...defaultProps} className="custom-class" />
    );

    const statusContainer = container.querySelector(".custom-class");
    expect(statusContainer).toBeInTheDocument();
  });

  it("handles edge case with very small drawdown", () => {
    const smallDrawdownProps = {
      ...defaultProps,
      currentDrawdownPct: -0.1,
    };

    render(<DrawdownStatus {...smallDrawdownProps} />);

    expect(screen.getByText("Above Previous Peak")).toBeInTheDocument();
  });

  it("handles edge case with zero recovery needed", () => {
    const zeroRecoveryProps = {
      ...defaultProps,
      recoveryNeededPct: 0,
      currentDrawdownPct: 0,
    };

    render(<DrawdownStatus {...zeroRecoveryProps} />);

    expect(screen.queryByText(/gain to fully recover/)).not.toBeInTheDocument();
  });

  it("formats the maximum drawdown date correctly", () => {
    render(<DrawdownStatus {...defaultProps} />);

    // The date should be formatted by the mocked formatDate function
    expect(
      screen.getByText(/This maximum drawdown occurred on/)
    ).toBeInTheDocument();
  });
});
