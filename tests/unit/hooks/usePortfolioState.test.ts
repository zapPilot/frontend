import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  usePortfolioState,
  usePortfolioStateHelpers,
} from "../../../src/hooks/usePortfolioState";
import type { LandingPageResponse } from "../../../src/services/analyticsEngine";

// Mock landing page data
const mockLandingPageData: LandingPageResponse = {
  user_id: "test-user",
  total_net_usd: 10000,
  total_assets_usd: 12000,
  total_debt_usd: 2000,
  weighted_apr: 0.08,
  estimated_monthly_income: 800,
  portfolio_allocation: {
    btc: { total_value: 5000, percentage_of_portfolio: 50 },
    eth: { total_value: 3000, percentage_of_portfolio: 30 },
    stablecoins: { total_value: 2000, percentage_of_portfolio: 20 },
    others: { total_value: 0, percentage_of_portfolio: 0 },
  },
  category_summary_debt: {
    btc: 0,
    eth: 1000,
    stablecoins: 1000,
    others: 0,
  },
  portfolio_roi: {
    recommended_yearly_roi: 12.5,
    estimated_yearly_pnl_usd: 1250,
    recommended_roi_period: "roi_30d",
    roi_7d: { value: 2.1, data_points: 7 },
    roi_30d: { value: 8.3, data_points: 30 },
    roi_365d: { value: 12.5, data_points: 365 },
  },
};

const mockZeroDataResponse: LandingPageResponse = {
  ...mockLandingPageData,
  total_net_usd: 0,
  total_assets_usd: 0,
  total_debt_usd: 0,
  portfolio_allocation: {
    btc: { total_value: 0, percentage_of_portfolio: 0 },
    eth: { total_value: 0, percentage_of_portfolio: 0 },
    stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
    others: { total_value: 0, percentage_of_portfolio: 0 },
  },
};

describe("usePortfolioState", () => {
  describe("Visitor Mode (Critical Fix)", () => {
    it("should return 'has_data' for visitor with valid bundle data (not 'wallet_disconnected')", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: false, // Visitor mode
          isLoading: false,
          isRetrying: false,
          error: null,
          landingPageData: mockLandingPageData, // Valid bundle data
          hasZeroData: false,
        })
      );

      // This is the critical fix: visitor with data should see data, not connect prompt
      expect(result.current.type).toBe("has_data");
      expect(result.current.isConnected).toBe(false);
      expect(result.current.totalValue).toBe(10000);
    });

    it("should return 'wallet_disconnected' for visitor with zero data", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: false, // Visitor mode
          isLoading: false,
          isRetrying: false,
          error: null,
          landingPageData: mockZeroDataResponse,
          hasZeroData: true, // No meaningful data
        })
      );

      expect(result.current.type).toBe("wallet_disconnected");
      expect(result.current.isConnected).toBe(false);
      expect(result.current.totalValue).toBe(0);
    });

    it("should return 'wallet_disconnected' for visitor with no data at all", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: false, // Visitor mode
          isLoading: false,
          isRetrying: false,
          error: null,
          landingPageData: null, // No data
          hasZeroData: false,
        })
      );

      expect(result.current.type).toBe("wallet_disconnected");
      expect(result.current.isConnected).toBe(false);
      expect(result.current.totalValue).toBe(null);
    });
  });

  describe("Connected User Mode (Unchanged Behavior)", () => {
    it("should return 'has_data' for connected user with data", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: true,
          isLoading: false,
          isRetrying: false,
          error: null,
          landingPageData: mockLandingPageData,
          hasZeroData: false,
        })
      );

      expect(result.current.type).toBe("has_data");
      expect(result.current.isConnected).toBe(true);
      expect(result.current.totalValue).toBe(10000);
    });

    it("should return 'connected_no_data' for connected user with zero data", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: true,
          isLoading: false,
          isRetrying: false,
          error: null,
          landingPageData: mockZeroDataResponse,
          hasZeroData: true,
        })
      );

      expect(result.current.type).toBe("connected_no_data");
      expect(result.current.isConnected).toBe(true);
      expect(result.current.totalValue).toBe(0);
    });

    it("should return 'loading' for connected user still loading data", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: true,
          isLoading: false,
          isRetrying: false,
          error: null,
          landingPageData: null, // No data yet
          hasZeroData: false,
        })
      );

      expect(result.current.type).toBe("loading");
      expect(result.current.isConnected).toBe(true);
      expect(result.current.totalValue).toBe(null);
    });
  });

  describe("Priority Order (Error and Loading States)", () => {
    it("should prioritize error over connection status", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: false, // Visitor
          isLoading: false,
          isRetrying: false,
          error: "API Error", // Error takes priority
          landingPageData: mockLandingPageData,
          hasZeroData: false,
        })
      );

      expect(result.current.type).toBe("error");
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe("API Error");
    });

    it("should prioritize loading over connection status", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: false, // Visitor
          isLoading: true, // Loading takes priority
          isRetrying: false,
          error: null,
          landingPageData: null,
          hasZeroData: false,
        })
      );

      expect(result.current.type).toBe("loading");
      expect(result.current.isLoading).toBe(true);
    });

    it("should prioritize retrying (loading) over connection status", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: false, // Visitor
          isLoading: false,
          isRetrying: true, // Retrying is a form of loading
          error: null,
          landingPageData: mockLandingPageData,
          hasZeroData: false,
        })
      );

      expect(result.current.type).toBe("loading");
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isRetrying).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle connected user with error correctly", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: true,
          isLoading: false,
          isRetrying: false,
          error: "Network Error",
          landingPageData: null,
          hasZeroData: false,
        })
      );

      expect(result.current.type).toBe("error");
      expect(result.current.isConnected).toBe(true);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe("Network Error");
    });

    it("should handle visitor with error correctly", () => {
      const { result } = renderHook(() =>
        usePortfolioState({
          isConnected: false,
          isLoading: false,
          isRetrying: false,
          error: "USER_NOT_FOUND",
          landingPageData: null,
          hasZeroData: false,
        })
      );

      expect(result.current.type).toBe("error");
      expect(result.current.isConnected).toBe(false);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe("USER_NOT_FOUND");
    });
  });
});

