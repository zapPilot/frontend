/**
 * Legacy V22 Adapter Shim
 *
 * This file preserves the original import path while delegating to the
 * modular V22 adapter implementation in "walletPortfolioV22". Keeping
 * this thin layer avoids duplicate logic and keeps older tests/imports working.
 */

export {
  createV22ErrorState,
  createV22LoadingState,
  transformToV22Data,
} from "./walletPortfolioV22";
