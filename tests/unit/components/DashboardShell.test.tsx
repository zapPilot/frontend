/**
 * DashboardShell Unit Tests
 *
 * Tests for the main dashboard shell component
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardShell } from "@/components/DashboardShell";

// Mock all dependencies
const mockUsePortfolioDataProgressive = vi.fn();
const mockUseSentimentData = vi.fn();
const mockUseRegimeHistory = vi.fn();

vi.mock("@/hooks/queries/usePortfolioDataProgressive", () => ({
  usePortfolioDataProgressive: () => mockUsePortfolioDataProgressive(),
}));

vi.mock("@/services/sentimentService", () => ({
  useSentimentData: () => mockUseSentimentData(),
}));

vi.mock("@/services/regimeHistoryService", () => ({
  useRegimeHistory: () => mockUseRegimeHistory(),
}));

vi.mock("@/adapters/walletPortfolioDataAdapter", () => ({
  createEmptyPortfolioState: vi.fn(() => ({
    netWorth: 0,
    holdings: [],
  })),
}));

vi.mock("@/components/wallet/portfolio/views/LoadingStates", () => ({
  WalletPortfolioErrorState: ({
    error,
    onRetry,
  }: {
    error: Error;
    onRetry: () => void;
  }) => (
    <div data-testid="error-state">
      <span>{error.message}</span>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

vi.mock("@/components/wallet/portfolio/WalletPortfolioPresenter", () => ({
  WalletPortfolioPresenter: ({
    _data,
    userId,
    isEmptyState,
    isLoading,
    headerBanners,
    footerOverlays,
  }: {
    _data: unknown;
    userId: string;
    isEmptyState: boolean;
    isLoading: boolean;
    headerBanners?: React.ReactNode;
    footerOverlays?: React.ReactNode;
  }) => (
    <div
      data-testid="portfolio-presenter"
      data-user-id={userId}
      data-loading={isLoading}
      data-empty={isEmptyState}
    >
      {headerBanners && <div data-testid="header-banners">{headerBanners}</div>}
      <div data-testid="portfolio-content">Portfolio Content</div>
      {footerOverlays && (
        <div data-testid="footer-overlays">{footerOverlays}</div>
      )}
    </div>
  ),
}));

describe("DashboardShell", () => {
  const defaultProps = {
    urlUserId: "user-123",
    isOwnBundle: true,
    bundleUserName: "Test User",
    bundleUrl: "/bundle/user-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePortfolioDataProgressive.mockReturnValue({
      unifiedData: { netWorth: 10000, holdings: [] },
      sections: {},
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseSentimentData.mockReturnValue({ data: null });
    mockUseRegimeHistory.mockReturnValue({ data: null });
  });

  it("should render portfolio presenter with data", () => {
    render(<DashboardShell {...defaultProps} />);

    expect(screen.getByTestId("portfolio-presenter")).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-content")).toBeInTheDocument();
  });

  it("should pass userId to presenter", () => {
    render(<DashboardShell {...defaultProps} />);

    const presenter = screen.getByTestId("portfolio-presenter");
    expect(presenter).toHaveAttribute("data-user-id", "user-123");
  });

  it("should set data attributes on container", () => {
    const { container } = render(<DashboardShell {...defaultProps} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("data-bundle-user-id", "user-123");
    expect(wrapper).toHaveAttribute("data-bundle-owner", "own");
    expect(wrapper).toHaveAttribute("data-bundle-user-name", "Test User");
    expect(wrapper).toHaveAttribute("data-bundle-url", "/bundle/user-123");
  });

  it("should set visitor mode when not own bundle", () => {
    render(<DashboardShell {...defaultProps} isOwnBundle={false} />);

    const { container } = render(
      <DashboardShell {...defaultProps} isOwnBundle={false} />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("data-bundle-owner", "visitor");
  });

  it("should render loading state", () => {
    mockUsePortfolioDataProgressive.mockReturnValue({
      unifiedData: null,
      sections: {},
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardShell {...defaultProps} />);

    const presenter = screen.getByTestId("portfolio-presenter");
    expect(presenter).toHaveAttribute("data-loading", "true");
  });

  it("should render error state when error occurs without data", () => {
    const testError = new Error("Failed to load portfolio");
    mockUsePortfolioDataProgressive.mockReturnValue({
      unifiedData: null,
      sections: {},
      isLoading: false,
      error: testError,
      refetch: vi.fn(),
    });

    render(<DashboardShell {...defaultProps} />);

    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Failed to load portfolio")).toBeInTheDocument();
  });

  it("should render empty state when no data and not loading", () => {
    mockUsePortfolioDataProgressive.mockReturnValue({
      unifiedData: null,
      sections: {},
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardShell {...defaultProps} />);

    const presenter = screen.getByTestId("portfolio-presenter");
    expect(presenter).toHaveAttribute("data-empty", "true");
  });

  it("should render header banners when provided", () => {
    render(
      <DashboardShell
        {...defaultProps}
        headerBanners={<div>Header Banner Content</div>}
      />
    );

    expect(screen.getByTestId("header-banners")).toBeInTheDocument();
    expect(screen.getByText("Header Banner Content")).toBeInTheDocument();
  });

  it("should render footer overlays when provided", () => {
    render(
      <DashboardShell
        {...defaultProps}
        footerOverlays={<div>Footer Overlay Content</div>}
      />
    );

    expect(screen.getByTestId("footer-overlays")).toBeInTheDocument();
    expect(screen.getByText("Footer Overlay Content")).toBeInTheDocument();
  });

  it("should handle missing optional props", () => {
    const { container } = render(
      <DashboardShell urlUserId="user-456" isOwnBundle={false} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("data-bundle-user-name", "");
    expect(wrapper).toHaveAttribute("data-bundle-url", "");
  });
});
