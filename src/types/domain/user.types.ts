/**
 * @deprecated This file is deprecated as of Phase 8 (Type System Consolidation)
 *
 * All types in this file are duplicates of Zod schemas defined in:
 * @see {@link module:@/schemas/api/accountSchemas}
 *
 * Migration Guide:
 * - Import types directly from @/schemas/api/accountSchemas instead
 * - Use the Zod schemas for runtime validation when needed
 * - Benefit from single source of truth with automatic type inference
 *
 * This file will be removed in v2.0.0
 *
 * @example
 * ```typescript
 * // ❌ Old (deprecated)
 * import type { UserCryptoWallet } from "@/types/domain/user.types";
 *
 * // ✅ New (recommended)
 * import type { UserCryptoWallet } from "@/schemas/api/accountSchemas";
 * ```
 */

/**
 * @deprecated Import from @/schemas/api/accountSchemas instead
 */
export type {
  AddWalletResponse,
  ConnectWalletResponse,
  UpdateEmailResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "@/schemas/api/accountSchemas";
