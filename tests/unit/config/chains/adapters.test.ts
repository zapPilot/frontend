/**
 * Unit tests for chains/adapters
 */
import { describe, expect, it } from "vitest";

import { getMainnetChains, toThirdWebChains } from "@/config/chains/adapters";
import type { BaseChainConfig } from "@/config/chains/types";

const mockChainWithExplorer: BaseChainConfig = {
  id: 42161,
  name: "Arbitrum One",
  rpcUrls: {
    default: {
      http: ["https://arb1.arbitrum.io/rpc"],
    },
  },
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: "Arbiscan",
      url: "https://arbiscan.io",
    },
  },
  isSupported: true,
};

const mockChainWithoutExplorer: BaseChainConfig = {
  id: 1337,
  name: "Local Dev",
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"],
    },
  },
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  isSupported: true,
};

const mockUnsupportedChain: BaseChainConfig = {
  id: 5,
  name: "Goerli",
  rpcUrls: {
    default: {
      http: ["https://goerli.infura.io"],
    },
  },
  nativeCurrency: {
    name: "Goerli Ether",
    symbol: "ETH",
    decimals: 18,
  },
  isSupported: false,
};

describe("adapters", () => {
  describe("toThirdWebChains", () => {
    it("should convert chain configs to ThirdWeb format", () => {
      const result = toThirdWebChains([mockChainWithExplorer]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 42161,
        name: "Arbitrum One",
        rpc: "https://arb1.arbitrum.io/rpc",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
      });
    });

    it("should include block explorers when available", () => {
      const result = toThirdWebChains([mockChainWithExplorer]);

      expect(result[0].blockExplorers).toBeDefined();
      expect(result[0].blockExplorers).toHaveLength(1);
      expect(result[0].blockExplorers?.[0]).toMatchObject({
        name: "Arbiscan",
        url: "https://arbiscan.io",
      });
    });

    it("should handle chains without block explorers", () => {
      const result = toThirdWebChains([mockChainWithoutExplorer]);

      expect(result).toHaveLength(1);
      expect(result[0].blockExplorers).toBeUndefined();
    });

    it("should convert multiple chains", () => {
      const result = toThirdWebChains([
        mockChainWithExplorer,
        mockChainWithoutExplorer,
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(42161);
      expect(result[1].id).toBe(1337);
    });

    it("should return empty array for empty input", () => {
      const result = toThirdWebChains([]);

      expect(result).toEqual([]);
    });
  });

  describe("getMainnetChains", () => {
    it("should filter to only supported chains", () => {
      const result = getMainnetChains([
        mockChainWithExplorer,
        mockUnsupportedChain,
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(42161);
    });

    it("should return empty array when no chains are supported", () => {
      const result = getMainnetChains([mockUnsupportedChain]);

      expect(result).toEqual([]);
    });

    it("should return all chains when all are supported", () => {
      const result = getMainnetChains([
        mockChainWithExplorer,
        mockChainWithoutExplorer,
      ]);

      expect(result).toHaveLength(2);
    });
  });
});
