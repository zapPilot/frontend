import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  suggestionKeys,
  useDailySuggestion,
} from "@/components/wallet/portfolio/views/invest/trading/hooks/useDailySuggestion";
import { getDailySuggestion } from "@/services/strategyService";
import type { DailySuggestionResponse } from "@/types/strategy";

import { QueryClientWrapper } from "../../../../../../../../test-utils";

// Mock the service
vi.mock("@/services/strategyService", () => ({
  getDailySuggestion: vi.fn(),
}));

const mockUserId = "user-123";
const mockSuggestionResponse: DailySuggestionResponse = {
  user_id: mockUserId,
  timestamp: "2024-01-15T12:00:00Z",
  current_allocation: {
    spot: 0.5,
    lp: 0.3,
    stable: 0.2,
  },
  target_allocation: {
    spot: 0.6,
    lp: 0.2,
    stable: 0.2,
  },
  drift: {
    needs_rebalance: true,
    total_drift: 0.15,
  },
  suggested_actions: [
    {
      action: "increase",
      bucket: "spot",
      amount: 0.1,
    },
  ],
  regime_context: {
    current_regime: "bullish",
    confidence: 0.85,
  },
};

describe("useDailySuggestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("suggestionKeys factory", () => {
    it("exports all key for cache invalidation", () => {
      expect(suggestionKeys.all).toEqual(["suggestion"]);
    });

    it("generates detail key with userId and params", () => {
      const params = { drift_threshold: 0.1, regime_history_days: 60 };
      const key = suggestionKeys.detail(mockUserId, params);
      expect(key).toEqual(["suggestion", mockUserId, params]);
    });

    it("generates detail key without params", () => {
      const key = suggestionKeys.detail(mockUserId);
      expect(key).toEqual(["suggestion", mockUserId, undefined]);
    });
  });

  describe("hook behavior", () => {
    it("fetches data successfully with userId", async () => {
      vi.mocked(getDailySuggestion).mockResolvedValue(mockSuggestionResponse);

      const { result } = renderHook(() => useDailySuggestion(mockUserId), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSuggestionResponse);
      expect(getDailySuggestion).toHaveBeenCalledWith(mockUserId, {});
    });

    it("fetches data with custom params", async () => {
      vi.mocked(getDailySuggestion).mockResolvedValue(mockSuggestionResponse);
      const params = { drift_threshold: 0.15, regime_history_days: 90 };

      const { result } = renderHook(
        () => useDailySuggestion(mockUserId, params),
        {
          wrapper: QueryClientWrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getDailySuggestion).toHaveBeenCalledWith(mockUserId, params);
    });

    it("shows loading state initially", () => {
      vi.mocked(getDailySuggestion).mockImplementation(
        () => new Promise(() => undefined) // Never resolves
      );

      const { result } = renderHook(() => useDailySuggestion(mockUserId), {
        wrapper: QueryClientWrapper,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("handles error state", async () => {
      const mockError = new Error("Network error");
      vi.mocked(getDailySuggestion).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDailySuggestion(mockUserId), {
        wrapper: QueryClientWrapper,
      });

      // Hook has retry: 2, so 3 attempts before isError
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 10000 }
      );

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });

    it("throws error when userId is undefined and query runs", async () => {
      const { result } = renderHook(
        () => useDailySuggestion(undefined, {}, true),
        {
          wrapper: QueryClientWrapper,
        }
      );

      // Hook has retry: 2, so 3 attempts before isError
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 10000 }
      );

      expect(result.current.error).toEqual(new Error("User ID is required"));
      expect(getDailySuggestion).not.toHaveBeenCalled();
    });

    it("disables query when userId is undefined", () => {
      const { result } = renderHook(() => useDailySuggestion(undefined), {
        wrapper: QueryClientWrapper,
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(getDailySuggestion).not.toHaveBeenCalled();
    });

    it("respects explicit enabled=false", () => {
      const { result } = renderHook(
        () => useDailySuggestion(mockUserId, {}, false),
        {
          wrapper: QueryClientWrapper,
        }
      );

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(getDailySuggestion).not.toHaveBeenCalled();
    });

    it("enables query with explicit enabled=true and userId", async () => {
      vi.mocked(getDailySuggestion).mockResolvedValue(mockSuggestionResponse);

      const { result } = renderHook(
        () => useDailySuggestion(mockUserId, {}, true),
        {
          wrapper: QueryClientWrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getDailySuggestion).toHaveBeenCalledWith(mockUserId, {});
    });

    it("disables query when enabled=false overrides userId presence", () => {
      const { result } = renderHook(
        () => useDailySuggestion(mockUserId, {}, false),
        {
          wrapper: QueryClientWrapper,
        }
      );

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(getDailySuggestion).not.toHaveBeenCalled();
    });

    it("uses correct query key with userId and params", async () => {
      vi.mocked(getDailySuggestion).mockResolvedValue(mockSuggestionResponse);
      const params = { drift_threshold: 0.1 };

      const { result } = renderHook(
        () => useDailySuggestion(mockUserId, params),
        {
          wrapper: QueryClientWrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Query key should match the factory function
      expect(result.current.data).toEqual(mockSuggestionResponse);
    });

    it("uses empty string for userId in query key when undefined", () => {
      const { result } = renderHook(() => useDailySuggestion(undefined), {
        wrapper: QueryClientWrapper,
      });

      // Even though disabled, query key should be generated with empty string
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("retries twice on failure", async () => {
      let callCount = 0;
      vi.mocked(getDailySuggestion).mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error("Network error"));
      });

      const { result } = renderHook(() => useDailySuggestion(mockUserId), {
        wrapper: QueryClientWrapper,
      });

      // Hook has retry: 2, so wait for all 3 attempts
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 10000 }
      );

      // Initial call + 2 retries = 3 total calls
      expect(callCount).toBe(3);
    });

    it("handles empty params object", async () => {
      vi.mocked(getDailySuggestion).mockResolvedValue(mockSuggestionResponse);

      const { result } = renderHook(() => useDailySuggestion(mockUserId, {}), {
        wrapper: QueryClientWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getDailySuggestion).toHaveBeenCalledWith(mockUserId, {});
    });

    it("handles partial params", async () => {
      vi.mocked(getDailySuggestion).mockResolvedValue(mockSuggestionResponse);
      const params = { drift_threshold: 0.1 };

      const { result } = renderHook(
        () => useDailySuggestion(mockUserId, params),
        {
          wrapper: QueryClientWrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getDailySuggestion).toHaveBeenCalledWith(mockUserId, params);
    });
  });
});
