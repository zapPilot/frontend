/**
 * Allocation Type Definitions - Single Source of Truth
 *
 * This module consolidates all allocation-related types with Zod schemas.
 * Two distinct allocation types exist for different use cases:
 *
 * 1. AllocationBreakdown - Portfolio/transaction operations (crypto/stable)
 * 2. RegimeAllocationBreakdown - Strategy display (spot/lp/stable)
 *
 * @see Phase 8 - Type System Consolidation
 */

import { z } from "zod";

// ============================================================================
// TRANSACTION ALLOCATION SCHEMA (Portfolio Operations)
// ============================================================================

/**
 * Schema for portfolio transaction allocations
 * Used in: deposit, withdraw, rebalance operations
 * Split: crypto (BTC, ETH, etc.) vs. stablecoins (USDC, USDT)
 */
export const allocationBreakdownSchema = z.object({
  crypto: z.number().min(0).max(100),
  stable: z.number().min(0).max(100),
  simplifiedCrypto: z
    .array(
      z.object({
        symbol: z.string(),
        name: z.string(),
        value: z.number(),
        color: z.string().optional(),
      })
    )
    .optional(),
});

// ============================================================================
// REGIME ALLOCATION SCHEMA (Strategy Display)
// ============================================================================

/**
 * Schema for regime strategy allocations
 * Used in: regime transitions, strategy visualization
 * Split: spot crypto, liquidity pool positions, stablecoins
 */
export const regimeAllocationBreakdownSchema = z.object({
  spot: z.number().min(0).max(100),
  lp: z.number().min(0).max(100),
  stable: z.number().min(0).max(100),
});

// ============================================================================
// TYPE INFERENCE FROM SCHEMAS
// ============================================================================

/**
 * Portfolio transaction allocation
 * @public
 */
export type AllocationBreakdown = z.infer<typeof allocationBreakdownSchema>;

/**
 * Regime strategy allocation
 * @public
 */
export type RegimeAllocationBreakdown = z.infer<
  typeof regimeAllocationBreakdownSchema
>;

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Converts transaction allocation to regime allocation format
 * Maps: crypto → spot, adds 0% LP, preserves stable
 *
 * @param allocation - Transaction allocation (crypto/stable)
 * @returns Regime allocation (spot/lp/stable)
 *
 * @example
 * ```typescript
 * const txAllocation = { crypto: 70, stable: 30 };
 * const regimeAllocation = toRegimeAllocation(txAllocation);
 * // Result: { spot: 70, lp: 0, stable: 30 }
 * ```
 */
export function toRegimeAllocation(
  allocation: AllocationBreakdown
): RegimeAllocationBreakdown {
  return {
    spot: allocation.crypto,
    lp: 0,
    stable: allocation.stable,
  };
}

/**
 * Converts regime allocation to transaction allocation format
 * Maps: (spot + lp) → crypto, preserves stable
 *
 * @param regime - Regime allocation (spot/lp/stable)
 * @returns Transaction allocation (crypto/stable)
 *
 * @example
 * ```typescript
 * const regimeAllocation = { spot: 60, lp: 10, stable: 30 };
 * const txAllocation = toTransactionAllocation(regimeAllocation);
 * // Result: { crypto: 70, stable: 30 }
 * ```
 */
export function toTransactionAllocation(
  regime: RegimeAllocationBreakdown
): AllocationBreakdown {
  return {
    crypto: regime.spot + regime.lp,
    stable: regime.stable,
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates allocation breakdown data
 * Ensures crypto + stable = 100 (with 0.01% tolerance for floating point)
 *
 * @param data - Unknown data to validate
 * @returns Validated AllocationBreakdown
 * @throws {ZodError} If validation fails
 */
export function validateAllocationBreakdown(
  data: unknown
): AllocationBreakdown {
  const parsed = allocationBreakdownSchema.parse(data);

  // Validate allocation totals to 100% (with floating point tolerance)
  const total = parsed.crypto + parsed.stable;
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(
      `Invalid allocation: crypto (${parsed.crypto}) + stable (${parsed.stable}) must equal 100, got ${total}`
    );
  }

  return parsed;
}

/**
 * Validates regime allocation breakdown data
 * Ensures spot + lp + stable = 100 (with 0.01% tolerance for floating point)
 *
 * @param data - Unknown data to validate
 * @returns Validated RegimeAllocationBreakdown
 * @throws {ZodError} If validation fails
 */
export function validateRegimeAllocationBreakdown(
  data: unknown
): RegimeAllocationBreakdown {
  const parsed = regimeAllocationBreakdownSchema.parse(data);

  // Validate allocation totals to 100% (with floating point tolerance)
  const total = parsed.spot + parsed.lp + parsed.stable;
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(
      `Invalid regime allocation: spot (${parsed.spot}) + lp (${parsed.lp}) + stable (${parsed.stable}) must equal 100, got ${total}`
    );
  }

  return parsed;
}
