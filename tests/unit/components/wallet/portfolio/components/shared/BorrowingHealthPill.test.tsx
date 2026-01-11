import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { BorrowingHealthPill } from "@/components/wallet/portfolio/components/shared/BorrowingHealthPill";
import type { BorrowingSummary } from "@/services/analyticsService";

describe("BorrowingHealthPill", () => {
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

  it("renders correctly with health rate", () => {
    render(<BorrowingHealthPill summary={mockSummaryCritical} />);

    expect(screen.getByText("Borrowing:")).toBeInTheDocument();
    expect(screen.getByText("1.05")).toBeInTheDocument();
  });

  it("shows tooltip on hover", async () => {
    render(<BorrowingHealthPill summary={mockSummaryCritical} />);

    const pill = screen.getByText("Borrowing:");
    await userEvent.hover(pill);

    expect(await screen.findByText("Borrowing Health")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText(/2 Critical/)).toBeInTheDocument();
  });

  it("renders correct styling for warning status", async () => {
    render(<BorrowingHealthPill summary={mockSummaryWarning} />);

    expect(screen.getByText("1.35")).toBeInTheDocument();
    
    // Check tooltip for warning-specific text
    const pill = screen.getByText("Borrowing:");
    await userEvent.hover(pill);
    
    expect(await screen.findByText("Risky")).toBeInTheDocument();
  });
});
