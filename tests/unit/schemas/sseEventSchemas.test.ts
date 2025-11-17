/**
 * SSE Event Schemas Tests
 * Comprehensive validation tests for Server-Sent Events (SSE) schemas
 */

import { describe, expect, it } from "vitest";

import {
  CompleteEventSchema,
  ErrorEventSchema,
  NormalizedZapEventSchema,
  ProgressEventSchema,
  TransactionEventSchema,
  UNIFIED_ZAP_PHASES,
  UnifiedZapRawEventSchema,
  type UnifiedZapStreamTransaction,
  validateChainBreakdown,
  validateNormalizedEvent,
  validateRawSSEEvent,
  validateTransactions,
} from "@/schemas/sseEventSchemas";

// ============================================================================
// Raw SSE Event Schema Tests
// ============================================================================

describe("UnifiedZapRawEventSchema", () => {
  describe("Valid Events", () => {
    it("should validate minimal valid raw event", () => {
      const event = {
        type: "progress",
        progress: 50,
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("progress");
        expect(result.data.progress).toBe(50);
      }
    });

    it("should validate complete raw event with all fields", () => {
      const event = {
        type: "progress",
        intentId: "intent-123",
        progress: 0.75,
        progressPercent: 75,
        currentStep: "transaction_building",
        currentOperation: "Building transaction",
        phase: "transaction_building",
        metadata: {
          totalStrategies: 5,
          processedStrategies: 3,
          message: "Processing strategies",
          chainBreakdown: [
            { name: "Ethereum", chainId: 1, protocolCount: 2 },
          ],
        },
        processedTokens: 2,
        totalTokens: 5,
        message: "Processing...",
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.intentId).toBe("intent-123");
        expect(result.data.progress).toBe(0.75);
        expect(result.data.metadata?.totalStrategies).toBe(5);
        expect(result.data.metadata?.chainBreakdown).toHaveLength(1);
      }
    });

    it("should accept string error", () => {
      const event = {
        type: "error",
        error: "Something went wrong",
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.error).toBe("Something went wrong");
      }
    });

    it("should accept object error", () => {
      const event = {
        type: "error",
        error: {
          code: "INSUFFICIENT_FUNDS",
          message: "Not enough balance",
          details: { required: "100", available: "50" },
        },
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
      if (result.success && typeof result.data.error === "object") {
        expect(result.data.error.code).toBe("INSUFFICIENT_FUNDS");
        expect(result.data.error.message).toBe("Not enough balance");
      }
    });

    it("should allow null/undefined optional fields", () => {
      const event = {
        type: "progress",
        metadata: null,
        error: null,
        additionalData: null,
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
    });

    it("should allow extra fields (passthrough)", () => {
      const event = {
        type: "progress",
        progress: 50,
        customField: "custom value",
        nestedCustom: { foo: "bar" },
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Events", () => {
    it("should accept empty object (all fields optional)", () => {
      const event = {};

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
    });

    it("should reject invalid metadata structure", () => {
      const event = {
        type: "progress",
        metadata: {
          totalStrategies: "not a number", // Invalid
        },
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(false);
    });

    it("should reject negative numbers for counts", () => {
      const event = {
        type: "progress",
        processedTokens: -5,
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Transaction Schema Tests
// ============================================================================

describe("Transaction Validation", () => {
  describe("Valid Transactions", () => {
    it("should validate minimal transaction", () => {
      const tx = {
        to: "0x1234567890123456789012345678901234567890",
        data: "0xabcdef",
      };

      const result = validateTransactions([tx]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].to).toBe(tx.to);
        expect(result.data[0].data).toBe(tx.data);
      }
    });

    it("should validate transaction with all fields", () => {
      const tx: UnifiedZapStreamTransaction = {
        to: "0x1234567890123456789012345678901234567890",
        data: "0xabcdef",
        value: "1000000000000000000",
        gas: "21000",
        gasPrice: "50000000000",
        maxFeePerGas: "100000000000",
        maxPriorityFeePerGas: "2000000000",
        chainId: 1,
      };

      const result = validateTransactions([tx]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]).toEqual(tx);
      }
    });

    it("should validate multiple transactions", () => {
      const txs = [
        { to: "0x1111111111111111111111111111111111111111", data: "0x11" },
        { to: "0x2222222222222222222222222222222222222222", data: "0x22" },
      ];

      const result = validateTransactions(txs);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe("Invalid Transactions", () => {
    it("should reject transaction missing 'to' field", () => {
      const tx = {
        data: "0xabcdef",
      };

      const result = validateTransactions([tx]);
      expect(result.success).toBe(false);
    });

    it("should reject transaction missing 'data' field", () => {
      const tx = {
        to: "0x1234567890123456789012345678901234567890",
      };

      const result = validateTransactions([tx]);
      expect(result.success).toBe(false);
    });

    it("should reject transaction with invalid chainId", () => {
      const tx = {
        to: "0x1234567890123456789012345678901234567890",
        data: "0xabcdef",
        chainId: -1, // Negative chainId
      };

      const result = validateTransactions([tx]);
      expect(result.success).toBe(false);
    });

    it("should reject non-array input", () => {
      const result = validateTransactions({ to: "0x123", data: "0xabc" });
      expect(result.success).toBe(false);
    });

    it("should reject extra fields (strict mode)", () => {
      const tx = {
        to: "0x1234567890123456789012345678901234567890",
        data: "0xabcdef",
        extraField: "not allowed",
      };

      const result = validateTransactions([tx]);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Normalized Event Schema Tests
// ============================================================================

describe("NormalizedZapEventSchema", () => {
  describe("Valid Events", () => {
    it("should validate minimal normalized event", () => {
      const event = {
        type: "progress",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(true);
    });

    it("should validate complete normalized event", () => {
      const event = {
        type: "progress",
        intentId: "intent-123",
        progress: 0.75,
        currentStep: "transaction_building" as const,
        phase: "transaction_building",
        currentOperation: "Building transaction",
        progressPercent: 75,
        processedTokens: 3,
        totalTokens: 5,
        message: "Processing...",
        metadata: {
          totalStrategies: 5,
          processedStrategies: 3,
          chainBreakdown: [
            { name: "Ethereum", chainId: 1, protocolCount: 2 },
          ],
        },
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(true);
    });

    it("should validate event with transactions", () => {
      const event = {
        type: "complete",
        progress: 1,
        timestamp: "2025-01-17T10:00:00Z",
        transactions: [
          { to: "0x1234567890123456789012345678901234567890", data: "0xabc" },
        ],
        chainId: 1,
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(true);
    });

    it("should validate error event", () => {
      const event = {
        type: "error",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
        error: {
          code: "INSUFFICIENT_FUNDS",
          message: "Not enough balance",
        },
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Events", () => {
    it("should reject event missing required fields", () => {
      const event = {
        type: "progress",
        // Missing progress and timestamp
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(false);
    });

    it("should reject progress out of range (> 1)", () => {
      const event = {
        type: "progress",
        progress: 1.5,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(false);
    });

    it("should reject progress out of range (< 0)", () => {
      const event = {
        type: "progress",
        progress: -0.1,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(false);
    });

    it("should reject progressPercent out of range", () => {
      const event = {
        type: "progress",
        progress: 0.5,
        progressPercent: 150,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(false);
    });

    it("should reject extra fields (strict mode)", () => {
      const event = {
        type: "progress",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
        extraField: "not allowed",
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(false);
    });

    it("should reject invalid currentStep", () => {
      const event = {
        type: "progress",
        progress: 0.5,
        currentStep: "invalid_phase",
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(false);
    });

    it("should reject error event without error object", () => {
      const event = {
        type: "error",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
        // Missing error field
      };

      const result = ErrorEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Event Type Discriminators Tests
// ============================================================================

describe("Event Type Schemas", () => {
  describe("ProgressEventSchema", () => {
    it("should validate progress event", () => {
      const event = {
        type: "progress",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = ProgressEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it("should reject non-progress type", () => {
      const event = {
        type: "complete",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = ProgressEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe("CompleteEventSchema", () => {
    it("should validate complete event", () => {
      const event = {
        type: "complete",
        progress: 1,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = CompleteEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it("should reject progress !== 1", () => {
      const event = {
        type: "complete",
        progress: 0.99,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const result = CompleteEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it("should allow optional transactions", () => {
      const event = {
        type: "complete",
        progress: 1,
        timestamp: "2025-01-17T10:00:00Z",
        transactions: [
          { to: "0x1234567890123456789012345678901234567890", data: "0xabc" },
        ],
      };

      const result = CompleteEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe("ErrorEventSchema", () => {
    it("should validate error event", () => {
      const event = {
        type: "error",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
        error: {
          message: "Something went wrong",
        },
      };

      const result = ErrorEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it("should require error message", () => {
      const event = {
        type: "error",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
        error: {
          code: "ERROR_CODE",
          // Missing message
        },
      };

      const result = ErrorEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe("TransactionEventSchema", () => {
    it("should validate event with transactions", () => {
      const event = {
        type: "progress",
        progress: 0.8,
        timestamp: "2025-01-17T10:00:00Z",
        transactions: [
          { to: "0x1234567890123456789012345678901234567890", data: "0xabc" },
        ],
        chainId: 1,
      };

      const result = TransactionEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it("should require at least one transaction", () => {
      const event = {
        type: "progress",
        progress: 0.8,
        timestamp: "2025-01-17T10:00:00Z",
        transactions: [],
        chainId: 1,
      };

      const result = TransactionEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it("should require chainId", () => {
      const event = {
        type: "progress",
        progress: 0.8,
        timestamp: "2025-01-17T10:00:00Z",
        transactions: [
          { to: "0x1234567890123456789012345678901234567890", data: "0xabc" },
        ],
      };

      const result = TransactionEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Chain Breakdown Tests
// ============================================================================

describe("Chain Breakdown Validation", () => {
  it("should validate valid chain breakdown array", () => {
    const breakdown = [
      { name: "Ethereum", chainId: 1, protocolCount: 5 },
      { name: "Polygon", chainId: 137, protocolCount: 3 },
    ];

    const result = validateChainBreakdown(breakdown);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it("should reject negative chainId", () => {
    const breakdown = [
      { name: "Invalid", chainId: -1, protocolCount: 1 },
    ];

    const result = validateChainBreakdown(breakdown);
    expect(result.success).toBe(false);
  });

  it("should reject zero chainId", () => {
    const breakdown = [
      { name: "Invalid", chainId: 0, protocolCount: 1 },
    ];

    const result = validateChainBreakdown(breakdown);
    expect(result.success).toBe(false);
  });

  it("should reject negative protocolCount", () => {
    const breakdown = [
      { name: "Ethereum", chainId: 1, protocolCount: -5 },
    ];

    const result = validateChainBreakdown(breakdown);
    expect(result.success).toBe(false);
  });

  it("should accept zero protocolCount", () => {
    const breakdown = [
      { name: "Ethereum", chainId: 1, protocolCount: 0 },
    ];

    const result = validateChainBreakdown(breakdown);
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const breakdown = [
      { name: "Ethereum", chainId: 1 }, // Missing protocolCount
    ];

    const result = validateChainBreakdown(breakdown);
    expect(result.success).toBe(false);
  });

  it("should reject non-array input", () => {
    const result = validateChainBreakdown({ name: "Ethereum", chainId: 1, protocolCount: 5 });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe("UNIFIED_ZAP_PHASES", () => {
  it("should contain all expected phases", () => {
    const expectedPhases = [
      "connected",
      "strategy_parsing",
      "token_analysis",
      "swap_preparation",
      "transaction_building",
      "gas_estimation",
      "final_assembly",
      "complete",
      "error",
    ];

    expect(UNIFIED_ZAP_PHASES).toEqual(expectedPhases);
  });

  it("should be a readonly array", () => {
    // TypeScript enforces immutability at compile time
    // Runtime check: const arrays in JS are not truly immutable,
    // but TypeScript's readonly makes them compile-time immutable
    expect(UNIFIED_ZAP_PHASES).toBeInstanceOf(Array);
    expect(UNIFIED_ZAP_PHASES).toHaveLength(9);
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe("Edge Cases", () => {
  describe("Boundary Values", () => {
    it("should accept progress at exact boundaries", () => {
      const event1 = {
        type: "progress",
        progress: 0,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const event2 = {
        type: "complete",
        progress: 1,
        timestamp: "2025-01-17T10:00:00Z",
      };

      expect(validateNormalizedEvent(event1).success).toBe(true);
      expect(validateNormalizedEvent(event2).success).toBe(true);
    });

    it("should accept progressPercent at exact boundaries", () => {
      const event1 = {
        type: "progress",
        progress: 0.5,
        progressPercent: 0,
        timestamp: "2025-01-17T10:00:00Z",
      };

      const event2 = {
        type: "progress",
        progress: 0.5,
        progressPercent: 100,
        timestamp: "2025-01-17T10:00:00Z",
      };

      expect(validateNormalizedEvent(event1).success).toBe(true);
      expect(validateNormalizedEvent(event2).success).toBe(true);
    });
  });

  describe("Null vs Undefined", () => {
    it("should handle null values in raw events", () => {
      const event = {
        type: "progress",
        metadata: null,
        error: null,
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
    });

    it("should handle undefined values in raw events", () => {
      const event = {
        type: "progress",
        metadata: undefined,
        error: undefined,
      };

      const result = validateRawSSEEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe("Very Large Values", () => {
    it("should handle large numbers", () => {
      const event = {
        type: "progress",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
        totalTokens: Number.MAX_SAFE_INTEGER,
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(true);
    });

    it("should handle very long strings", () => {
      const longMessage = "x".repeat(10000);
      const event = {
        type: "progress",
        progress: 0.5,
        timestamp: "2025-01-17T10:00:00Z",
        message: longMessage,
      };

      const result = validateNormalizedEvent(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe(longMessage);
      }
    });
  });
});
