import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBorrowingPositions } from "@/hooks/queries/analytics/useBorrowingPositions";
import { logQueryError } from "@/hooks/queries/market/queryErrorUtils";
import { getBorrowingPositions } from "@/services/analyticsService";

vi.mock("@/services/analyticsService");
vi.mock("@/hooks/queries/market/queryErrorUtils");

const mockResponse = {
  positions: [
    {
      protocol_id: "aave-v3",
      protocol_name: "Aave V3",
      chain: "ethereum",
      health_rate: 1.8,
      health_status: "HEALTHY",
      collateral_usd: 5000,
      debt_usd: 2000,
      net_value_usd: 3000,
      collateral_tokens: [{ symbol: "ETH", amount: 2.5, value_usd: 5000 }],
      debt_tokens: [{ symbol: "USDC", amount: 2000, value_usd: 2000 }],
      updated_at: "2025-02-07T12:00:00Z",
    },
  ],
  total_collateral_usd: 5000,
  total_debt_usd: 2000,
  worst_health_rate: 1.8,
  last_updated: "2025-02-07T12:00:00Z",
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
};

describe("useBorrowingPositions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be disabled by default when enabled is not passed", () => {
    const wrapper = createWrapper();
    renderHook(() => useBorrowingPositions("user-123"), { wrapper });

    expect(getBorrowingPositions).not.toHaveBeenCalled();
  });

  it("should be disabled when userId is undefined", () => {
    const wrapper = createWrapper();
    renderHook(() => useBorrowingPositions(undefined, true), { wrapper });

    expect(getBorrowingPositions).not.toHaveBeenCalled();
  });

  it("should fetch borrowing positions when enabled with valid userId", async () => {
    vi.mocked(getBorrowingPositions).mockResolvedValue(mockResponse);

    const wrapper = createWrapper();
    renderHook(() => useBorrowingPositions("user-123", true), { wrapper });

    await waitFor(() => {
      expect(getBorrowingPositions).toHaveBeenCalledWith("user-123");
    });
  });

  it("should return data on success", async () => {
    vi.mocked(getBorrowingPositions).mockResolvedValue(mockResponse);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useBorrowingPositions("user-123", true),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it("should log error and rethrow on failure", async () => {
    const mockError = new Error("API request failed");
    vi.mocked(getBorrowingPositions).mockRejectedValue(mockError);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useBorrowingPositions("user-123", true),
      { wrapper }
    );

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 2000 }
    );

    expect(logQueryError).toHaveBeenCalledWith(
      "Failed to fetch borrowing positions",
      mockError
    );
    expect(result.current.error).toBeTruthy();
  });

  it("should not fetch when enabled transitions from true to false", async () => {
    vi.mocked(getBorrowingPositions).mockResolvedValue(mockResponse);

    const wrapper = createWrapper();
    const { rerender } = renderHook(
      ({ enabled }) => useBorrowingPositions("user-123", enabled),
      {
        wrapper,
        initialProps: { enabled: true },
      }
    );

    await waitFor(() => {
      expect(getBorrowingPositions).toHaveBeenCalledTimes(1);
    });

    vi.clearAllMocks();

    rerender({ enabled: false });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(getBorrowingPositions).not.toHaveBeenCalled();
  });
});
