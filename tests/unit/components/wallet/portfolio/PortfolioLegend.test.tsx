import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioLegend } from "@/components/wallet/portfolio/components/PortfolioLegend";
import type { AllocationConstituent } from "@/types/portfolio-allocation";

const mockCryptoAssets: AllocationConstituent[] = [
  {
    asset: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    value: 40,
    color: "#F7931A",
  },
  {
    asset: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    value: 20,
    color: "#627EEA",
  },
];

const mockSimplifiedCrypto: AllocationConstituent[] = [
  {
    asset: "crypto",
    symbol: "Crypto",
    name: "Crypto Assets",
    value: 60,
    color: "#F7931A",
  },
];

describe("PortfolioLegend", () => {
  describe("Normal State (isEmptyState = false)", () => {
    it("renders stablecoins label", () => {
      render(
        <PortfolioLegend
          isEmptyState={false}
          cryptoAssets={mockCryptoAssets}
          stablePercentage={40}
          simplifiedCrypto={mockSimplifiedCrypto}
        />
      );

      expect(screen.getByText("Stablecoins")).toBeInTheDocument();
    });

    it("renders simplified crypto assets from simplifiedCrypto prop", () => {
      render(
        <PortfolioLegend
          isEmptyState={false}
          cryptoAssets={mockCryptoAssets}
          stablePercentage={40}
          simplifiedCrypto={mockSimplifiedCrypto}
        />
      );

      expect(screen.getByText("Crypto Assets")).toBeInTheDocument();
    });
  });

  describe("Empty State (isEmptyState = true)", () => {
    it("renders target labels for crypto assets", () => {
      render(
        <PortfolioLegend
          isEmptyState={true}
          cryptoAssets={mockCryptoAssets}
          stablePercentage={40}
        />
      );

      expect(screen.getByText("Spot (Target)")).toBeInTheDocument();
      expect(screen.getByText("LP (Target)")).toBeInTheDocument();
    });

    it("renders stablecoins target label when stablePercentage > 0", () => {
      render(
        <PortfolioLegend
          isEmptyState={true}
          cryptoAssets={mockCryptoAssets}
          stablePercentage={40}
        />
      );

      expect(screen.getByText("Stablecoins (Target)")).toBeInTheDocument();
    });

    it("does not render stablecoins target label when stablePercentage is 0", () => {
      render(
        <PortfolioLegend
          isEmptyState={true}
          cryptoAssets={mockCryptoAssets}
          stablePercentage={0}
        />
      );

      expect(
        screen.queryByText("Stablecoins (Target)")
      ).not.toBeInTheDocument();
    });
  });
});