describe("usePortfolioStateHelpers", () => {
  describe("Visitor Mode Helpers", () => {
    it("should show portfolio content for visitor with data (not connect prompt)", () => {
      const portfolioState = {
        type: "has_data" as const,
        isConnected: false, // Visitor
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: 10000,
        errorMessage: null,
        isRetrying: false,
      };

      const { result } = renderHook(() =>
        usePortfolioStateHelpers(portfolioState)
      );

      // Critical: visitor with data should see content, not connect prompt
      expect(result.current.shouldShowPortfolioContent).toBe(true);
      expect(result.current.shouldShowConnectPrompt).toBe(false);
      expect(result.current.shouldShowLoading).toBe(false);
      expect(result.current.shouldShowError).toBe(false);
      expect(result.current.getDisplayTotalValue()).toBe(10000);
    });

    it("should show connect prompt only for visitor without data", () => {
      const portfolioState = {
        type: "wallet_disconnected" as const,
        isConnected: false,
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: null,
        errorMessage: null,
        isRetrying: false,
      };

      const { result } = renderHook(() =>
        usePortfolioStateHelpers(portfolioState)
      );

      expect(result.current.shouldShowConnectPrompt).toBe(true);
      expect(result.current.shouldShowPortfolioContent).toBe(false);
      expect(result.current.getDisplayTotalValue()).toBe(null);
    });
  });

  describe("Connected User Helpers (Unchanged)", () => {
    it("should show portfolio content for connected user with data", () => {
      const portfolioState = {
        type: "has_data" as const,
        isConnected: true,
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: 5000,
        errorMessage: null,
        isRetrying: false,
      };

      const { result } = renderHook(() =>
        usePortfolioStateHelpers(portfolioState)
      );

      expect(result.current.shouldShowPortfolioContent).toBe(true);
      expect(result.current.shouldShowConnectPrompt).toBe(false);
      expect(result.current.getDisplayTotalValue()).toBe(5000);
    });

    it("should show no data message for connected user with zero data", () => {
      const portfolioState = {
        type: "connected_no_data" as const,
        isConnected: true,
        isLoading: false,
        hasError: false,
        hasZeroData: true,
        totalValue: 0,
        errorMessage: null,
        isRetrying: false,
      };

      const { result } = renderHook(() =>
        usePortfolioStateHelpers(portfolioState)
      );

      expect(result.current.shouldShowNoDataMessage).toBe(true);
      expect(result.current.shouldShowPortfolioContent).toBe(false);
      expect(result.current.shouldShowConnectPrompt).toBe(false);
      expect(result.current.getDisplayTotalValue()).toBe(0);
    });
  });

  describe("Error and Loading States", () => {
    it("should show error state correctly", () => {
      const portfolioState = {
        type: "error" as const,
        isConnected: false,
        isLoading: false,
        hasError: true,
        hasZeroData: false,
        totalValue: null,
        errorMessage: "API failed",
        isRetrying: false,
      };

      const { result } = renderHook(() =>
        usePortfolioStateHelpers(portfolioState)
      );

      expect(result.current.shouldShowError).toBe(true);
      expect(result.current.shouldShowPortfolioContent).toBe(false);
      expect(result.current.shouldShowConnectPrompt).toBe(false);
      expect(result.current.getDisplayTotalValue()).toBe(null);
    });

    it("should show loading state correctly", () => {
      const portfolioState = {
        type: "loading" as const,
        isConnected: true,
        isLoading: true,
        hasError: false,
        hasZeroData: false,
        totalValue: null,
        errorMessage: null,
        isRetrying: false,
      };

      const { result } = renderHook(() =>
        usePortfolioStateHelpers(portfolioState)
      );

      expect(result.current.shouldShowLoading).toBe(true);
      expect(result.current.shouldShowPortfolioContent).toBe(false);
      expect(result.current.shouldShowConnectPrompt).toBe(false);
      expect(result.current.getDisplayTotalValue()).toBe(null);
    });
  });
});
