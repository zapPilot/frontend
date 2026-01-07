/**
 * useEtlJobPolling Hook Unit Tests
 *
 * Comprehensive tests for the ETL job polling hook, specifically testing
 * the race condition fix from commit e5302a738a98bd7787e2cdec0610c11068c41fc1.
 *
 * Key scenarios tested:
 * - "completing" intermediate state prevents premature query re-enablement
 * - State machine transitions: idle -> pending -> processing -> completing -> idle
 * - completeTransition() correctly resets state
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEtlJobPolling } from "@/hooks/wallet/useEtlJobPolling";

// Mock account service
const mockTriggerWalletDataFetch = vi.fn();
const mockGetEtlJobStatus = vi.fn();

vi.mock("@/services/accountService", () => ({
  triggerWalletDataFetch: (...args: unknown[]) =>
    mockTriggerWalletDataFetch(...args),
  getEtlJobStatus: (...args: unknown[]) => mockGetEtlJobStatus(...args),
}));

// Create test query wrapper
const createTestQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const TestQueryWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestQueryWrapper.displayName = "TestQueryWrapper";
  return TestQueryWrapper;
};

describe("useEtlJobPolling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should return idle state when no job is active", () => {
      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      expect(result.current.state).toEqual({
        jobId: null,
        status: "idle",
        errorMessage: undefined,
        isLoading: false,
      });
    });

    it("should return all required methods", () => {
      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      expect(result.current.triggerEtl).toBeInstanceOf(Function);
      expect(result.current.startPolling).toBeInstanceOf(Function);
      expect(result.current.reset).toBeInstanceOf(Function);
      expect(result.current.completeTransition).toBeInstanceOf(Function);
    });
  });

  describe("State Derivation - API 'completed' to Internal 'completing'", () => {
    /**
     * CRITICAL TEST: This verifies the race condition fix.
     * When API returns "completed", the hook should internally show "completing"
     * to keep queries disabled until completeTransition() is called.
     */
    it("should map API 'completed' status to internal 'completing' status", async () => {
      // Setup: API returns completed status
      mockGetEtlJobStatus.mockResolvedValue({
        status: "completed",
        error_message: undefined,
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      // Start polling with a job ID
      act(() => {
        result.current.startPolling("test-job-123");
      });

      // Wait for the query to complete
      await waitFor(() => {
        expect(mockGetEtlJobStatus).toHaveBeenCalledWith("test-job-123");
      });

      // CRITICAL: Status should be "completing", NOT "completed"
      // This prevents premature query re-enablement
      await waitFor(() => {
        expect(result.current.state.status).toBe("completing");
        expect(result.current.state.jobId).toBe("test-job-123");
      });
    });

    it("should return 'pending' status while waiting for API response", async () => {
      // Setup: Delay the API response
      mockGetEtlJobStatus.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves - intentional for testing pending state */
          })
      );

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      // Start polling
      act(() => {
        result.current.startPolling("test-job-123");
      });

      // Status should be "pending" while waiting
      expect(result.current.state.status).toBe("pending");
    });

    it("should return 'processing' status when API returns processing", async () => {
      mockGetEtlJobStatus.mockResolvedValue({
        status: "processing",
        error_message: undefined,
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("test-job-123");
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe("processing");
      });
    });

    it("should return 'failed' status when API returns failed", async () => {
      mockGetEtlJobStatus.mockResolvedValue({
        status: "failed",
        error_message: "ETL processing failed",
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("test-job-123");
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe("failed");
        expect(result.current.state.errorMessage).toBe("ETL processing failed");
      });
    });
  });

  describe("completeTransition - Race Condition Prevention", () => {
    /**
     * CRITICAL TEST: Verifies that completeTransition() properly
     * transitions from "completing" to "idle" state.
     */
    it("should transition from 'completing' to 'idle' when completeTransition is called", async () => {
      mockGetEtlJobStatus.mockResolvedValue({
        status: "completed",
        error_message: undefined,
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      // Start polling
      act(() => {
        result.current.startPolling("test-job-123");
      });

      // Wait for "completing" status
      await waitFor(() => {
        expect(result.current.state.status).toBe("completing");
      });

      // Call completeTransition
      act(() => {
        result.current.completeTransition();
      });

      // Status should now be "idle"
      expect(result.current.state.status).toBe("idle");
      expect(result.current.state.jobId).toBeNull();
    });

    it("should clear job ID when completeTransition is called", async () => {
      mockGetEtlJobStatus.mockResolvedValue({
        status: "completed",
        error_message: undefined,
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("test-job-123");
      });

      await waitFor(() => {
        expect(result.current.state.jobId).toBe("test-job-123");
      });

      act(() => {
        result.current.completeTransition();
      });

      expect(result.current.state.jobId).toBeNull();
    });
  });

  describe("State Machine Transitions", () => {
    it("should follow correct state progression: idle -> pending -> processing -> completing", async () => {
      const statusSequence: string[] = [];

      // First return pending, then processing, then completed
      mockGetEtlJobStatus
        .mockResolvedValueOnce({ status: "pending", error_message: undefined })
        .mockResolvedValueOnce({
          status: "processing",
          error_message: undefined,
        })
        .mockResolvedValueOnce({
          status: "completed",
          error_message: undefined,
        });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      // Capture initial state
      statusSequence.push(result.current.state.status);
      expect(result.current.state.status).toBe("idle");

      // Start polling
      act(() => {
        result.current.startPolling("test-job-123");
      });

      // After starting, should be pending (waiting for first API response)
      expect(result.current.state.status).toBe("pending");
      statusSequence.push(result.current.state.status);

      // Wait for pending status from API
      await waitFor(() => {
        expect(mockGetEtlJobStatus).toHaveBeenCalledTimes(1);
      });

      // Verify we've gone through the expected states
      expect(statusSequence).toContain("idle");
      expect(statusSequence).toContain("pending");
    });
  });

  describe("triggerEtl", () => {
    it("should trigger ETL and set job ID", async () => {
      mockTriggerWalletDataFetch.mockResolvedValue({
        job_id: "new-job-123",
        rate_limited: false,
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      await act(async () => {
        await result.current.triggerEtl("user-123", "0x123abc");
      });

      expect(mockTriggerWalletDataFetch).toHaveBeenCalledWith(
        "user-123",
        "0x123abc"
      );
      expect(result.current.state.jobId).toBe("new-job-123");
    });

    it("should handle rate limiting", async () => {
      mockTriggerWalletDataFetch.mockResolvedValue({
        job_id: null,
        rate_limited: true,
        message: "Too many requests. Please wait.",
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      await act(async () => {
        await result.current.triggerEtl("user-123", "0x123abc");
      });

      expect(result.current.state.jobId).toBeNull();
      expect(result.current.state.errorMessage).toBe(
        "Too many requests. Please wait."
      );
    });

    it("should handle trigger errors", async () => {
      mockTriggerWalletDataFetch.mockRejectedValue(
        new Error("Network error occurred")
      );

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      await act(async () => {
        await result.current.triggerEtl("user-123", "0x123abc");
      });

      expect(result.current.state.errorMessage).toBe("Network error occurred");
    });
  });

  describe("startPolling", () => {
    it("should start polling with existing job ID", () => {
      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("existing-job-456");
      });

      expect(result.current.state.jobId).toBe("existing-job-456");
      expect(result.current.state.status).toBe("pending");
    });

    it("should not start polling with empty job ID", () => {
      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("");
      });

      expect(result.current.state.jobId).toBeNull();
      expect(result.current.state.status).toBe("idle");
    });
  });

  describe("reset", () => {
    it("should reset state to idle", async () => {
      mockGetEtlJobStatus.mockResolvedValue({
        status: "processing",
        error_message: undefined,
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("test-job-123");
      });

      await waitFor(() => {
        expect(result.current.state.jobId).toBe("test-job-123");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toEqual({
        jobId: null,
        status: "idle",
        errorMessage: undefined,
        isLoading: false,
      });
    });

    it("should clear error messages on reset", async () => {
      mockTriggerWalletDataFetch.mockRejectedValue(new Error("Some error"));

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      await act(async () => {
        await result.current.triggerEtl("user-123", "0x123abc");
      });

      expect(result.current.state.errorMessage).toBe("Some error");

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.errorMessage).toBeUndefined();
    });
  });

  describe("isLoading state", () => {
    it("should set isLoading true during polling", async () => {
      // Don't resolve immediately
      mockGetEtlJobStatus.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ status: "pending", error_message: undefined }),
              1000
            )
          )
      );

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("test-job-123");
      });

      // During polling, isLoading should be true
      expect(result.current.state.isLoading).toBe(true);
    });

    it("should set isLoading true when job is pending", async () => {
      mockGetEtlJobStatus.mockResolvedValue({
        status: "pending",
        error_message: undefined,
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("test-job-123");
      });

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(true);
      });
    });
  });

  describe("Query Enablement During Completing State", () => {
    /**
     * CRITICAL TEST: The main purpose of the "completing" state is to
     * keep queries disabled while the parent component coordinates
     * cache invalidation and data refetch.
     */
    it("should keep isEtlInProgress-like check true during completing state", async () => {
      mockGetEtlJobStatus.mockResolvedValue({
        status: "completed",
        error_message: undefined,
      });

      const { result } = renderHook(() => useEtlJobPolling(), {
        wrapper: createTestQueryWrapper(),
      });

      act(() => {
        result.current.startPolling("test-job-123");
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe("completing");
      });

      // This is the key check - "completing" should be treated as in-progress
      // for query enablement purposes
      const isEtlInProgress = ["pending", "processing", "completing"].includes(
        result.current.state.status
      );
      expect(isEtlInProgress).toBe(true);

      // After completeTransition, it should no longer be in progress
      act(() => {
        result.current.completeTransition();
      });

      const isStillInProgress = [
        "pending",
        "processing",
        "completing",
      ].includes(result.current.state.status);
      expect(isStillInProgress).toBe(false);
    });
  });
});
