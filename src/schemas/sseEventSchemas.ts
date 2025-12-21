/**
 * SSE Event Schemas
 * Comprehensive Zod validation schemas for Server-Sent Events (SSE) in UnifiedZap streaming
 * Provides runtime type safety and validation for all event types
 */

/* eslint-disable sonarjs/deprecation */ // Zod typings mark some helper signatures deprecated; safe to use for schema definitions
import { z } from "zod";

// ============================================================================
// Base Schemas & Primitives
// ============================================================================

/**
 * Valid UnifiedZap phase identifiers
 */
export const UNIFIED_ZAP_PHASES = [
  "connected",
  "strategy_parsing",
  "token_analysis",
  "swap_preparation",
  "transaction_building",
  "gas_estimation",
  "final_assembly",
  "complete",
  "error",
] as const;

/**
 * Schema for UnifiedZap phase values
 */
const UnifiedZapPhaseSchema = z
  .enum(UNIFIED_ZAP_PHASES)
  .describe("UnifiedZap execution phase");

/**
 * Chain breakdown entry schema
 * Represents protocol distribution across chains
 */
const ChainBreakdownEntrySchema = z
  .object({
    name: z.string().describe("Chain name (e.g., 'Ethereum', 'Polygon')"),
    chainId: z.number().int().positive().describe("Numeric chain ID"),
    protocolCount: z
      .number()
      .int()
      .nonnegative()
      .describe("Number of protocols on this chain"),
  })
  .describe("Chain breakdown entry with protocol distribution");

const PROGRESS_METADATA_FIELDS = {
  totalStrategies: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Total number of strategies"),
  totalProtocols: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Total number of protocols"),
  estimatedDuration: z
    .string()
    .optional()
    .describe("Estimated duration (e.g., '2m 30s')"),
  processedStrategies: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Number of processed strategies"),
  processedProtocols: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Number of processed protocols"),
  chainBreakdown: z
    .array(ChainBreakdownEntrySchema)
    .optional()
    .describe("Chain breakdown data"),
  message: z.string().optional().describe("Metadata message"),
  description: z.string().optional().describe("Metadata description"),
  progressPercent: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Progress percentage"),
} as const;

/**
 * Metadata schema for SSE events
 * Contains progress tracking and execution details
 */
const EventMetadataSchema = z
  .object({
    phase: z.string().optional().describe("Current execution phase"),
    ...PROGRESS_METADATA_FIELDS,
    strategyCount: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Strategy count (alias)"),
    protocolCount: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Protocol count (alias)"),
    chains: z
      .array(ChainBreakdownEntrySchema)
      .optional()
      .describe("Chains data (alias)"),
    chainId: z.number().int().positive().optional().describe("Chain ID"),
    transactions: z
      .unknown()
      .optional()
      .describe("Transactions data (validated separately)"),
  })
  .passthrough()
  .describe("Event metadata with progress and execution details");

/**
 * Error object schema
 * Represents structured error information
 */
const ErrorObjectSchema = z
  .object({
    code: z.string().optional().describe("Error code identifier"),
    message: z.string().optional().describe("Human-readable error message"),
    details: z.unknown().optional().describe("Additional error details"),
  })
  .passthrough()
  .describe("Structured error object");

/**
 * Additional data schema
 * Contains supplementary information
 */
const AdditionalDataSchema = z
  .object({
    message: z.string().optional().describe("Additional message"),
  })
  .passthrough()
  .optional()
  .nullable()
  .describe("Additional data container");

// ============================================================================
// Transaction Schemas
// ============================================================================

/**
 * Transaction schema for UnifiedZap operations
 * Represents an Ethereum transaction with all optional gas parameters
 */
export const UnifiedZapStreamTransactionSchema = z
  .object({
    to: z.string().describe("Transaction recipient address (required)"),
    data: z.string().describe("Transaction data/calldata (required)"),
    value: z
      .string()
      .optional()
      .describe("Transaction value in wei (hex or decimal string)"),
    gas: z.string().optional().describe("Gas limit (hex or decimal string)"),
    gasPrice: z
      .string()
      .optional()
      .describe("Gas price for legacy transactions (hex or decimal string)"),
    maxFeePerGas: z
      .string()
      .optional()
      .describe("Max fee per gas for EIP-1559 (hex or decimal string)"),
    maxPriorityFeePerGas: z
      .string()
      .optional()
      .describe(
        "Max priority fee per gas for EIP-1559 (hex or decimal string)"
      ),
    chainId: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Chain ID for the transaction"),
  })
  .strict()
  .describe("UnifiedZap transaction object");

