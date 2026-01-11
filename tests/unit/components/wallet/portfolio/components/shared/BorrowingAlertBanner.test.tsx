import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BorrowingAlertBanner } from "@/components/wallet/portfolio/components/shared/BorrowingAlertBanner";
import type { BorrowingSummary } from "@/services/analyticsService";

describe("BorrowingAlertBanner", () => {
  const mockSummaryCritical: BorrowingSummary = {
    has_debt: true,
    worst_health_rate: 1.05,
    overall_status: "CRITICAL",
    critical_count: 2,
    warning_count: 1,
    healthy_count: 0,
  };

  const mockSummaryWarning: BorrowingSummary = {
    has_debt: true,
    worst_health_rate: 1.35,
    overall_status: "WARNING",
    critical_count: 0,
    warning_count: 3,
    healthy_count: 5,
  };

  const mockSummaryHealthy: BorrowingSummary = {
    has_debt: true,
    worst_health_rate: 2.5,
    overall_status: "HEALTHY",
    critical_count: 0,
    warning_count: 0,
    healthy_count: 5,
  };

  it("renders correctly for critical status", () => {
    render(<BorrowingAlertBanner summary={mockSummaryCritical} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Borrowing Status: Critical")).toBeInTheDocument();
    expect(screen.getByText(/2 critical position/)).toBeInTheDocument();
    expect(screen.getByText("1.05")).toBeInTheDocument(); // Worst health rate
  });

  it("renders correctly for warning status", () => {
    render(<BorrowingAlertBanner summary={mockSummaryWarning} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Borrowing Status: Risky")).toBeInTheDocument(); // Mapped to Risky
    expect(screen.getByText(/3 warning position/)).toBeInTheDocument();
    expect(screen.getByText("1.35")).toBeInTheDocument();
  });

  it("does not render for healthy status", () => {
    render(<BorrowingAlertBanner summary={mockSummaryHealthy} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onViewDetails when button is clicked", async () => {
    const onDetails = vi.fn();
    render(
      <BorrowingAlertBanner
        summary={mockSummaryCritical}
        onViewDetails={onDetails}
      />
    );

    const button = screen.getByRole("button", { name: /View Details/ });
    await userEvent.click(button);

    expect(onDetails).toHaveBeenCalledTimes(1);
  });

  it("renders pill breakdown on desktop (default mock)", () => {
    render(<BorrowingAlertBanner summary={mockSummaryCritical} />);
    expect(screen.getByText("2 Critical")).toBeInTheDocument();
    expect(screen.getByText("1 Risky")).toBeInTheDocument();
  });
});
