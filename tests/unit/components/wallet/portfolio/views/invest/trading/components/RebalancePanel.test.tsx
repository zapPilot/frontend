import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RebalancePanel } from "@/components/wallet/portfolio/views/invest/trading/components/RebalancePanel";
import { useDailySuggestion } from "@/components/wallet/portfolio/views/invest/trading/hooks/useDailySuggestion";

vi.mock(
  "@/components/wallet/portfolio/views/invest/trading/hooks/useDailySuggestion",
  () => ({
    useDailySuggestion: vi.fn(),
  })
);

vi.mock(
  "@/components/wallet/portfolio/views/invest/trading/hooks/useDefaultPresetId",
  () => ({
    useDefaultPresetId: vi.fn(() => "dma_gated_fgi_default"),
  })
);

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

vi.mock("@/utils/formatters", () => ({
  formatCurrency: vi.fn((v: number) => `$${v.toFixed(2)}`),
}));

const mockSuggestionData = {
  as_of: "2026-03-07",
  config_id: "dma_gated_fgi_default",
  strategy_id: "dma_gated_fgi" as const,
  market: {
    date: "2026-03-07",
    token_price: { btc: 68148.28 },
    sentiment: 18,
    sentiment_label: "extreme_fear",
  },
  portfolio: {
    spot_usd: 7000,
    stable_usd: 3000,
    total_value: 10000,
    allocation: {
      spot: 0.7,
      stable: 0.3,
    },
    asset_allocation: {
      btc: 0.4,
      eth: 0.3,
      stable: 0.3,
      alt: 0,
    },
  },
  signal: {
    id: "dma_gated_fgi" as const,
    regime: "extreme_fear",
    raw_value: 18,
    confidence: 1,
    details: {
      dma: {
        dma_200: 65000,
        distance: 0.05,
        zone: "above" as const,
        cross_event: null,
        cooldown_active: false,
        cooldown_remaining_days: 0,
        cooldown_blocked_zone: null,
        fgi_slope: -2,
      },
    },
  },
  decision: {
    action: "buy" as const,
    reason: "below_extreme_fear_buy",
    rule_group: "dma_fgi" as const,
    target_allocation: {
      spot: 1,
      stable: 0,
    },
    target_asset_allocation: {
      btc: 1,
      eth: 0,
      stable: 0,
      alt: 0,
    },
    immediate: false,
    details: {
      target_spot_asset: "eth",
    },
  },
  user_action: {
    status: "action_required" as const,
    required: true,
    event: "rebalance" as const,
    transfers: [
      {
        from_bucket: "stable" as const,
        to_bucket: "spot" as const,
        amount_usd: 500,
      },
      {
        from_bucket: "spot" as const,
        to_bucket: "stable" as const,
        amount_usd: 200,
      },
    ],
    blocked_reason: null,
  },
  execution: {
    event: "rebalance",
    transfers: [
      {
        from_bucket: "stable" as const,
        to_bucket: "spot" as const,
        amount_usd: 500,
      },
      {
        from_bucket: "spot" as const,
        to_bucket: "stable" as const,
        amount_usd: 200,
      },
    ],
    blocked_reason: null,
    step_count: 1,
    steps_remaining: 2,
    interval_days: 3,
  },
};

const mockBlockedSuggestion = {
  ...mockSuggestionData,
  decision: {
    ...mockSuggestionData.decision,
    action: "hold" as const,
    reason: "cooldown_hold",
  },
  user_action: {
    status: "blocked" as const,
    required: false,
    event: null,
    transfers: [],
    blocked_reason: "cooldown_active",
  },
  execution: {
    ...mockSuggestionData.execution,
    transfers: [],
    blocked_reason: "cooldown_active",
  },
};

const mockNoActionSuggestion = {
  ...mockSuggestionData,
  decision: {
    ...mockSuggestionData.decision,
    action: "hold" as const,
    reason: "already_aligned",
  },
  user_action: {
    status: "no_action" as const,
    required: false,
    event: null,
    transfers: [],
    blocked_reason: null,
  },
  execution: {
    ...mockSuggestionData.execution,
    event: null,
    transfers: [],
    blocked_reason: null,
  },
};

describe("RebalancePanel", () => {
  it("renders skeleton when data is not available", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getByLabelText("Loading rebalance data")).toBeDefined();
    expect(
      screen.getByText("Review & Execute All").hasAttribute("disabled")
    ).toBe(true);
  });

  it("passes the curated DMA preset id into useDailySuggestion", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(useDailySuggestion).toHaveBeenCalledWith(
      "0xabc",
      "dma_gated_fgi_default"
    );
  });

  it("renders transfer-derived trade actions", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getByText("Portfolio Health")).toBeDefined();
    expect(screen.getByText("extreme fear")).toBeDefined();
    expect(screen.getByText("Add")).toBeDefined();
    expect(screen.getByText("Reduce")).toBeDefined();
    expect(screen.getAllByText("ETH")).toHaveLength(2);
    expect(screen.getByText("$500.00")).toBeDefined();
    expect(screen.getByText("$200.00")).toBeDefined();
    expect(screen.getByText("STABLE -> ETH")).toBeDefined();
    expect(screen.getByText("ETH -> STABLE")).toBeDefined();
  });

  it("renders a blocked state without fake trades", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockBlockedSuggestion,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getByText("Action blocked")).toBeDefined();
    expect(screen.getByText("cooldown_active")).toBeDefined();
    const button = screen.getByText("Execution Unavailable");
    expect(button).toBeDefined();
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("falls back to SPOT label when target_spot_asset is missing or invalid", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: {
        ...mockSuggestionData,
        decision: {
          ...mockSuggestionData.decision,
          details: {
            target_spot_asset: "doge",
          },
        },
      },
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getAllByText("SPOT")).toHaveLength(2);
    expect(screen.getByText("STABLE -> SPOT")).toBeDefined();
  });

  it("renders a no-action state with a disabled CTA", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockNoActionSuggestion,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(screen.getByText("No trades needed")).toBeDefined();
    expect(screen.getByText("already_aligned")).toBeDefined();
    const button = screen.getByText("No Action Needed");
    expect(button).toBeDefined();
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("opens and closes the review modal", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    fireEvent.click(screen.getByText("Review & Execute All"));
    expect(screen.getByTestId("review-modal")).toBeDefined();

    fireEvent.click(screen.getByTestId("close-review"));
    expect(screen.queryByTestId("review-modal")).toBeNull();
  });

  it("renders one action dot per derived action", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockSuggestionData,
    } as ReturnType<typeof useDailySuggestion>);

    const { container } = render(<RebalancePanel userId="0xabc" />);

    expect(container.querySelectorAll(".rounded-full.w-2.h-2")).toHaveLength(2);
  });

  it("does not open the review modal when CTA is disabled", () => {
    vi.mocked(useDailySuggestion).mockReturnValue({
      data: mockNoActionSuggestion,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    fireEvent.click(screen.getByText("No Action Needed"));
    expect(screen.queryByTestId("review-modal")).toBeNull();
  });

  it("calls useDailySuggestion without configId when defaultPresetId is undefined", async () => {
    const { useDefaultPresetId } = vi.mocked(
      await import("@/components/wallet/portfolio/views/invest/trading/hooks/useDefaultPresetId")
    );
    (useDefaultPresetId as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    vi.mocked(useDailySuggestion).mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useDailySuggestion>);

    render(<RebalancePanel userId="0xabc" />);

    expect(useDailySuggestion).toHaveBeenCalledWith("0xabc", undefined);
  });
});