export type UnifiedZapStreamTransaction = z.infer<
  typeof UnifiedZapStreamTransactionSchema
>;

// ============================================================================
// Raw SSE Event Schema
// ============================================================================

/**
 * Raw SSE event schema from backend
 * Validates all possible fields from the SSE stream
 * Uses permissive validation with passthrough for extensibility
 */
export const UnifiedZapRawEventSchema = z
  .object({
    type: z.string().optional().describe("Event type identifier"),
    intentId: z.string().optional().describe("Unique intent identifier"),
    progress: z
      .preprocess(
        value => {
          if (typeof value === "string") {
            const numeric = Number(value);
            return Number.isNaN(numeric) ? value : numeric;
          }
          return value;
        },
        z.union([z.number(), z.nan(), z.null()]).optional()
      )
      .optional()
      .describe("Progress value (0-1 or 0-100)"),
    progressPercent: z
      .number()
      .optional()
      .describe("Progress percentage (0-100)"),
    currentStep: z
      .string()
      .optional()
      .nullable()
      .describe("Current execution step"),
    currentOperation: z
      .string()
      .optional()
      .describe("Current operation description"),
    phase: z.string().optional().nullable().describe("Execution phase"),
    metadata: EventMetadataSchema.optional()
      .nullable()
      .describe("Event metadata"),
    processedTokens: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Number of processed tokens"),
    totalTokens: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Total number of tokens"),
    message: z.string().optional().describe("Event message"),
    description: z.string().optional().describe("Event description"),
    additionalData: AdditionalDataSchema.optional()
      .nullable()
      .describe("Additional data"),
    additionalInfo: AdditionalDataSchema.optional()
      .nullable()
      .describe("Additional info (alias)"),
    error: z
      .union([z.string(), ErrorObjectSchema])
      .optional()
      .nullable()
      .describe("Error information"),
    errorCode: z.string().optional().describe("Error code"),
    timestamp: z.string().optional().nullable().describe("Event timestamp"),
    rawTimestamp: z
      .string()
      .optional()
      .nullable()
      .describe("Raw timestamp (alias)"),
    totalStrategies: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Total strategies (top-level)"),
    strategyCount: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Strategy count (top-level)"),
    totalProtocols: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Total protocols (top-level)"),
    protocolCount: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Protocol count (top-level)"),
    chainBreakdown: z
      .array(z.unknown())
      .optional()
      .nullable()
      .describe("Chain breakdown (top-level)"),
    chains: z
      .array(z.unknown())
      .optional()
      .nullable()
      .describe("Chains (top-level)"),
    processedStrategies: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Processed strategies (top-level)"),
    processedProtocols: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Processed protocols (top-level)"),
    estimatedDuration: z
      .string()
      .optional()
      .describe("Estimated duration (top-level)"),
  })
  .passthrough()
  .describe("Raw SSE event from UnifiedZap backend");

// ============================================================================
// Normalized Event Schemas
// ============================================================================

/**
 * Normalized metadata schema
 * Cleaned and validated metadata for client consumption
 */
const NormalizedMetadataSchema = z
  .object(PROGRESS_METADATA_FIELDS)
  .strict()
  .describe("Normalized event metadata");

/**
 * Normalized error schema
 * Structured error with guaranteed message field
 */
const NormalizedErrorSchema = z
  .object({
    code: z.string().optional().describe("Error code"),
    message: z.string().describe("Error message (required)"),
    details: z.unknown().optional().describe("Error details"),
  })
  .strict()
  .describe("Normalized error object");

/**
 * Normalized SSE event schema
 * Client-facing event structure with validated and cleaned data
 */
export const NormalizedZapEventSchema = z
  .object({
    type: z.string().describe("Event type"),
    intentId: z.string().optional().describe("Intent identifier"),
    progress: z.number().min(0).max(1).describe("Normalized progress (0-1)"),
    currentStep: UnifiedZapPhaseSchema.optional()
      .nullable()
      .describe("Current execution phase"),
    phase: z.string().optional().describe("Phase name"),
    currentOperation: z.string().optional().describe("Current operation"),
    progressPercent: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("Progress percentage"),
    processedTokens: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Processed tokens"),
    totalTokens: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Total tokens"),
    message: z.string().optional().describe("Event message"),
    description: z.string().optional().describe("Event description"),
    metadata: NormalizedMetadataSchema.optional().describe("Event metadata"),
    error: NormalizedErrorSchema.optional()
      .nullable()
      .describe("Error information"),
    timestamp: z.string().describe("ISO 8601 timestamp"),
    rawEvent: z.unknown().optional().describe("Original raw event data"),
    transactions: z
      .array(UnifiedZapStreamTransactionSchema)
      .optional()
      .describe("Transaction array"),
    chainId: z.number().int().positive().optional().describe("Chain ID"),
  })
  .strict()
  .describe("Normalized SSE event for client consumption");

