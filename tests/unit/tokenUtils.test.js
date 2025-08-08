import test from "node:test";
import assert from "node:assert/strict";
import {
  getTokenSymbol,
  getFilteredAndSortedTokens,
  calculateTotalTokenValue,
} from "../../src/utils/tokenUtils.js";

test("getTokenSymbol prioritizes optimized symbol", () => {
  assert.equal(
    getTokenSymbol({ optimized_symbol: "WBTC", symbol: "BTC" }),
    "WBTC"
  );
  assert.equal(getTokenSymbol({ symbol: "ETH" }), "ETH");
  assert.equal(getTokenSymbol({}), "UNKNOWN");
});

test("getFilteredAndSortedTokens filters invalid tokens and sorts by value", () => {
  const tokens = [
    { amount: 1, price: 10 }, // value 10
    { amount: 0, price: 10 }, // filtered out (amount)
    { amount: 1, price: 0 }, // filtered out (price)
    { amount: 2, price: 5 }, // value 10
    { amount: 1, price: 20 }, // value 20
  ];
  const result = getFilteredAndSortedTokens(tokens);
  assert.equal(result.length, 3);
  assert.deepEqual(
    result.map(t => t.amount * t.price),
    [20, 10, 10]
  );
});

test("calculateTotalTokenValue sums token values", () => {
  const tokens = [
    { amount: 1, price: 10 },
    { amount: 2, price: 5 },
  ];
  assert.equal(calculateTotalTokenValue(tokens), 20);
  assert.equal(calculateTotalTokenValue(null), 0);
});
