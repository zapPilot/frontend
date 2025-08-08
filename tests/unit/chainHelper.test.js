import test from "node:test";
import assert from "node:assert/strict";
import {
  transformToDebankChainName,
  normalizeChainName,
} from "../../src/utils/chainHelper.js";

test("transformToDebankChainName maps known chains", () => {
  assert.equal(transformToDebankChainName("ethereum"), "eth");
  assert.equal(transformToDebankChainName("arbitrum one"), "arb");
  assert.equal(transformToDebankChainName("base"), "base");
  assert.equal(transformToDebankChainName("unknown"), "unknown");
});

test("normalizeChainName lowercases and trims suffixes", () => {
  assert.equal(normalizeChainName("Arbitrum One"), "arbitrum");
  assert.equal(normalizeChainName("OP Mainnet"), "op");
  assert.equal(normalizeChainName("  Base   "), "base");
  assert.equal(normalizeChainName(null), "");
});
