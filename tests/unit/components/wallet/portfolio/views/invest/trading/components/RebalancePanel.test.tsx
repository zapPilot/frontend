import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RebalancePanel } from "@/components/wallet/portfolio/views/invest/trading/components/RebalancePanel";
import { useDailySuggestion } from "@/components/wallet/portfolio/views/invest/trading/hooks/useDailySuggestion";

// Mock hooks
vi.mock(
  "@/components/wallet/portfolio/views/invest/trading/hooks/useDailySuggestion",
  () => ({
    useDailySuggestion: vi.fn(),
  })
);

vi.mock(
  "@/components/wallet/portfolio/views/invest/trading/hooks/useDefaultPresetId",
  () => ({
    useDefaultPresetId: vi.fn(() => "fgi_exponential"),
  })
);

// Mock BaseTradingPanel to simplify testing
vi.mock(
  "@/components/wallet/portfolio/views/invest/trading/components/BaseTradingPanel",
  () => ({
    BaseTradingPanel: ({
      title,
      subtitle,
      children,
      footer,
      isReviewOpen,
      onCloseReview,
      onConfirmReview,
    }: {
      title: string;
      subtitle: React.ReactNode;
      children: React.ReactNode;
      footer: React.ReactNode;
      isReviewOpen: boolean;
      onCloseReview: () => void;
      onConfirmReview: () => void;
    }) => (
      <div data-testid="base-trading-panel">
        <div data-testid="panel-title">{title}</div>
        <div data-testid="panel-subtitle">{subtitle}</div>
        <div data-testid="panel-children">{children}</div>
        <div data-testid="panel-footer">{footer}</div>
        {isReviewOpen && (
          <div data-testid="review-modal">
            <button data-testid="close-review" onClick={onCloseReview}>
              Close
            </button>
            <button data-testid="confirm-review" onClick={onConfirmReview}>
              Confirm
            </button>
          </div>
        )}
      </div>
    ),
  })
);

// Mock formatters
vi.mock("@/utils/formatters", () => ({
  formatCurrency: vi.fn((v: number) => `$${v.toFixed(2)}`),
}));

const mockSuggestionData = {
  regime: { current: "neutral_bearish" },
  trade_suggestions: [
    { action: "buy", bucket: "btc", amount_usd: 500 },
    { action: "sell", bucket: "eth", amount_usd: 200 },
    { action: "hold", bucket: "stables", amount_usd: 0 },
  ],
};

describe("RebalancePanel", () => {
  it("renders skeleton when data is not available", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getByLabelText("Loading rebalance data")).toBeDefined();
  });

  it("renders skeleton with disabled CTA button", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    const ctaButton = screen.getByText("Review & Execute All");
    expect(ctaButton).toBeDefined();
    expect(ctaButton.hasAttribute("disabled")).toBe(true);
  });

  it("renders trade suggestions when data is available", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getByText("Portfolio Health")).toBeDefined();
    expect(screen.getByText("$500.00")).toBeDefined();
    expect(screen.getByText("$200.00")).toBeDefined();
    expect(screen.getByText("BTC")).toBeDefined();
    expect(screen.getByText("ETH")).toBeDefined();
  });

  it("renders regime name in subtitle", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getByText("neutral bearish")).toBeDefined();
  });

  it("displays action labels for buy/sell", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getByText("Add")).toBeDefined();
    expect(screen.getByText("Reduce")).toBeDefined();
    expect(screen.getByText("Hold")).toBeDefined();
  });

  it("opens review modal on CTA click", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    fireEvent.click(screen.getByText("Review & Execute All"));

    expect(screen.getByTestId("review-modal")).toBeDefined();
  });

  it("closes review modal", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    fireEvent.click(screen.getByText("Review & Execute All"));
    fireEvent.click(screen.getByTestId("close-review"));

    expect(screen.queryByTestId("review-modal")).toBeNull();
  });

  it("passes config_id when defaultPresetId is available", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(useDailySuggestion).toHaveBeenCalledWith("0xabc", {
      config_id: "fgi_exponential",
    });
  });

  it("applies correct action styles for buy/sell", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    const { container } = render(<RebalancePanel userId="0xabc" />);

    const dots = container.querySelectorAll(".rounded-full.w-2.h-2");
    expect(dots.length).toBe(3);
  });

  it("renders action card info", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    // actionCardTitle is passed as a prop to BaseTradingPanel but rendered
    // by the mock — check it was provided via the panel title area
    expect(screen.getByText("Portfolio Health")).toBeDefined();
  });
});
