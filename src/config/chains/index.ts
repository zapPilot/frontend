/**
 * Unified Chain Configuration API
 *
 * This is the main entry point for all chain-related configuration.
 * Import from this file to access chain data in any format needed.
 */

import { toThirdWebChains } from "./adapters";
import { SUPPORTED_CHAINS } from "./definitions";

// Canonical chain definitions
export { SUPPORTED_CHAINS } from "./definitions";

// Adapter functions
export { getMainnetChains, toThirdWebChains } from "./adapters";

/**
 * Get all supported chains in ThirdWeb format
 */
export const getThirdWebChains = () => toThirdWebChains(SUPPORTED_CHAINS);
