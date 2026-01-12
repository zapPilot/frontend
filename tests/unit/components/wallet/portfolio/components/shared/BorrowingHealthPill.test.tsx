import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BorrowingHealthPill } from "@/components/wallet/portfolio/components/shared/BorrowingHealthPill";
import type { BorrowingSummary } from "@/services/analyticsService";

import { render } from "../../../../../../test-utils";

// Mock useBorrowingPositions hook for click-to-expand tests
vi.mock("@/hooks/queries/analytics/useBorrowingPositions", () => ({
  useBorrowingPositions: vi.fn(() => ({
    data: { positions: [], total_collateral_usd: 0, total_debt_usd: 0 },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

describe("BorrowingHealthPill", () => {
  const mockUserId = "test-user-id";

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
    render(
      <BorrowingHealthPill summary={mockSummaryCritical} userId={mockUserId} />
    );

    expect(screen.getByText("Borrowing:")).toBeInTheDocument();
    expect(screen.getByText("1.05")).toBeInTheDocument();
  });

  it("has correct aria-label for accessibility", () => {
    render(
      <BorrowingHealthPill summary={mockSummaryCritical} userId={mockUserId} />
    );

    const pill = screen.getByRole("button");
    expect(pill).toHaveAttribute(
      "aria-label",
      "Borrowing health: 1.05. Click to view detailed positions."
    );
    expect(pill).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles expanded state on click", async () => {
    render(
      <BorrowingHealthPill summary={mockSummaryCritical} userId={mockUserId} />
    );

    const pill = screen.getByRole("button");
    expect(pill).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(pill);
    expect(pill).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(pill);
    expect(pill).toHaveAttribute("aria-expanded", "false");
  });

  it("renders correct styling for warning status", () => {
    render(
      <BorrowingHealthPill summary={mockSummaryWarning} userId={mockUserId} />
    );

    expect(screen.getByText("1.35")).toBeInTheDocument();
    expect(screen.getByText("Borrowing:")).toBeInTheDocument();
  });
});
