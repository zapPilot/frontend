"use client";

import type { LandingPageResponse } from "../services/analyticsService";
import { useWalletPortfolioTransform } from "./useWalletPortfolioTransform";

// Public hook name requested in Phase 4; delegates to existing transform hook
export const usePortfolioData = (
  landingPageData: LandingPageResponse | undefined
) => {
  return useWalletPortfolioTransform(landingPageData);
};
