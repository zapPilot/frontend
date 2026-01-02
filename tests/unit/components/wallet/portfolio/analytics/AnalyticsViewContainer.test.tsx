/**
 * Unit tests for AnalyticsViewContainer
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsViewContainer } from "@/components/wallet/portfolio/analytics/AnalyticsViewContainer";
import { useAnalyticsData } from "@/hooks/queries/analytics/useAnalyticsData";
import { useCurrentUser } from "@/hooks/queries/wallet/useUserQuery";
import { exportAnalyticsToCSV } from "@/services/analyticsExportService";

// Mock child components
vi.mock("@/components/wallet/portfolio/analytics/AnalyticsView", () => ({
  AnalyticsView: ({
    selectedPeriod,
    activeChartTab,
    onPeriodChange,
    onChartTabChange,
    onExport,
    onWalletChange,
    selectedWallet,
    isExporting,
    exportError,
  }: any) => (
    <div data-testid="analytics-view">
      <div data-testid="period">{selectedPeriod.key}</div>
      <div data-testid="active-tab">{activeChartTab}</div>
      <div data-testid="selected-wallet">{selectedWallet || "all"}</div>
      <div data-testid="export-status">
        {isExporting ? "Exporting..." : "Idle"}
      </div>
      <div data-testid="export-error">{exportError}</div>
      <button
        data-testid="change-period-btn"
        onClick={() =>
          onPeriodChange({ key: "3M", days: 90, label: "3 Months" })
        }
      >
        Change Period
      </button>
      <button
        data-testid="change-tab-btn"
        onClick={() => onChartTabChange("drawdown")}
      >
        Change Tab
      </button>
      <button data-testid="export-btn" onClick={onExport}>
        Export
      </button>
      <button
        data-testid="change-wallet-btn"
        onClick={() => onWalletChange("0x123")}
      >
        Select Wallet
      </button>
    </div>
  ),
}));

vi.mock(
  "@/components/wallet/portfolio/analytics/components/AnalyticsErrorState",
  () => ({
    AnalyticsErrorState: ({ onRetry }: any) => (
      <div data-testid="error-state">
        <button onClick={onRetry}>Retry</button>
      </div>
    ),
  })
);

// Mock hooks and services
vi.mock("@/hooks/queries/analytics/useAnalyticsData");
vi.mock("@/hooks/queries/wallet/useUserQuery");
vi.mock("@/services/analyticsExportService");

describe("AnalyticsViewContainer", () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCurrentUser).mockReturnValue({
      userInfo: {
        additionalWallets: [
          { wallet_address: "0x123", label: "Wallet 1" },
          { wallet_address: "0x456", label: "Wallet 2" },
        ],
      },
      isLoading: false,
    } as any);

    vi.mocked(useAnalyticsData).mockReturnValue({
      data: {
        performanceChart: { points: [] },
        drawdownChart: { points: [] },
        keyMetrics: {},
        monthlyPnL: [],
      },
      isLoading: false,
      isMonthlyPnLLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    vi.mocked(exportAnalyticsToCSV).mockResolvedValue({ success: true });
  });

  it("renders AnalyticsView with default state", () => {
    render(<AnalyticsViewContainer userId="user-123" />);

    expect(screen.getByTestId("analytics-view")).toBeInTheDocument();
    expect(screen.getByTestId("period")).toHaveTextContent("1Y");
    expect(screen.getByTestId("active-tab")).toHaveTextContent("performance");
    expect(screen.getByTestId("selected-wallet")).toHaveTextContent("all");
    expect(useAnalyticsData).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ key: "1Y" }),
      null
    );
  });

  it("renders ErrorState when error occurs and no data", () => {
    vi.mocked(useAnalyticsData).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Fetch failed"),
      refetch: mockRefetch,
    } as any);

    render(<AnalyticsViewContainer userId="user-123" />);

    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.queryByTestId("analytics-view")).not.toBeInTheDocument();
  });

  it("allows retrying from error state", async () => {
    vi.mocked(useAnalyticsData).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Fetch failed"),
      refetch: mockRefetch,
    } as any);

    render(<AnalyticsViewContainer userId="user-123" />);

    await userEvent.click(screen.getByText("Retry"));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("handles period change interaction", async () => {
    render(<AnalyticsViewContainer userId="user-123" />);

    await userEvent.click(screen.getByTestId("change-period-btn"));

    expect(screen.getByTestId("period")).toHaveTextContent("3M");
    expect(useAnalyticsData).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ key: "3M" }),
      null
    );
  });

  it("handles tab switching interaction", async () => {
    render(<AnalyticsViewContainer userId="user-123" />);

    await userEvent.click(screen.getByTestId("change-tab-btn"));

    expect(screen.getByTestId("active-tab")).toHaveTextContent("drawdown");
  });

  it("handles wallet filtering", async () => {
    render(<AnalyticsViewContainer userId="user-123" />);

    await userEvent.click(screen.getByTestId("change-wallet-btn"));

    expect(screen.getByTestId("selected-wallet")).toHaveTextContent("0x123");
    expect(useAnalyticsData).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ key: "1Y" }),
      "0x123"
    );
  });

  it("auto-resets selected wallet if it disappears from available wallets", () => {
    const { rerender } = render(<AnalyticsViewContainer userId="user-123" />);

    // Select wallet
    act(() => {
      // simulate selection via prop/interaction if we could reach hook state directly
      // but testing via UI:
      screen.getByTestId("change-wallet-btn").click();
    });

    // Verify selection
    expect(screen.getByTestId("selected-wallet")).toHaveTextContent("0x123");

    // Re-render with wallet removed
    vi.mocked(useCurrentUser).mockReturnValue({
      userInfo: {
        additionalWallets: [
          // "0x123" removed
          { wallet_address: "0x456", label: "Wallet 2" },
        ],
      },
    } as any);

    rerender(<AnalyticsViewContainer userId="user-123" />);

    // Should behave reset to null (all)
    expect(screen.getByTestId("selected-wallet")).toHaveTextContent("all");
  });

  it("handles export success", async () => {
    render(<AnalyticsViewContainer userId="user-123" />);

    await userEvent.click(screen.getByTestId("export-btn"));

    expect(screen.getByTestId("export-status")).toHaveTextContent("Idle"); // Resets after finish
    expect(exportAnalyticsToCSV).toHaveBeenCalled();
  });

  it("handles export failure", async () => {
    vi.mocked(exportAnalyticsToCSV).mockResolvedValue({
      success: false,
      error: "Export broken",
    });

    render(<AnalyticsViewContainer userId="user-123" />);

    await userEvent.click(screen.getByTestId("export-btn"));

    expect(screen.getByTestId("export-error")).toHaveTextContent(
      "Export broken"
    );
  });

  it("handles export exception", async () => {
    vi.mocked(exportAnalyticsToCSV).mockRejectedValue(new Error("Crash"));

    render(<AnalyticsViewContainer userId="user-123" />);

    await userEvent.click(screen.getByTestId("export-btn"));

    expect(screen.getByTestId("export-error")).toHaveTextContent(
      "An unexpected error occurred"
    );
  });
});
