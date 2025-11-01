import { describe, it, expect } from "vitest";
import { normalizeProtocolName } from "@/lib/stringUtils";

describe("normalizeProtocolName", () => {
  it("strips version suffixes with space", () => {
    expect(normalizeProtocolName("aerodrome v3")).toBe("aerodrome");
    expect(normalizeProtocolName("uniswap V2")).toBe("uniswap");
    expect(normalizeProtocolName("Compound v1")).toBe("compound");
  });

  it("strips version suffixes with dash", () => {
    expect(normalizeProtocolName("aerodrome-v3")).toBe("aerodrome");
    expect(normalizeProtocolName("Uniswap-V2")).toBe("uniswap");
  });

  it("strips version suffixes with underscore", () => {
    expect(normalizeProtocolName("aerodrome_v3")).toBe("aerodrome");
    expect(normalizeProtocolName("protocol_V1")).toBe("protocol");
  });

  it("strips version suffixes with slash", () => {
    expect(normalizeProtocolName("protocol/v2")).toBe("protocol");
    expect(normalizeProtocolName("Compound/V3")).toBe("compound");
  });

  it("strips embedded version suffixes", () => {
    expect(normalizeProtocolName("aerodromeV3")).toBe("aerodrome");
    expect(normalizeProtocolName("UniswapV2")).toBe("uniswap");
  });

  it("preserves legitimate 'v' in names", () => {
    expect(normalizeProtocolName("Venus Protocol")).toBe("venus protocol");
    expect(normalizeProtocolName("Curve Finance")).toBe("curve finance");
  });

  it("handles case variations", () => {
    expect(normalizeProtocolName("AERODROME V3")).toBe("aerodrome");
    expect(normalizeProtocolName("AerodromeV2")).toBe("aerodrome");
    expect(normalizeProtocolName("MiXeD CaSe v1")).toBe("mixed case");
  });

  it("trims whitespace", () => {
    expect(normalizeProtocolName("  aerodrome v3  ")).toBe("aerodrome");
    expect(normalizeProtocolName("uniswap   v2")).toBe("uniswap");
    expect(normalizeProtocolName("   compound   ")).toBe("compound");
  });

  it("handles edge cases", () => {
    expect(normalizeProtocolName("")).toBe("");
    expect(normalizeProtocolName("   ")).toBe("");
    expect(normalizeProtocolName(undefined)).toBe("");
  });

  it("preserves protocol names without versions", () => {
    expect(normalizeProtocolName("aave")).toBe("aave");
    expect(normalizeProtocolName("Compound")).toBe("compound");
    expect(normalizeProtocolName("Balancer")).toBe("balancer");
  });

  it("handles multiple version formats", () => {
    expect(normalizeProtocolName("protocol v10")).toBe("protocol");
    expect(normalizeProtocolName("protocol v99")).toBe("protocol");
  });

  it("handles multiple spaces before version", () => {
    expect(normalizeProtocolName("uniswap   v2")).toBe("uniswap");
    expect(normalizeProtocolName("protocol    V3")).toBe("protocol");
  });

  it("does not remove 'v' from middle of words", () => {
    expect(normalizeProtocolName("stargate")).toBe("stargate");
    expect(normalizeProtocolName("velodrome")).toBe("velodrome");
  });

  it("handles real-world protocol names", () => {
    // Real examples from DeFi
    expect(normalizeProtocolName("Uniswap v3")).toBe("uniswap");
    expect(normalizeProtocolName("Aave V2")).toBe("aave");
    expect(normalizeProtocolName("Curve-v2")).toBe("curve");
    expect(normalizeProtocolName("SushiSwap V1")).toBe("sushiswap");
    expect(normalizeProtocolName("Balancer V2")).toBe("balancer");
  });
});
