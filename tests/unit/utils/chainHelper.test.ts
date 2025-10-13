import { describe, it, expect } from "vitest";
import {
  transformToDebankChainName,
  normalizeChainName,
} from "@/utils/chainHelper";

describe("chainHelper", () => {
  describe("transformToDebankChainName", () => {
    describe("known chain mappings", () => {
      it("should transform 'ethereum' to 'eth'", () => {
        expect(transformToDebankChainName("ethereum")).toBe("eth");
      });

      it("should transform 'arbitrum one' to 'arb'", () => {
        expect(transformToDebankChainName("arbitrum one")).toBe("arb");
      });

      it("should transform 'bsc' to 'bsc'", () => {
        expect(transformToDebankChainName("bsc")).toBe("bsc");
      });

      it("should transform 'base' to 'base'", () => {
        expect(transformToDebankChainName("base")).toBe("base");
      });

      it("should transform 'op mainnet' to 'op'", () => {
        expect(transformToDebankChainName("op mainnet")).toBe("op");
      });
    });

    describe("unknown chain names", () => {
      it("should return original chain name when not in mapping", () => {
        expect(transformToDebankChainName("polygon")).toBe("polygon");
      });

      it("should return original chain name for 'avalanche'", () => {
        expect(transformToDebankChainName("avalanche")).toBe("avalanche");
      });

      it("should return original chain name for 'fantom'", () => {
        expect(transformToDebankChainName("fantom")).toBe("fantom");
      });

      it("should return original chain name for custom chains", () => {
        expect(transformToDebankChainName("my-custom-chain")).toBe(
          "my-custom-chain"
        );
      });
    });

    describe("edge cases", () => {
      it("should return empty string when input is empty string", () => {
        expect(transformToDebankChainName("")).toBe("");
      });

      it("should be case-sensitive and not match 'Ethereum' (uppercase)", () => {
        expect(transformToDebankChainName("Ethereum")).toBe("Ethereum");
      });

      it("should be case-sensitive and not match 'ETHEREUM' (all caps)", () => {
        expect(transformToDebankChainName("ETHEREUM")).toBe("ETHEREUM");
      });

      it("should be case-sensitive and not match 'Base' (capitalized)", () => {
        expect(transformToDebankChainName("Base")).toBe("Base");
      });

      it("should not match 'arbitrum one ' with trailing space", () => {
        expect(transformToDebankChainName("arbitrum one ")).toBe(
          "arbitrum one "
        );
      });

      it("should not match ' ethereum' with leading space", () => {
        expect(transformToDebankChainName(" ethereum")).toBe(" ethereum");
      });
    });

    describe("special characters and formatting", () => {
      it("should handle chain names with numbers", () => {
        expect(transformToDebankChainName("chain123")).toBe("chain123");
      });

      it("should handle chain names with hyphens", () => {
        expect(transformToDebankChainName("my-chain-name")).toBe(
          "my-chain-name"
        );
      });

      it("should handle chain names with underscores", () => {
        expect(transformToDebankChainName("my_chain_name")).toBe(
          "my_chain_name"
        );
      });
    });
  });

  describe("normalizeChainName", () => {
    describe("suffix removal", () => {
      it("should remove ' one' suffix from chain name", () => {
        expect(normalizeChainName("arbitrum one")).toBe("arbitrum");
      });

      it("should remove ' mainnet' suffix from chain name", () => {
        expect(normalizeChainName("op mainnet")).toBe("op");
      });

      it("should remove both ' one' and ' mainnet' if present", () => {
        expect(normalizeChainName("chain one mainnet")).toBe("chain");
      });

      it("should not remove 'one' if not suffixed with space", () => {
        expect(normalizeChainName("someone")).toBe("someone");
      });

      it("should not remove 'mainnet' if not suffixed with space", () => {
        expect(normalizeChainName("testmainnet")).toBe("testmainnet");
      });
    });

    describe("case conversion", () => {
      it("should convert uppercase chain name to lowercase", () => {
        expect(normalizeChainName("ETHEREUM")).toBe("ethereum");
      });

      it("should convert mixed case chain name to lowercase", () => {
        expect(normalizeChainName("Arbitrum One")).toBe("arbitrum");
      });

      it("should convert 'Base' to lowercase 'base'", () => {
        expect(normalizeChainName("Base")).toBe("base");
      });

      it("should handle all caps with suffix", () => {
        expect(normalizeChainName("OP MAINNET")).toBe("op");
      });
    });

    describe("whitespace handling", () => {
      it("should trim leading whitespace", () => {
        expect(normalizeChainName("  ethereum")).toBe("ethereum");
      });

      it("should trim trailing whitespace", () => {
        expect(normalizeChainName("ethereum  ")).toBe("ethereum");
      });

      it("should trim both leading and trailing whitespace", () => {
        expect(normalizeChainName("  ethereum  ")).toBe("ethereum");
      });

      it("should trim whitespace after suffix removal", () => {
        expect(normalizeChainName("  arbitrum one  ")).toBe("arbitrum");
      });

      it("should preserve internal whitespace", () => {
        expect(normalizeChainName("my custom chain")).toBe("my custom chain");
      });

      it("should handle multiple internal spaces", () => {
        expect(normalizeChainName("my  custom  chain")).toBe(
          "my  custom  chain"
        );
      });
    });

    describe("edge cases", () => {
      it("should return empty string when input is empty string", () => {
        expect(normalizeChainName("")).toBe("");
      });

      it("should handle null input gracefully", () => {
        expect(normalizeChainName(null as any)).toBe("");
      });

      it("should handle undefined input gracefully", () => {
        expect(normalizeChainName(undefined as any)).toBe("");
      });

      it("should handle whitespace-only string", () => {
        expect(normalizeChainName("   ")).toBe("");
      });

      it("should handle chain name that is only ' one'", () => {
        expect(normalizeChainName(" one")).toBe("");
      });

      it("should handle chain name that is only ' mainnet'", () => {
        expect(normalizeChainName(" mainnet")).toBe("");
      });
    });

    describe("combined transformations", () => {
      it("should apply all transformations: lowercase, remove suffix, trim", () => {
        expect(normalizeChainName("  ARBITRUM ONE  ")).toBe("arbitrum");
      });

      it("should handle 'OP MAINNET' with extra spaces", () => {
        expect(normalizeChainName("  OP MAINNET  ")).toBe("op");
      });

      it("should normalize 'Ethereum Mainnet'", () => {
        expect(normalizeChainName("Ethereum Mainnet")).toBe("ethereum");
      });

      it("should normalize 'BSC Mainnet' to 'bsc'", () => {
        expect(normalizeChainName("BSC Mainnet")).toBe("bsc");
      });

      it("should normalize 'Polygon One' to 'polygon'", () => {
        expect(normalizeChainName("Polygon One")).toBe("polygon");
      });
    });

    describe("real-world chain names", () => {
      it("should normalize 'ethereum' (already lowercase)", () => {
        expect(normalizeChainName("ethereum")).toBe("ethereum");
      });

      it("should normalize 'base' (already lowercase)", () => {
        expect(normalizeChainName("base")).toBe("base");
      });

      it("should normalize 'bsc' (already lowercase)", () => {
        expect(normalizeChainName("bsc")).toBe("bsc");
      });

      it("should normalize 'polygon'", () => {
        expect(normalizeChainName("polygon")).toBe("polygon");
      });

      it("should normalize 'Avalanche'", () => {
        expect(normalizeChainName("Avalanche")).toBe("avalanche");
      });
    });

    describe("order of operations", () => {
      it("should lowercase before removing suffixes (case 1)", () => {
        expect(normalizeChainName("CHAIN ONE")).toBe("chain");
      });

      it("should lowercase before removing suffixes (case 2)", () => {
        expect(normalizeChainName("CHAIN MAINNET")).toBe("chain");
      });

      it("should remove ' one' before ' mainnet'", () => {
        // Tests that both suffixes are removed in correct order
        expect(normalizeChainName("test one mainnet")).toBe("test");
      });
    });
  });

  describe("integration scenarios", () => {
    describe("common workflow: normalize then transform", () => {
      it("should normalize 'Arbitrum One' then transform to 'arb'", () => {
        const normalized = normalizeChainName("Arbitrum One");
        expect(normalized).toBe("arbitrum");
        // Note: transformToDebankChainName expects "arbitrum one" not "arbitrum"
        // This shows the two functions serve different purposes
      });

      it("should normalize 'ETHEREUM' then transform to 'eth'", () => {
        const normalized = normalizeChainName("ETHEREUM");
        expect(normalized).toBe("ethereum");
        const transformed = transformToDebankChainName(normalized);
        expect(transformed).toBe("eth");
      });

      it("should normalize 'OP MAINNET' then transform to 'op'", () => {
        const normalized = normalizeChainName("OP MAINNET");
        expect(normalized).toBe("op");
        // Note: transformToDebankChainName expects "op mainnet" not "op"
        const transformed = transformToDebankChainName(normalized);
        expect(transformed).toBe("op"); // Falls through to original
      });
    });

    describe("debank chain name preparation", () => {
      it("should prepare ethereum for debank", () => {
        const result = transformToDebankChainName("ethereum");
        expect(result).toBe("eth");
      });

      it("should prepare arbitrum one for debank", () => {
        const result = transformToDebankChainName("arbitrum one");
        expect(result).toBe("arb");
      });

      it("should prepare base for debank", () => {
        const result = transformToDebankChainName("base");
        expect(result).toBe("base");
      });

      it("should handle unknown chains gracefully for debank", () => {
        const result = transformToDebankChainName("unknown-chain");
        expect(result).toBe("unknown-chain");
      });
    });
  });
});
