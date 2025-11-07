/**
 * Integration tests for useUnifiedZapStream hook
 *
 * Tests edge cases and data normalization to ensure reliability
 * for complex WebSocket event processing.
 *
 * Key test areas:
 * - Malformed event data handling
 * - ChainBreakdown normalization (3 different locations)
 * - WebSocket connection states
 * - Progress calculation
 * - Event type processing
 * - State management
 *
 * @see src/hooks/useUnifiedZapStream.ts
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  UNIFIED_ZAP_PHASES,
  useUnifiedZapStream,
} from "@/hooks/useUnifiedZapStream";

// Mock EventSource for SSE testing
class MockEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = this.OPEN;
      act(() => {
        this.onopen?.(new Event("open"));
      });
    }, 0);
  }

  close() {
    this.readyState = this.CLOSED;
  }

  // Test helper to simulate receiving an event
  simulateMessage(data: any) {
    if (this.onmessage && this.readyState === this.OPEN) {
      const event = new MessageEvent("message", {
        data: JSON.stringify(data),
      });
      act(() => {
        this.onmessage?.(event);
      });
    }
  }

  // Test helper to simulate an error
  simulateError() {
    if (this.onerror) {
      act(() => {
        this.onerror?.(new Event("error"));
      });
    }
  }
}

// Store reference to mock instance
let mockEventSourceInstance: MockEventSource | null = null;

describe("useUnifiedZapStream - Edge Cases", () => {
  beforeEach(() => {
    // Mock EventSource globally
    mockEventSourceInstance = null;
    global.EventSource = vi.fn((url: string) => {
      mockEventSourceInstance = new MockEventSource(url);
      return mockEventSourceInstance as any;
    }) as any;

    // Mock logger to avoid console noise
    vi.mock("@/utils/logger", () => ({
      logger: {
        createContextLogger: () => ({
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        }),
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockEventSourceInstance = null;
  });

  describe("Malformed Phase Data Handling", () => {
    it("handles null phase gracefully", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-1", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Simulate malformed event with null phase
      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        phase: null,
        progress: 0.5,
      });

      await waitFor(() => expect(result.current.events.length).toBe(1));

      const event = result.current.latestEvent;
      expect(event).toBeTruthy();
      expect(event?.type).toBe("progress");
      expect(event?.progress).toBe(0.5);
      // Should not crash, phase should be null
      expect(event?.currentStep).toBeNull();
    });

    it("handles undefined currentStep", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-2", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        currentStep: undefined,
        progress: 0.3,
      });

      await waitFor(() => expect(result.current.events.length).toBe(1));

      expect(result.current.latestEvent?.currentStep).toBeNull();
      expect(result.current.currentStep).toBeNull();
    });

    it("handles unknown phase type", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-3", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      mockEventSourceInstance?.simulateMessage({
        type: "unknown_type",
        phase: "unknown_phase",
        progress: 0.25,
      });

      await waitFor(() => expect(result.current.events.length).toBe(1));

      // Should normalize to safe defaults
      expect(result.current.latestEvent?.type).toBe("unknown_type");
      expect(result.current.latestEvent?.progress).toBe(0.25);
    });

    it("handles missing required fields", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-4", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Event with minimal data
      mockEventSourceInstance?.simulateMessage({});

      await waitFor(() => expect(result.current.events.length).toBe(1));

      const event = result.current.latestEvent;
      expect(event?.type).toBe("progress"); // Default type
      expect(event?.progress).toBe(0); // Default progress
      expect(event?.timestamp).toBeTruthy(); // Should have timestamp
    });

    it("normalizes phase from multiple sources", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-5", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Phase in metadata takes precedence
      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        currentStep: "token_analysis",
        metadata: {
          phase: "strategy_parsing",
        },
      });

      await waitFor(() => expect(result.current.events.length).toBe(1));

      // Should use valid phase from available sources
      expect(result.current.latestEvent?.currentStep).toBeTruthy();
      expect(UNIFIED_ZAP_PHASES).toContain(
        result.current.latestEvent?.currentStep as any
      );
    });
  });

  describe("Missing or Null Event Data", () => {
    it("handles null event data", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-6", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      mockEventSourceInstance?.simulateMessage(null);

      // Should not crash but might not create event
      await waitFor(() => {
        expect(result.current.hasError).toBe(false);
      });
    });

    it("handles empty object event", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-7", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      mockEventSourceInstance?.simulateMessage({});

      await waitFor(() => expect(result.current.events.length).toBe(1));

      const event = result.current.latestEvent;
      expect(event?.type).toBe("progress");
      expect(event?.progress).toBe(0);
      expect(event?.intentId).toBe("test-intent-7");
    });
  });

  describe("Invalid Timestamps", () => {
    it("handles null timestamp", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-8", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        timestamp: null,
        progress: 0.5,
      });

      await waitFor(() => expect(result.current.events.length).toBe(1));

      // Should use current timestamp as fallback
      expect(result.current.latestEvent?.timestamp).toBeTruthy();
      expect(typeof result.current.latestEvent?.timestamp).toBe("string");
    });

    it("handles undefined timestamp", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-9", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        progress: 0.5,
      });

      await waitFor(() => expect(result.current.events.length).toBe(1));

      expect(result.current.latestEvent?.timestamp).toBeTruthy();
    });

    it("handles invalid timestamp string", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-10", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        timestamp: "invalid-date",
        progress: 0.5,
      });

      await waitFor(() => expect(result.current.events.length).toBe(1));

      // Should preserve the value even if invalid ISO format
      expect(result.current.latestEvent?.timestamp).toBe("invalid-date");
    });

    it("uses rawTimestamp as fallback", async () => {
      const { result } = renderHook(() =>
        useUnifiedZapStream("test-intent-11", true)
      );

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      const rawTime = "2025-10-24T12:00:00Z";
      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        rawTimestamp: rawTime,
        progress: 0.5,
      });

      await waitFor(() => expect(result.current.events.length).toBe(1));

      expect(result.current.latestEvent?.timestamp).toBe(rawTime);
    });
  });
});

describe("useUnifiedZapStream - ChainBreakdown Normalization", () => {
  beforeEach(() => {
    mockEventSourceInstance = null;
    global.EventSource = vi.fn((url: string) => {
      mockEventSourceInstance = new MockEventSource(url);
      return mockEventSourceInstance as any;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes chainBreakdown from metadata location", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-12", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      metadata: {
        chainBreakdown: [
          { name: "Ethereum", chainId: 1, protocolCount: 5 },
          { name: "Polygon", chainId: 137, protocolCount: 3 },
        ],
      },
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    const breakdown = result.current.latestEvent?.metadata?.chainBreakdown;
    expect(breakdown).toBeDefined();
    expect(breakdown?.length).toBe(2);
    expect(breakdown?.[0]).toEqual({
      name: "Ethereum",
      chainId: 1,
      protocolCount: 5,
    });
  });

  it("normalizes chainBreakdown from root location", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-13", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      chainBreakdown: [{ name: "Arbitrum", chainId: 42161, protocolCount: 2 }],
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    const breakdown = result.current.latestEvent?.metadata?.chainBreakdown;
    expect(breakdown).toBeDefined();
    expect(breakdown?.length).toBe(1);
    expect(breakdown?.[0]?.name).toBe("Arbitrum");
  });

  it("normalizes chainBreakdown from chains property", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-14", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      chains: [{ name: "Optimism", chainId: 10, protocolCount: 4 }],
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    const breakdown = result.current.latestEvent?.metadata?.chainBreakdown;
    expect(breakdown).toBeDefined();
    expect(breakdown?.length).toBe(1);
    expect(breakdown?.[0]?.chainId).toBe(10);
  });

  it("handles missing chainBreakdown", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-15", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progress: 0.5,
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    expect(
      result.current.latestEvent?.metadata?.chainBreakdown
    ).toBeUndefined();
  });

  it("handles malformed chainBreakdown entries", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-16", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      chainBreakdown: [
        { name: "Ethereum", chainId: 1, protocolCount: 5 }, // valid
        { name: null, chainId: 2, protocolCount: 3 }, // invalid name
        { name: "Polygon", protocolCount: 2 }, // missing chainId
        { name: "Arbitrum", chainId: 42161 }, // missing protocolCount
        null, // null entry
        undefined, // undefined entry
        "invalid", // invalid type
      ],
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    const breakdown = result.current.latestEvent?.metadata?.chainBreakdown;
    // Should only include the valid entry
    expect(breakdown?.length).toBe(1);
    expect(breakdown?.[0]?.name).toBe("Ethereum");
  });

  it("prioritizes metadata.chainBreakdown over root chainBreakdown", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-17", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      chainBreakdown: [{ name: "Root", chainId: 1, protocolCount: 1 }],
      metadata: {
        chainBreakdown: [{ name: "Metadata", chainId: 2, protocolCount: 2 }],
      },
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    const breakdown = result.current.latestEvent?.metadata?.chainBreakdown;
    // Metadata should take precedence
    expect(breakdown?.[0]?.name).toBe("Metadata");
  });
});

describe("useUnifiedZapStream - Connection Management", () => {
  beforeEach(() => {
    mockEventSourceInstance = null;
    global.EventSource = vi.fn((url: string) => {
      mockEventSourceInstance = new MockEventSource(url);
      return mockEventSourceInstance as any;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("handles connection errors gracefully", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-18", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Simulate connection error
    mockEventSourceInstance?.simulateError();

    await waitFor(
      () => {
        expect(result.current.isConnected).toBe(false);
      },
      { timeout: 3000 }
    );
  });

  it("handles reconnection after disconnect", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-19", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Close connection
    await act(async () => {
      result.current.closeStream();
    });

    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Trigger reconnect
    await act(async () => {
      result.current.reconnect();
    });

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Should have cleared events on manual reconnect
    expect(result.current.events.length).toBe(0);
  });

  it("handles multiple rapid events", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-20", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Simulate 15 rapid events
    for (let i = 0; i < 15; i++) {
      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        progress: i / 15,
        currentStep: "strategy_parsing",
      });
    }

    await waitFor(() => expect(result.current.events.length).toBe(15));

    // All events should be processed
    expect(result.current.latestEvent?.progress).toBeCloseTo(14 / 15);
  });

  it("cleans up on unmount", async () => {
    const { result, unmount } = renderHook(() =>
      useUnifiedZapStream("test-intent-21", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    const closeSpy = vi.spyOn(
      mockEventSourceInstance as MockEventSource,
      "close"
    );

    unmount();

    expect(closeSpy).toHaveBeenCalled();
    expect(mockEventSourceInstance?.readyState).toBe(
      mockEventSourceInstance?.CLOSED
    );
  });

  it("closes connection after terminal event", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-22", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Send complete event
    mockEventSourceInstance?.simulateMessage({
      type: "complete",
      progress: 1,
    });

    await waitFor(() => expect(result.current.isComplete).toBe(true));

    // Should close after 5 seconds
    await waitFor(
      () => {
        expect(result.current.isConnected).toBe(false);
      },
      { timeout: 6000 }
    );
  });
});

describe("useUnifiedZapStream - Progress Calculation", () => {
  beforeEach(() => {
    mockEventSourceInstance = null;
    global.EventSource = vi.fn((url: string) => {
      mockEventSourceInstance = new MockEventSource(url);
      return mockEventSourceInstance as any;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes progress from 0-1 range", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-23", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progress: 0.75,
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    expect(result.current.progress).toBe(0.75);
  });

  it("normalizes progress from 0-100 range", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-24", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progressPercent: 75,
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    // Should convert 75% to 0.75
    expect(result.current.progress).toBe(0.75);
  });

  it("handles completed phases with 100% progress", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-25", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "complete",
      currentStep: "complete",
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    expect(result.current.progress).toBe(1);
    expect(result.current.isComplete).toBe(true);
  });

  it("handles negative progress values", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-26", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progress: -0.5,
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    // Should normalize to 0
    expect(result.current.progress).toBe(0);
  });

  it("handles progress values over 100%", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-27", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progress: 150, // Raw progress > 100
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    // Should normalize 150 to 1.0 (150/100 capped at 1)
    expect(result.current.progress).toBe(1);
  });

  it("handles NaN progress values", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-28", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progress: NaN,
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    // Should use fallback of 0
    expect(result.current.progress).toBe(0);
  });
});

describe("useUnifiedZapStream - Event Types", () => {
  beforeEach(() => {
    mockEventSourceInstance = null;
    global.EventSource = vi.fn((url: string) => {
      mockEventSourceInstance = new MockEventSource(url);
      return mockEventSourceInstance as any;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("processes progress events correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-29", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      phase: "strategy_parsing",
      progress: 0.3,
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    expect(result.current.latestEvent?.type).toBe("progress");
    expect(result.current.latestEvent?.phase).toBe("strategy_parsing");
  });

  it("processes complete events correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-30", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "complete",
      currentStep: "complete",
      message: "Operation completed successfully",
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    expect(result.current.isComplete).toBe(true);
    expect(result.current.latestEvent?.message).toBe(
      "Operation completed successfully"
    );
  });

  it("processes error events correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-31", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    await act(async () => {
      mockEventSourceInstance?.simulateMessage({
        type: "error",
        error: {
          code: "INSUFFICIENT_FUNDS",
          message: "Not enough balance",
        },
      });
    });

    await waitFor(() => {
      expect(result.current.events.length).toBe(1);
      expect(result.current.hasError).toBe(true);
      expect(result.current.error).toBe("Not enough balance");
    });
    expect(result.current.latestEvent?.error?.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("handles error as string", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-32", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "error",
      error: "Simple error message",
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    expect(result.current.hasError).toBe(true);
    expect(result.current.latestEvent?.error?.message).toBe(
      "Simple error message"
    );
    expect(result.current.latestEvent?.error?.code).toBe("STREAM_ERROR");
  });

  it("handles unknown event types", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-33", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "custom_event",
      data: "custom data",
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    // Should not crash
    expect(result.current.latestEvent?.type).toBe("custom_event");
  });
});

describe("useUnifiedZapStream - State Management", () => {
  beforeEach(() => {
    mockEventSourceInstance = null;
    global.EventSource = vi.fn((url: string) => {
      mockEventSourceInstance = new MockEventSource(url);
      return mockEventSourceInstance as any;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("maintains event history correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-34", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Send 5 events
    for (let i = 0; i < 5; i++) {
      mockEventSourceInstance?.simulateMessage({
        type: "progress",
        progress: i / 5,
        currentStep: "strategy_parsing",
      });
    }

    await waitFor(() => expect(result.current.events.length).toBe(5));

    // All events should be in history
    expect(result.current.events[0]?.progress).toBe(0);
    expect(result.current.events[4]?.progress).toBeCloseTo(0.8);
  });

  it("provides latest event correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-35", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progress: 0.25,
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progress: 0.75,
    });

    await waitFor(() => expect(result.current.events.length).toBe(2));

    // Latest event should be the most recent
    expect(result.current.latestEvent?.progress).toBe(0.75);
  });

  it("calculates isComplete correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-36", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    expect(result.current.isComplete).toBe(false);

    mockEventSourceInstance?.simulateMessage({
      type: "complete",
    });

    await waitFor(() => expect(result.current.isComplete).toBe(true));
  });

  it("tracks errors correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-37", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    expect(result.current.hasError).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      mockEventSourceInstance?.simulateMessage({
        type: "error",
        error: "Test error",
      });
    });

    // Error state should be set
    await waitFor(() => {
      expect(result.current.events.length).toBe(1);
      expect(result.current.hasError).toBe(true);
      expect(result.current.error).toBe("Test error");
    });
  });

  it("provides transactions correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-38", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    const mockTx = {
      to: "0x1234567890123456789012345678901234567890",
      data: "0xabcdef",
      value: "1000000000000000000",
      chainId: 1,
    };

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      transactions: [mockTx],
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    expect(result.current.transactions.length).toBe(1);
    expect(result.current.transactions[0]).toMatchObject(mockTx);
  });

  it("clears events on manual reconnect", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-39", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Add some events
    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      progress: 0.5,
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    // Manual reconnect should clear events
    await act(async () => {
      result.current.reconnect();
    });

    await waitFor(() => {
      expect(result.current.events.length).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  it("respects enabled flag", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useUnifiedZapStream("test-intent-40", enabled),
      { initialProps: { enabled: false } }
    );

    // Should not connect when disabled
    expect(result.current.isConnected).toBe(false);

    // Enable streaming
    rerender({ enabled: true });

    await waitFor(() => expect(result.current.isConnected).toBe(true));
  });
});

describe("useUnifiedZapStream - Transaction Normalization", () => {
  beforeEach(() => {
    mockEventSourceInstance = null;
    global.EventSource = vi.fn((url: string) => {
      mockEventSourceInstance = new MockEventSource(url);
      return mockEventSourceInstance as any;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes transaction data correctly", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-41", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      transactions: [
        {
          to: "0x1234567890123456789012345678901234567890",
          data: "0xabcdef",
          value: "1000000000000000000",
          gas: "21000",
          gasPrice: "50000000000",
          chainId: 1,
        },
      ],
    });

    await waitFor(() => expect(result.current.transactions.length).toBe(1));

    const tx = result.current.transactions[0];
    expect(tx?.to).toBe("0x1234567890123456789012345678901234567890");
    expect(tx?.data).toBe("0xabcdef");
    expect(tx?.value).toBe("1000000000000000000");
    expect(tx?.gas).toBe("21000");
    expect(tx?.chainId).toBe(1);
  });

  it("handles transactions with EIP-1559 fields", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-42", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      transactions: [
        {
          to: "0x1234567890123456789012345678901234567890",
          data: "0xabcdef",
          maxFeePerGas: "100000000000",
          maxPriorityFeePerGas: "2000000000",
        },
      ],
    });

    await waitFor(() => expect(result.current.transactions.length).toBe(1));

    const tx = result.current.transactions[0];
    expect(tx?.maxFeePerGas).toBe("100000000000");
    expect(tx?.maxPriorityFeePerGas).toBe("2000000000");
  });

  it("filters out invalid transactions", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-43", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      transactions: [
        {
          to: "0x1234567890123456789012345678901234567890",
          data: "0xabcdef",
        }, // valid
        { to: "0x1234567890123456789012345678901234567890" }, // missing data
        { data: "0xabcdef" }, // missing to
        null, // null
        "invalid", // invalid type
      ],
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    // Should only include valid transaction
    expect(result.current.transactions.length).toBe(1);
  });

  it("adds chainId from event to transactions", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-44", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      chainId: 137,
      transactions: [
        {
          to: "0x1234567890123456789012345678901234567890",
          data: "0xabcdef",
        },
      ],
    });

    await waitFor(() => expect(result.current.transactions.length).toBe(1));

    // ChainId should be added to transaction
    expect(result.current.transactions[0]?.chainId).toBe(137);
  });
});

describe("useUnifiedZapStream - Metadata Normalization", () => {
  beforeEach(() => {
    mockEventSourceInstance = null;
    global.EventSource = vi.fn((url: string) => {
      mockEventSourceInstance = new MockEventSource(url);
      return mockEventSourceInstance as any;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes metadata from multiple sources", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-45", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      metadata: {
        totalStrategies: 10,
        totalProtocols: 5,
        estimatedDuration: "30s",
      },
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    const metadata = result.current.latestEvent?.metadata;
    expect(metadata?.totalStrategies).toBe(10);
    expect(metadata?.totalProtocols).toBe(5);
    expect(metadata?.estimatedDuration).toBe("30s");
  });

  it("prefers metadata over root-level properties", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-46", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      totalStrategies: 5,
      metadata: {
        totalStrategies: 10,
      },
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    // Metadata should take precedence
    expect(result.current.latestEvent?.metadata?.totalStrategies).toBe(10);
  });

  it("normalizes message from multiple locations", async () => {
    const { result } = renderHook(() =>
      useUnifiedZapStream("test-intent-47", true)
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    mockEventSourceInstance?.simulateMessage({
      type: "progress",
      metadata: {
        message: "Processing strategies",
      },
    });

    await waitFor(() => expect(result.current.events.length).toBe(1));

    expect(result.current.latestEvent?.message).toBe("Processing strategies");
    expect(result.current.latestEvent?.metadata?.message).toBe(
      "Processing strategies"
    );
  });
});
