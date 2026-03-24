import { describe, expect, it } from "vitest";

import {
  parseConfigStrategyId,
  parseJsonField,
  patchBacktestConfig,
  updateConfigStrategy,
  updateJsonField,
} from "@/components/wallet/portfolio/views/backtesting/utils/jsonConfigurationHelpers";

describe("patchBacktestConfig", () => {
  it("returns null for nullish input", () => {
    expect(patchBacktestConfig(null as any, "days", 365)).toBeNull();
    expect(patchBacktestConfig(undefined as any, "days", 365)).toBeNull();
  });

  it("converts clean numeric strings to numbers", () => {
    const result = patchBacktestConfig({}, "days", "365");
    expect(JSON.parse(result!).days).toBe(365);
  });

  it("preserves non-clean numeric strings while typing", () => {
    const result = patchBacktestConfig({}, "days", "10.");
    expect(JSON.parse(result!).days).toBe("10.");
  });

  it("removes start_date and end_date when updating days", () => {
    const result = patchBacktestConfig(
      {
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      } as any,
      "days",
      365
    );

    const parsed = JSON.parse(result!);
    expect(parsed.days).toBe(365);
    expect(parsed.start_date).toBeUndefined();
    expect(parsed.end_date).toBeUndefined();
  });
});

describe("parseJsonField", () => {
  it("reads numeric top-level fields", () => {
    expect(parseJsonField('{"days":365}', "days", 500)).toBe(365);
  });

  it("returns fallback for invalid or missing fields", () => {
    expect(parseJsonField("bad json", "days", 500)).toBe(500);
    expect(parseJsonField('{"total_capital":10000}', "days", 500)).toBe(500);
  });
});

describe("updateJsonField", () => {
  it("updates a numeric top-level field", () => {
    const updated = JSON.parse(updateJsonField('{"days":500}', "days", 365));
    expect(updated.days).toBe(365);
  });

  it("returns the original JSON when parsing fails", () => {
    expect(updateJsonField("bad json", "days", 365)).toBe("bad json");
  });
});

describe("parseConfigStrategyId", () => {
  it("reads strategy_id from the first config entry", () => {
    const json = JSON.stringify({
      configs: [{ config_id: "x", strategy_id: "dma_gated_fgi" }],
    });
    expect(parseConfigStrategyId(json, "fallback")).toBe("dma_gated_fgi");
  });

  it("returns fallback for invalid JSON", () => {
    expect(parseConfigStrategyId("bad json", "fallback")).toBe("fallback");
  });

  it("returns fallback when configs is missing", () => {
    expect(parseConfigStrategyId('{"days":500}', "fallback")).toBe("fallback");
  });

  it("returns fallback when configs is empty", () => {
    expect(parseConfigStrategyId('{"configs":[]}', "fallback")).toBe(
      "fallback"
    );
  });

  it("returns fallback when strategy_id is not a string", () => {
    const json = JSON.stringify({ configs: [{ strategy_id: 123 }] });
    expect(parseConfigStrategyId(json, "fallback")).toBe("fallback");
  });
});

describe("updateConfigStrategy", () => {
  it("updates strategy_id on the first config entry", () => {
    const json = JSON.stringify({
      days: 500,
      configs: [{ config_id: "x", strategy_id: "old", params: { k: 1 } }],
    });
    const result = JSON.parse(updateConfigStrategy(json, "new_strat"));
    expect(result.configs[0].strategy_id).toBe("new_strat");
    expect(result.configs[0].params).toEqual({ k: 1 });
    expect(result.days).toBe(500);
  });

  it("replaces params when defaultParams is provided", () => {
    const json = JSON.stringify({
      configs: [{ config_id: "x", strategy_id: "old", params: { k: 1 } }],
    });
    const result = JSON.parse(
      updateConfigStrategy(json, "new_strat", { lookback: 14 })
    );
    expect(result.configs[0].strategy_id).toBe("new_strat");
    expect(result.configs[0].params).toEqual({ lookback: 14 });
  });

  it("discards other config entries, keeping only the updated one", () => {
    const json = JSON.stringify({
      configs: [
        { config_id: "a", strategy_id: "first" },
        { config_id: "b", strategy_id: "second" },
      ],
    });
    const result = JSON.parse(updateConfigStrategy(json, "changed"));
    expect(result.configs).toHaveLength(1);
    expect(result.configs[0].strategy_id).toBe("changed");
    expect(result.configs[0].config_id).toBe("a");
  });

  it("returns original JSON on parse failure", () => {
    expect(updateConfigStrategy("bad json", "x")).toBe("bad json");
  });

  it("returns original JSON when configs is empty", () => {
    const json = '{"configs":[]}';
    expect(updateConfigStrategy(json, "x")).toBe(json);
  });

  it("returns original JSON when configs is missing", () => {
    const json = '{"days":500}';
    expect(updateConfigStrategy(json, "x")).toBe(json);
  });

  it("preserves other top-level fields when updating config", () => {
    const json = JSON.stringify({
      days: 500,
      total_capital: 10000,
      configs: [{ config_id: "x", strategy_id: "old" }],
    });

    const result = JSON.parse(updateConfigStrategy(json, "new_strat"));

    expect(result.days).toBe(500);
    expect(result.total_capital).toBe(10000);
    expect(result.configs[0].strategy_id).toBe("new_strat");
  });

  it("preserves config_id when only strategy_id is updated", () => {
    const json = JSON.stringify({
      configs: [
        { config_id: "my_config", strategy_id: "old_strat", params: {} },
      ],
    });

    const result = JSON.parse(updateConfigStrategy(json, "new_strat"));

    expect(result.configs[0].config_id).toBe("my_config");
    expect(result.configs[0].strategy_id).toBe("new_strat");
  });

  it("replaces params with empty object when defaultParams is {}", () => {
    const json = JSON.stringify({
      configs: [{ config_id: "x", strategy_id: "old", params: { k: 5, r: 1 } }],
    });

    const result = JSON.parse(updateConfigStrategy(json, "new_strat", {}));

    expect(result.configs[0].params).toEqual({});
  });
});
