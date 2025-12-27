/**
 * useAsyncRetryButton - Hook Tests
 *
 * Tests for the async retry button hook.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAsyncRetryButton } from "@/hooks/useAsyncRetryButton";

describe("useAsyncRetryButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial state", () => {
    it("should return isRetrying as false initially", () => {
      const onRetry = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "test operation",
        })
      );

      expect(result.current.isRetrying).toBe(false);
      expect(typeof result.current.handleRetry).toBe("function");
    });
  });

  describe("Successful retry flow", () => {
    it("should set isRetrying to true during retry", async () => {
      let resolveRetry: () => void;
      const retryPromise = new Promise<void>(resolve => {
        resolveRetry = resolve;
      });
      const onRetry = vi.fn().mockReturnValue(retryPromise);

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "test operation",
        })
      );

      act(() => {
        result.current.handleRetry();
      });

      expect(result.current.isRetrying).toBe(true);

      // Resolve the retry
      await act(async () => {
        resolveRetry!();
        await retryPromise;
      });

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });
    });

    it("should call onRetry when handleRetry is invoked", async () => {
      const onRetry = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "test operation",
        })
      );

      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1);
      });
    });

    it("should set isRetrying back to false after successful retry", async () => {
      const onRetry = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "test operation",
        })
      );

      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe("Error handling with logger", () => {
    it("should log error when retry fails and logger is provided", async () => {
      const error = new Error("Retry failed");
      const onRetry = vi.fn().mockRejectedValue(error);
      const logger = { error: vi.fn() };

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "fetch data",
          logger,
        })
      );

      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to fetch data",
          error
        );
      });
    });

    it("should reset isRetrying to false even after error", async () => {
      const onRetry = vi.fn().mockRejectedValue(new Error("Failed"));
      const logger = { error: vi.fn() };

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "test",
          logger,
        })
      );

      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });
    });
  });

  describe("Error handling without logger", () => {
    it("should not throw when retry fails and no logger provided", async () => {
      const onRetry = vi.fn().mockRejectedValue(new Error("Failed"));

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "test operation",
        })
      );

      // Should not throw
      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });

      expect(onRetry).toHaveBeenCalled();
    });

    it("should still reset state after error without logger", async () => {
      const onRetry = vi.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "network call",
        })
      );

      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });
    });
  });

  describe("Multiple retry calls", () => {
    it("should handle rapid consecutive retry calls", async () => {
      const onRetry = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "test",
        })
      );

      act(() => {
        result.current.handleRetry();
        result.current.handleRetry();
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(result.current.isRetrying).toBe(false);
      });

      // All three calls should have been made
      expect(onRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe("Callback stability", () => {
    it("should return stable handleRetry reference when deps unchanged", () => {
      const onRetry = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(() =>
        useAsyncRetryButton({
          onRetry,
          errorContext: "test",
        })
      );

      const firstHandle = result.current.handleRetry;

      rerender();

      expect(result.current.handleRetry).toBe(firstHandle);
    });

    it("should update handleRetry when onRetry changes", () => {
      const onRetry1 = vi.fn().mockResolvedValue(undefined);
      const onRetry2 = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ onRetry }) =>
          useAsyncRetryButton({
            onRetry,
            errorContext: "test",
          }),
        { initialProps: { onRetry: onRetry1 } }
      );

      const firstHandle = result.current.handleRetry;

      rerender({ onRetry: onRetry2 });

      expect(result.current.handleRetry).not.toBe(firstHandle);
    });
  });
});
