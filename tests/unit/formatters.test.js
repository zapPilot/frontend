import test from "node:test";
import assert from "node:assert/strict";
import {
  formatSmallNumber,
  formatBalance,
  formatEthAmount,
  formatSmallCurrency,
} from "../../src/utils/formatters.js";

test("formatSmallNumber handles various ranges", () => {
  assert.equal(formatSmallNumber(0), "0");
  assert.equal(formatSmallNumber(0.0000005), "< 0.000001");
  assert.equal(formatSmallNumber(0.005), "0.005000");
  assert.equal(formatSmallNumber(0.5), "0.5000");
  assert.equal(formatSmallNumber(50), "50.00");
  assert.equal(formatSmallNumber(150), "150");
});

test("formatBalance formats dollar amounts", () => {
  assert.equal(formatBalance(0), "$0.00");
  assert.equal(formatBalance(0.005), "< $0.01");
  assert.equal(formatBalance(1.234), "$1.23");
});

test("formatEthAmount handles precision thresholds", () => {
  assert.equal(formatEthAmount(0), "0 ETH");
  assert.equal(formatEthAmount(0.00005), "< 0.0001 ETH");
  assert.equal(formatEthAmount(0.005), "0.00500000 ETH");
  assert.equal(formatEthAmount(0.5), "0.5000 ETH");
  assert.equal(formatEthAmount(5), "5.0000 ETH");
});

test("formatSmallCurrency handles thresholds and negatives", () => {
  assert.equal(formatSmallCurrency(0), "0");
  assert.equal(formatSmallCurrency(0.005), "< $0.0100");
  assert.equal(formatSmallCurrency(-0.005), "-< $0.0100");
  assert.equal(formatSmallCurrency(1.234), "$1.23");
  assert.equal(formatSmallCurrency(-2.5), "-$2.50");
});
