/**
 * Types Public API
 *
 * Centralized barrel export for all application types.
 * Import types from this file for cleaner imports:
 *
 * @example
 * ```typescript
 * import type { AnalyticsData, PortfolioAllocationData } from '@/types';
 * import type { UserProfile, WalletBundle } from '@/types';
 * ```
 */

// ============================================================================
// ANALYTICS & PORTFOLIO
// ============================================================================

export * from "./analytics";
export * from "./export";
export * from "./portfolio";
export * from "./portfolio-allocation";
export * from "./portfolio-progressive";

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export * from "./domain/allocation";
export * from "./domain/transaction";
export * from "./domain/user.types";
export * from "./domain/wallet";

// ============================================================================
// UI TYPES
// ============================================================================

export * from "./ui/chartHover";
export * from "./ui/modals";
export * from "./ui/swap";
export * from "./ui/ui.types";