export type NormalizedZapEvent = z.infer<typeof NormalizedZapEventSchema>;

// ============================================================================
// Event Type Discriminators
// ============================================================================

/**
 * Progress event schema
 * Represents in-progress execution updates
 */
export const ProgressEventSchema = NormalizedZapEventSchema.extend({
  type: z.literal("progress"),
  progress: z.number().min(0).max(1),
}).describe("Progress update event");

type ProgressEvent = z.infer<typeof ProgressEventSchema>;

/**
 * Complete event schema
 * Represents successful completion
 */
export const CompleteEventSchema = NormalizedZapEventSchema.extend({
  type: z.literal("complete"),
  progress: z.literal(1),
  transactions: z.array(UnifiedZapStreamTransactionSchema).optional(),
}).describe("Completion event");

type CompleteEvent = z.infer<typeof CompleteEventSchema>;

/**
 * Error event schema
 * Represents execution failure
 */
export const ErrorEventSchema = NormalizedZapEventSchema.extend({
  type: z.literal("error"),
  error: NormalizedErrorSchema,
}).describe("Error event");

type ErrorEvent = z.infer<typeof ErrorEventSchema>;

/**
 * Transaction event schema
 * Represents events containing transaction data
 */
export const TransactionEventSchema = NormalizedZapEventSchema.extend({
  transactions: z.array(UnifiedZapStreamTransactionSchema).min(1),
  chainId: z.number().int().positive(),
}).describe("Transaction event with tx data");

type TransactionEvent = z.infer<typeof TransactionEventSchema>;

// ============================================================================
// Discriminated Union for Type-Safe Event Handling
// ============================================================================

/**
 * Discriminated union of all event types
 * Enables exhaustive type checking in switch statements
 */
export const SSEEventSchema = z.discriminatedUnion("type", [
  ProgressEventSchema,
  CompleteEventSchema,
  ErrorEventSchema,
]);

// ============================================================================
// Helper Schemas for Validation
// ============================================================================

/**
 * Transaction array schema for runtime validation
 * Validates arrays of transaction objects
 */
export const TransactionArraySchema = z
  .array(UnifiedZapStreamTransactionSchema)
  .describe("Array of transaction objects");

/**
 * Chain breakdown array schema
 */
export const ChainBreakdownArraySchema = z
  .array(ChainBreakdownEntrySchema)
  .describe("Array of chain breakdown entries");

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates and parses a raw SSE event with error handling
 * @param data - Raw event data from JSON.parse
 * @returns Validation result with parsed data or error
 */
export function validateRawSSEEvent(data: unknown) {
  return UnifiedZapRawEventSchema.safeParse(data);
}

/**
 * Validates a normalized event
 * @param data - Normalized event object
 * @returns Validation result
 */
export function validateNormalizedEvent(data: unknown) {
  return NormalizedZapEventSchema.safeParse(data);
}

/**
 * Validates transaction array
 * @param data - Array of transaction objects
 * @returns Validation result
 */
export function validateTransactions(data: unknown) {
  return TransactionArraySchema.safeParse(data);
}

/**
 * Validates chain breakdown array
 * @param data - Array of chain breakdown entries
 * @returns Validation result
 */
export function validateChainBreakdown(data: unknown) {
  return ChainBreakdownArraySchema.safeParse(data);
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for progress events
 */
export function isProgressEvent(
  event: NormalizedZapEvent
): event is ProgressEvent {
  return event.type === "progress";
}

/**
 * Type guard for complete events
 */
export function isCompleteEvent(
  event: NormalizedZapEvent
): event is CompleteEvent {
  return event.type === "complete";
}

/**
 * Type guard for error events
 */
export function isErrorEvent(event: NormalizedZapEvent): event is ErrorEvent {
  return event.type === "error";
}

/**
 * Type guard for transaction events
 */
export function isTransactionEvent(
  event: NormalizedZapEvent
): event is TransactionEvent {
  return event.transactions !== undefined && event.transactions.length > 0;
}
