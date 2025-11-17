/**
 * Unit Tests for useUnifiedZapStream Hook
 *
 * Critical test suite for SSE-based transaction streaming.
 * This hook handles real-money transactions via Server-Sent Events.
 *
 * Coverage:
 * - SSE connection lifecycle (connect, disconnect, reconnect)
 * - Event normalization and type coercion
 * - Error handling and recovery
 * - Reconnection logic with exponential backoff
 * - Terminal event handling (complete/error)
 * - Edge cases and malformed data
 * - Complete transaction flows (ZapIn/ZapOut)
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { useUnifiedZapStream } from "@/hooks/useUnifiedZapStream";
import type { NormalizedZapEvent } from "@/schemas/sseEventSchemas";

// ============================================================================
// Mock EventSource Implementation
// ============================================================================

class MockEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 0; // CONNECTING

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    // Automatically transition to CONNECTING state
    this.readyState = MockEventSource.CONNECTING;
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Test utility methods
  simulateOpen() {
    this.readyState = MockEventSource.OPEN;
    if (this.onopen) {
      this.onopen(new Event("open"));
    }
  }

  simulateMessage(data: unknown) {
    const event = new MessageEvent("message", {
      data: JSON.stringify(data),
    });
    if (this.onmessage) {
      this.onmessage(event);
    }
  }

  simulateRawMessage(rawData: string) {
    const event = new MessageEvent("message", {
      data: rawData,
    });
    if (this.onmessage) {
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }
}

// Replace global EventSource with our mock
let mockEventSourceInstance: MockEventSource | null = null;

global.EventSource = vi.fn((url: string) => {
  mockEventSourceInstance = new MockEventSource(url);
  return mockEventSourceInstance as unknown as EventSource;
}) as unknown as typeof EventSource;

// Helper to simulate messages within act()
async function simulateMessage(data: unknown) {
  await act(async () => {
    if (mockEventSourceInstance) {
      mockEventSourceInstance.simulateMessage(data);
    }
  });
}

async function simulateOpen() {
  await act(async () => {
    if (mockEventSourceInstance) {
      mockEventSourceInstance.simulateOpen();
    }
  });
}

async function simulateError() {
  await act(async () => {
    if (mockEventSourceInstance) {
      mockEventSourceInstance.simulateError();
    }
  });
}

async function simulateRawMessage(rawData: string) {
  await act(async () => {
    if (mockEventSourceInstance) {
      mockEventSourceInstance.simulateRawMessage(rawData);
    }
  });
}

// ============================================================================
// Test Data Fixtures
// ============================================================================

const createProgressEvent = (
  progress: number,
  phase: string,
  intentId = "test-intent"
) => ({
  type: "progress",
  intentId,
  progress,
  phase,
  metadata: {
    phase,
    totalStrategies: 10,
    processedStrategies: Math.floor((progress / 100) * 10),
  },
});

const createTransactionEvent = (
  hash: string,
  status: string,
  intentId = "test-intent"
) => ({
  type: "transaction",
  intentId,
  transactions: [
    {
      to: "0x1234567890123456789012345678901234567890",
      data: "0xabcdef",
      value: "0x0",
      chainId: 1,
      hash,
      status,
    },
  ],
  chainId: 1,
});

const createCompleteEvent = (intentId = "test-intent") => ({
  type: "complete",
  intentId,
  progress: 100,
  message: "Transaction completed successfully",
});

const createErrorEvent = (
  code: string,
  message: string,
  intentId = "test-intent"
) => ({
  type: "error",
  intentId,
  error: {
    code,
    message,
  },
});

const createMetadataEvent = (metadata: Record<string, unknown>) => ({
  type: "metadata",
  intentId: "test-intent",
  metadata,
});

// ============================================================================
// Test Suite
// ============================================================================

describe("useUnifiedZapStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventSourceInstance = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ==========================================================================
  // Connection Management Tests
  // ==========================================================================

  describe("SSE Connection Management", () => {
    it("should not connect when enabled=false", () => {
      renderHook(() => useUnifiedZapStream("intent-123", false));

      expect(global.EventSource).not.toHaveBeenCalled();
      expect(mockEventSourceInstance).toBeNull();
    });

    it("should not connect when intentId is null", () => {
      renderHook(() => useUnifiedZapStream(null, true));

      expect(global.EventSource).not.toHaveBeenCalled();
    });

    it("should connect when enabled=true with valid intentId", () => {
      renderHook(() => useUnifiedZapStream("intent-123", true));

      expect(global.EventSource).toHaveBeenCalledTimes(1);
      expect(global.EventSource).toHaveBeenCalledWith(
        expect.stringContaining("intent-123")
      );
    });

    it("should construct correct SSE endpoint URL", () => {
      renderHook(() => useUnifiedZapStream("test-intent", true));

      expect(mockEventSourceInstance).toBeDefined();
      expect(mockEventSourceInstance!.url).toContain("/api/unifiedzap/test-intent/stream");
    });

    it("should set isConnected=true when connection opens", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      expect(result.current.isConnected).toBe(false);

      await simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it("should close connection on unmount", () => {
      const { unmount } = renderHook(() => useUnifiedZapStream("intent-123", true));

      expect(mockEventSourceInstance).toBeDefined();
      const closeSpy = vi.spyOn(mockEventSourceInstance!, "close");

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });

    it("should close connection when intentId changes", () => {
      const { rerender } = renderHook(
        ({ intentId }) => useUnifiedZapStream(intentId, true),
        { initialProps: { intentId: "intent-1" } }
      );

      const firstConnection = mockEventSourceInstance;
      expect(firstConnection).toBeDefined();
      const closeSpy = vi.spyOn(firstConnection!, "close");

      rerender({ intentId: "intent-2" });

      expect(closeSpy).toHaveBeenCalled();
      expect(global.EventSource).toHaveBeenCalledTimes(2);
    });

    it("should close connection when enabled changes to false", () => {
      const { rerender } = renderHook(
        ({ enabled }) => useUnifiedZapStream("intent-123", enabled),
        { initialProps: { enabled: true } }
      );

      const closeSpy = vi.spyOn(mockEventSourceInstance!, "close");

      rerender({ enabled: false });

      expect(closeSpy).toHaveBeenCalled();
    });

    it("should close connection after terminal event (complete)", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();

      await simulateMessage(createCompleteEvent());

      const closeSpy = vi.spyOn(mockEventSourceInstance!, "close");

      // Fast-forward 5 seconds (grace period)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(closeSpy).toHaveBeenCalled();
      });
    });

    it("should close connection after terminal event (error)", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();

      await simulateMessage(
        createErrorEvent("FATAL_ERROR", "Fatal error occurred")
      );

      const closeSpy = vi.spyOn(mockEventSourceInstance!, "close");

      // Fast-forward 5 seconds (grace period)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(closeSpy).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Event Processing Tests
  // ==========================================================================

  describe("Event Processing", () => {
    it("should parse and normalize progress event", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();

      await simulateMessage(
        createProgressEvent(50, "strategy_parsing", "intent-123")
      );

      await waitFor(() => {
        expect(result.current.latestEvent).toBeDefined();
        expect(result.current.latestEvent?.type).toBe("progress");
        expect(result.current.latestEvent?.intentId).toBe("intent-123");
      });
    });

    it("should parse transaction event with normalized fields", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage(
        createTransactionEvent("0xabc123", "pending", "intent-123")
      );

      await waitFor(() => {
        expect(result.current.latestEvent?.type).toBe("transaction");
        expect(result.current.latestEvent?.transactions).toBeDefined();
        expect(result.current.latestEvent?.transactions?.[0]).toMatchObject({
          to: "0x1234567890123456789012345678901234567890",
          data: "0xabcdef",
        });
      });
    });

    it("should parse completion event and set isComplete=true", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage(createCompleteEvent("intent-123"));

      await waitFor(() => {
        expect(result.current.latestEvent?.type).toBe("complete");
        expect(result.current.isComplete).toBe(true);
      });
    });

    it("should parse error event and set hasError=true", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage(
        createErrorEvent("INSUFFICIENT_FUNDS", "Insufficient balance", "intent-123")
      );

      await waitFor(() => {
        expect(result.current.latestEvent?.type).toBe("error");
        expect(result.current.hasError).toBe(true);
        expect(result.current.error).toBe("Insufficient balance");
      });
    });

    it("should handle malformed JSON gracefully", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateRawMessage("{ invalid json }");

      // Should not crash, error state should be set
      await waitFor(() => {
        expect(result.current.error).toBe("Failed to parse stream event");
      });
    });

    it("should accumulate events in order", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();

      await simulateMessage(createProgressEvent(10, "connected"));
      await waitFor(() => expect(result.current.events).toHaveLength(1));

      await simulateMessage(createProgressEvent(30, "strategy_parsing"));
      await waitFor(() => expect(result.current.events).toHaveLength(2));

      await simulateMessage(createProgressEvent(50, "token_analysis"));
      await waitFor(() => expect(result.current.events).toHaveLength(3));

      await waitFor(() => {
        expect(result.current.events[0]?.currentStep).toBe("connected");
        expect(result.current.events[1]?.currentStep).toBe("strategy_parsing");
        expect(result.current.events[2]?.currentStep).toBe("token_analysis");
      });
    });

    it("should update latestEvent pointer correctly", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();

      await simulateMessage(createProgressEvent(10, "connected"));
      await waitFor(() => {
        expect(result.current.latestEvent?.currentStep).toBe("connected");
      });

      await simulateMessage(createProgressEvent(50, "token_analysis"));
      await waitFor(() => {
        expect(result.current.latestEvent?.currentStep).toBe("token_analysis");
      });
    });
  });

  // ==========================================================================
  // Event Normalization & Type Coercion Tests
  // ==========================================================================

  describe("Event Normalization - Type Coercion", () => {
    it("should convert string progress to number", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        progress: "75", // String instead of number
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.progress).toBe(0.75);
      });
    });

    it("should normalize progress >1 by dividing by 100", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        progress: 75, // 75% should become 0.75
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.progress).toBe(0.75);
      });
    });

    it("should handle missing optional fields", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        // No progress, no metadata, minimal fields
      });

      await waitFor(() => {
        expect(result.current.latestEvent).toBeDefined();
        expect(result.current.latestEvent?.type).toBe("progress");
      });
    });

    it("should normalize chain breakdown data", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "metadata",
        metadata: {
          chainBreakdown: [
            { name: "Ethereum", chainId: 1, protocolCount: 5 },
            { name: "Polygon", chainId: 137, protocolCount: 3 },
          ],
        },
      });

      await waitFor(() => {
        const chainBreakdown = result.current.latestEvent?.metadata?.chainBreakdown;
        expect(chainBreakdown).toHaveLength(2);
        expect(chainBreakdown?.[0]).toMatchObject({
          name: "Ethereum",
          chainId: 1,
          protocolCount: 5,
        });
        expect(chainBreakdown?.[1]).toMatchObject({
          name: "Polygon",
          chainId: 137,
          protocolCount: 3,
        });
      });
    });

    it("should extract message from multiple possible locations", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        metadata: {
          message: "Processing strategies...",
        },
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.message).toBe("Processing strategies...");
      });
    });

    it("should normalize transactions array", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "transaction",
        transactions: [
          {
            to: "0xRecipient",
            data: "0xCalldata",
            value: "1000000000000000000", // 1 ETH
            chainId: 1,
          },
        ],
      });

      await waitFor(() => {
        const tx = result.current.latestEvent?.transactions?.[0];
        expect(tx).toMatchObject({
          to: "0xRecipient",
          data: "0xCalldata",
          value: "1000000000000000000",
          chainId: 1,
        });
      });
    });

    it("should handle nested metadata fields", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        metadata: {
          totalStrategies: 10,
          processedStrategies: 5,
          totalProtocols: 20,
          processedProtocols: 12,
        },
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.metadata).toMatchObject({
          totalStrategies: 10,
          processedStrategies: 5,
          totalProtocols: 20,
          processedProtocols: 12,
        });
      });
    });

    it("should set progress=1 for complete events", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "complete",
        progress: 0, // Should be overridden to 1
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.progress).toBe(1);
      });
    });

    it("should normalize error object from string", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "error",
        error: "String error message",
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.error).toMatchObject({
          code: "STREAM_ERROR",
          message: "String error message",
        });
      });
    });

    it("should normalize error object from object", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "error",
        error: {
          code: "CUSTOM_ERROR",
          message: "Custom error message",
        },
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.error).toMatchObject({
          code: "CUSTOM_ERROR",
          message: "Custom error message",
        });
      });
    });
  });

  // ==========================================================================
  // Reconnection Logic Tests
  // ==========================================================================

  describe("Reconnection Logic", () => {
    it("should attempt reconnection on error", async () => {
      renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateError();

      // Fast-forward reconnect delay
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(global.EventSource).toHaveBeenCalledTimes(2);
      });
    });

    it("should respect MAX_RECONNECT_ATTEMPTS (3)", async () => {
      renderHook(() => useUnifiedZapStream("intent-123", true));

      // Initial connection
      expect(global.EventSource).toHaveBeenCalledTimes(1);

      // Simulate 3 consecutive errors
      for (let i = 0; i < 3; i++) {
        await simulateError();
        await act(async () => {
          vi.advanceTimersByTime(2000);
        });
        await waitFor(() => {
          expect(global.EventSource).toHaveBeenCalledTimes(i + 2);
        });
      }

      // Should have tried 4 times total (initial + 3 retries)
      expect(global.EventSource).toHaveBeenCalledTimes(4);

      // 4th error should not trigger another retry
      await simulateError();
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Should still be 4
      expect(global.EventSource).toHaveBeenCalledTimes(4);
    });

    it("should reset reconnection counter on successful connection", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      // Error → reconnect
      await simulateError();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(global.EventSource).toHaveBeenCalledTimes(2);
      });

      // Successful connection
      await simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Should now be able to retry 3 more times
      await simulateError();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(global.EventSource).toHaveBeenCalledTimes(3);
      });
    });

    it("should not reconnect after terminal event (complete)", async () => {
      renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage(createCompleteEvent());

      // Simulate error after complete
      await simulateError();
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Should not reconnect
      expect(global.EventSource).toHaveBeenCalledTimes(1);
    });

    it("should not reconnect after terminal event (error)", async () => {
      renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage(
        createErrorEvent("FATAL", "Fatal error")
      );

      // Simulate another error
      await simulateError();
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Should not reconnect
      expect(global.EventSource).toHaveBeenCalledTimes(1);
    });

    it("should set error message after max reconnection attempts", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      // Simulate 3 consecutive errors (max attempts)
      for (let i = 0; i < 3; i++) {
        await simulateError();
        await act(async () => {
          vi.advanceTimersByTime(2000);
        });
      }

      // 4th error should set error message
      await simulateError();

      await waitFor(() => {
        expect(result.current.error).toContain("Stream connection failed");
      });
    });
  });

  // ==========================================================================
  // Terminal Event Handling Tests
  // ==========================================================================

  describe("Terminal Event Handling", () => {
    it("should keep connection open for 5s after 'complete' event", async () => {
      renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      const closeSpy = vi.spyOn(mockEventSourceInstance!, "close");

      await simulateMessage(createCompleteEvent());

      // Should not close immediately
      expect(closeSpy).not.toHaveBeenCalled();

      // Fast-forward 4 seconds (not enough)
      await act(async () => {
        vi.advanceTimersByTime(4000);
      });
      expect(closeSpy).not.toHaveBeenCalled();

      // Fast-forward 1 more second (total 5s)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(closeSpy).toHaveBeenCalled();
      });
    });

    it("should keep connection open for 5s after 'error' event", async () => {
      renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      const closeSpy = vi.spyOn(mockEventSourceInstance!, "close");

      await simulateMessage(
        createErrorEvent("FATAL", "Fatal error")
      );

      // Should not close immediately
      expect(closeSpy).not.toHaveBeenCalled();

      // Fast-forward 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(closeSpy).toHaveBeenCalled();
      });
    });

    it("should not reconnect after complete event even on error", async () => {
      renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage(createCompleteEvent());

      const initialCallCount = (global.EventSource as ReturnType<typeof vi.fn>).mock.calls.length;

      // Trigger error
      await simulateError();
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Should not create new connection
      expect(global.EventSource).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  // ==========================================================================
  // Edge Cases & Error Scenarios
  // ==========================================================================

  describe("Edge Cases & Error Scenarios", () => {
    it("should handle null intentId gracefully", () => {
      const { result } = renderHook(() => useUnifiedZapStream(null, true));

      expect(global.EventSource).not.toHaveBeenCalled();
      expect(result.current.latestEvent).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    it("should handle empty string intentId", () => {
      const { result } = renderHook(() => useUnifiedZapStream("", true));

      expect(global.EventSource).not.toHaveBeenCalled();
      expect(result.current.latestEvent).toBeNull();
    });

    it("should handle rapid enable/disable toggling", () => {
      const { rerender } = renderHook(
        ({ enabled }) => useUnifiedZapStream("intent-123", enabled),
        { initialProps: { enabled: true } }
      );

      // Rapid toggling
      rerender({ enabled: false });
      rerender({ enabled: true });
      rerender({ enabled: false });
      rerender({ enabled: true });

      // Should not crash
      expect(() => rerender({ enabled: false })).not.toThrow();
    });

    it("should handle very large event payloads", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();

      // Simulate large transaction list
      const largePayload = {
        type: "metadata",
        transactions: Array.from({ length: 1000 }, (_, i) => ({
          to: `0x${i.toString(16).padStart(40, "0")}`,
          data: "0x",
          hash: `0x${i}`,
          index: i,
        })),
      };

      await simulateMessage(largePayload);

      await waitFor(() => {
        expect(result.current.latestEvent).toBeDefined();
      });
    });

    it("should handle events with missing type field", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        // No type field
        progress: 50,
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.type).toBe("progress"); // Default
      });
    });

    it("should handle events with invalid progress values", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        progress: -10, // Negative
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.progress).toBe(0); // Normalized to 0
      });
    });

    it("should handle events with progress > 100", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        progress: 150, // > 100
      });

      await waitFor(() => {
        expect(result.current.latestEvent?.progress).toBe(1); // Clamped to 1
      });
    });

    it("should handle transactions without required fields", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "transaction",
        transactions: [
          {
            // Missing 'to' and 'data'
            value: "1000",
          },
        ],
      });

      await waitFor(() => {
        // Should filter out invalid transactions
        expect(result.current.latestEvent?.transactions).toBeUndefined();
      });
    });

    it("should handle mixed valid/invalid transactions", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "transaction",
        transactions: [
          {
            to: "0xValid",
            data: "0xCalldata",
          },
          {
            // Invalid - missing 'to'
            data: "0xCalldata",
          },
          {
            to: "0xValid2",
            data: "0xCalldata2",
          },
        ],
      });

      await waitFor(() => {
        // Should only include valid transactions
        expect(result.current.latestEvent?.transactions).toHaveLength(2);
      });
    });
  });

  // ==========================================================================
  // Derived State Tests
  // ==========================================================================

  describe("Derived State", () => {
    it("should calculate progress from latestEvent", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        progress: 75,
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(0.75);
      });
    });

    it("should calculate currentStep from latestEvent", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "progress",
        phase: "token_analysis",
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe("token_analysis");
      });
    });

    it("should calculate transactions from latestEvent", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage({
        type: "transaction",
        transactions: [
          { to: "0x1", data: "0x" },
          { to: "0x2", data: "0x" },
        ],
      });

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(2);
      });
    });

    it("should set isComplete when latestEvent is complete", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      expect(result.current.isComplete).toBe(false);

      await simulateOpen();
      await simulateMessage(createCompleteEvent());

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });
    });

    it("should set hasError when latestEvent is error", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      expect(result.current.hasError).toBe(false);

      await simulateOpen();
      await simulateMessage(
        createErrorEvent("TEST_ERROR", "Test error")
      );

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Public API Tests
  // ==========================================================================

  describe("Public API", () => {
    it("should expose closeStream function", () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      expect(typeof result.current.closeStream).toBe("function");
    });

    it("should close stream when closeStream is called", () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      const closeSpy = vi.spyOn(mockEventSourceInstance!, "close");

      result.current.closeStream();

      expect(closeSpy).toHaveBeenCalled();
    });

    it("should expose reconnect function", () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      expect(typeof result.current.reconnect).toBe("function");
    });

    it("should clear events and reconnect when reconnect is called", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage(createProgressEvent(50, "test"));

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      result.current.reconnect();

      await waitFor(() => {
        expect(result.current.events).toHaveLength(0);
        expect(global.EventSource).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ==========================================================================
  // Integration Scenarios
  // ==========================================================================

  describe("Integration Scenarios", () => {
    it("should handle complete ZapIn flow", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("zapin-123", true));

      await simulateOpen();

      // Sequence of events
      const events = [
        { type: "connected", message: "Connected to stream" },
        { type: "progress", progress: 10, phase: "strategy_parsing" },
        { type: "progress", progress: 30, phase: "token_analysis" },
        { type: "progress", progress: 50, phase: "swap_preparation" },
        {
          type: "transaction",
          transactions: [{ to: "0xabc", data: "0x", hash: "0xabc", status: "pending" }],
        },
        { type: "progress", progress: 75, phase: "gas_estimation" },
        { type: "progress", progress: 100, phase: "complete" },
        { type: "complete", message: "ZapIn completed successfully" },
      ];

      for (const event of events) {
        await simulateMessage(event);
        await act(async () => {
          vi.advanceTimersByTime(100);
        });
      }

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.latestEvent?.type).toBe("complete");
        expect(result.current.events.length).toBeGreaterThan(0);
      });
    });

    it("should handle ZapOut flow with multiple transactions", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("zapout-123", true));

      await simulateOpen();

      await simulateMessage({
        type: "progress",
        progress: 25,
        phase: "withdrawal_preparation",
      });

      await simulateMessage({
        type: "transaction",
        transactions: [
          { to: "0x1", data: "0x", chainId: 1 },
          { to: "0x2", data: "0x", chainId: 1 },
          { to: "0x3", data: "0x", chainId: 137 },
        ],
      });

      await simulateMessage(createCompleteEvent("zapout-123"));

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.transactions).toHaveLength(3);
      });
    });

    it("should handle error during execution", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();

      await simulateMessage(createProgressEvent(10, "connected"));
      await simulateMessage(createProgressEvent(30, "strategy_parsing"));

      await simulateMessage(
        createErrorEvent("INSUFFICIENT_FUNDS", "Insufficient balance for transaction")
      );

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
        expect(result.current.error).toBe("Insufficient balance for transaction");
        expect(result.current.latestEvent?.type).toBe("error");
      });
    });

    it("should handle connection error and recovery", async () => {
      const { result } = renderHook(() => useUnifiedZapStream("intent-123", true));

      await simulateOpen();
      await simulateMessage(createProgressEvent(25, "strategy_parsing"));

      // Connection error
      await simulateError();
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Reconnected
      await waitFor(() => {
        expect(global.EventSource).toHaveBeenCalledTimes(2);
      });

      await simulateOpen();
      await simulateMessage(createProgressEvent(50, "token_analysis"));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.events.length).toBeGreaterThan(1);
      });
    });
  });
});
