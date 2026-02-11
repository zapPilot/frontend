import { describe, expect, it } from "vitest";

import { SIMPLE_REGIME_STRATEGY_ID } from "@/components/wallet/portfolio/views/backtesting/constants";
import {
  parseJsonField,
  parseRegimeParam,
  patchBacktestConfig,
  updateJsonField,
  updateRegimeParam,
} from "@/components/wallet/portfolio/views/backtesting/utils/jsonConfigurationHelpers";

describe("patchBacktestConfig", () => {
  describe("null/falsy input handling", () => {
    it("should return null when parsedJson is null", () => {
      const result = patchBacktestConfig(null as any, "field", "value");
      expect(result).toBeNull();
    });

    it("should return null when parsedJson is undefined", () => {
      const result = patchBacktestConfig(undefined as any, "field", "value");
      expect(result).toBeNull();
    });

    it("should return null when parsedJson is empty string", () => {
      const result = patchBacktestConfig("" as any, "field", "value");
      expect(result).toBeNull();
    });

    it("should return null when parsedJson is 0", () => {
      const result = patchBacktestConfig(0 as any, "field", "value");
      expect(result).toBeNull();
    });
  });

  describe("standard field updates", () => {
    it("should update standard field with string value", () => {
      const input = { portfolio_id: "old-value" };
      const result = patchBacktestConfig(input, "portfolio_id", "new-value");

      const parsed = JSON.parse(result!);
      expect(parsed.portfolio_id).toBe("new-value");
    });

    it("should update standard field with boolean value", () => {
      const input = { some_flag: false };
      const result = patchBacktestConfig(input, "some_flag", true);

      const parsed = JSON.parse(result!);
      expect(parsed.some_flag).toBe(true);
    });

    it("should convert numeric string to number when value matches String(Number(value))", () => {
      const input = { amount: "100" };
      const result = patchBacktestConfig(input, "amount", "200");

      const parsed = JSON.parse(result!);
      expect(parsed.amount).toBe(200);
      expect(typeof parsed.amount).toBe("number");
    });

    it("should convert decimal numeric string to number", () => {
      const input = {};
      const result = patchBacktestConfig(input, "threshold", "0.5");

      const parsed = JSON.parse(result!);
      expect(parsed.threshold).toBe(0.5);
      expect(typeof parsed.threshold).toBe("number");
    });

    it("should keep string value when not a clean number (e.g., '10.')", () => {
      const input = {};
      const result = patchBacktestConfig(input, "amount", "10.");

      const parsed = JSON.parse(result!);
      expect(parsed.amount).toBe("10.");
      expect(typeof parsed.amount).toBe("string");
    });

    it("should keep string value when empty string", () => {
      const input = {};
      const result = patchBacktestConfig(input, "name", "");

      const parsed = JSON.parse(result!);
      expect(parsed.name).toBe("");
      expect(typeof parsed.name).toBe("string");
    });

    it("should keep string value when not a valid number", () => {
      const input = {};
      const result = patchBacktestConfig(input, "label", "abc123");

      const parsed = JSON.parse(result!);
      expect(parsed.label).toBe("abc123");
    });

    it("should delete start_date and end_date when field is 'days'", () => {
      const input = {
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        other_field: "keep-me",
      };
      const result = patchBacktestConfig(input, "days", "365");

      const parsed = JSON.parse(result!);
      expect(parsed.days).toBe(365);
      expect(parsed.start_date).toBeUndefined();
      expect(parsed.end_date).toBeUndefined();
      expect(parsed.other_field).toBe("keep-me");
    });

    it("should not delete date fields for non-days field updates", () => {
      const input = {
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      };
      const result = patchBacktestConfig(input, "portfolio_id", "test-123");

      const parsed = JSON.parse(result!);
      expect(parsed.start_date).toBe("2024-01-01");
      expect(parsed.end_date).toBe("2024-12-31");
    });

    it("should preserve existing fields when updating", () => {
      const input = {
        portfolio_id: "old-id",
        existing_field: "keep-me",
        nested: { data: "preserve" },
      };
      const result = patchBacktestConfig(input, "portfolio_id", "new-id");

      const parsed = JSON.parse(result!);
      expect(parsed.portfolio_id).toBe("new-id");
      expect(parsed.existing_field).toBe("keep-me");
      expect(parsed.nested).toEqual({ data: "preserve" });
    });
  });

  describe("borrowing field updates - enable_borrowing", () => {
    it("should create configs array if it doesn't exist", () => {
      const input = {};
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      const parsed = JSON.parse(result!);
      expect(Array.isArray(parsed.configs)).toBe(true);
    });

    it("should create simple_regime config if it doesn't exist", () => {
      const input = {};
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig).toBeDefined();
      expect(regimeConfig.config_id).toBe(SIMPLE_REGIME_STRATEGY_ID);
      expect(regimeConfig.strategy_id).toBe(SIMPLE_REGIME_STRATEGY_ID);
    });

    it("should update enable_borrowing in simple_regime params", () => {
      const input = {};
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.enable_borrowing).toBe(true);
    });

    it("should use existing simple_regime config if present", () => {
      const input = {
        configs: [
          {
            config_id: SIMPLE_REGIME_STRATEGY_ID,
            strategy_id: SIMPLE_REGIME_STRATEGY_ID,
            params: { existing_param: "keep-me" },
          },
        ],
      };
      const result = patchBacktestConfig(input, "enable_borrowing", false);

      const parsed = JSON.parse(result!);
      expect(parsed.configs.length).toBe(1);
      const regimeConfig = parsed.configs[0];
      expect(regimeConfig.params.enable_borrowing).toBe(false);
      expect(regimeConfig.params.existing_param).toBe("keep-me");
    });

    it("should preserve other configs when updating borrowing field", () => {
      const input = {
        configs: [
          {
            config_id: "other-config",
            strategy_id: "other-strategy",
            params: { other_param: "value" },
          },
        ],
      };
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      const parsed = JSON.parse(result!);
      expect(parsed.configs.length).toBe(2);
      expect(parsed.configs[0].strategy_id).toBe("other-strategy");
      expect(parsed.configs[1].strategy_id).toBe(SIMPLE_REGIME_STRATEGY_ID);
    });

    it("should create params object if it doesn't exist on existing regime config", () => {
      const input = {
        configs: [
          {
            config_id: SIMPLE_REGIME_STRATEGY_ID,
            strategy_id: SIMPLE_REGIME_STRATEGY_ID,
          },
        ],
      };
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params).toBeDefined();
      expect(regimeConfig.params.enable_borrowing).toBe(true);
    });

    it("should handle params being null", () => {
      const input = {
        configs: [
          {
            config_id: SIMPLE_REGIME_STRATEGY_ID,
            strategy_id: SIMPLE_REGIME_STRATEGY_ID,
            params: null as any,
          },
        ],
      };
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params).toBeDefined();
      expect(regimeConfig.params.enable_borrowing).toBe(true);
    });
  });

  describe("borrowing field updates - borrow_ltv", () => {
    it("should update borrow_ltv in simple_regime params", () => {
      const input = {};
      const result = patchBacktestConfig(input, "borrow_ltv", 75);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.borrow_ltv).toBe(75);
    });

    it("should handle borrow_ltv as string value", () => {
      const input = {};
      const result = patchBacktestConfig(input, "borrow_ltv", "80");

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.borrow_ltv).toBe("80");
    });

    it("should preserve other borrowing params when updating borrow_ltv", () => {
      const input = {
        configs: [
          {
            config_id: SIMPLE_REGIME_STRATEGY_ID,
            strategy_id: SIMPLE_REGIME_STRATEGY_ID,
            params: {
              enable_borrowing: true,
              borrow_apr: 0.05,
            },
          },
        ],
      };
      const result = patchBacktestConfig(input, "borrow_ltv", 70);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs[0];
      expect(regimeConfig.params.borrow_ltv).toBe(70);
      expect(regimeConfig.params.enable_borrowing).toBe(true);
      expect(regimeConfig.params.borrow_apr).toBe(0.05);
    });
  });

  describe("borrowing field updates - borrow_apr", () => {
    it("should convert borrow_apr from percentage to decimal for numeric value", () => {
      const input = {};
      const result = patchBacktestConfig(input, "borrow_apr", 5);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.borrow_apr).toBe(0.05);
    });

    it("should convert borrow_apr: 100 becomes 1.0", () => {
      const input = {};
      const result = patchBacktestConfig(input, "borrow_apr", 100);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.borrow_apr).toBe(1.0);
    });

    it("should convert borrow_apr: 0.5 becomes 0.005", () => {
      const input = {};
      const result = patchBacktestConfig(input, "borrow_apr", 0.5);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.borrow_apr).toBe(0.005);
    });

    it("should NOT convert borrow_apr when value is string", () => {
      const input = {};
      const result = patchBacktestConfig(input, "borrow_apr", "5");

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.borrow_apr).toBe("5");
    });

    it("should NOT convert borrow_apr when value is boolean", () => {
      const input = {};
      const result = patchBacktestConfig(input, "borrow_apr", true);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.borrow_apr).toBe(true);
    });

    it("should handle borrow_apr with 0", () => {
      const input = {};
      const result = patchBacktestConfig(input, "borrow_apr", 0);

      const parsed = JSON.parse(result!);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig.params.borrow_apr).toBe(0);
    });
  });

  describe("JSON formatting", () => {
    it("should return formatted JSON with 2-space indentation for standard fields", () => {
      const input = { field: "value" };
      const result = patchBacktestConfig(input, "new_field", "new_value");

      expect(result).toContain("\n");
      expect(result).toContain("  ");
      expect(JSON.parse(result!)).toBeDefined();
    });

    it("should return formatted JSON with 2-space indentation for borrowing fields", () => {
      const input = {};
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      expect(result).toContain("\n");
      expect(result).toContain("  ");
      expect(JSON.parse(result!)).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle updating field that already exists", () => {
      const input = { portfolio_id: "old-value" };
      const result = patchBacktestConfig(input, "portfolio_id", "new-value");

      const parsed = JSON.parse(result!);
      expect(parsed.portfolio_id).toBe("new-value");
    });

    it("should handle updating field that doesn't exist", () => {
      const input = {};
      const result = patchBacktestConfig(input, "new_field", "new-value");

      const parsed = JSON.parse(result!);
      expect(parsed.new_field).toBe("new-value");
    });

    it("should handle configs array with multiple items when adding borrowing field", () => {
      const input = {
        configs: [
          { config_id: "config1", strategy_id: "strategy1", params: {} },
          { config_id: "config2", strategy_id: "strategy2", params: {} },
        ],
      };
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      const parsed = JSON.parse(result!);
      expect(parsed.configs.length).toBe(3);
      const regimeConfig = parsed.configs.find(
        (c: any) => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
      );
      expect(regimeConfig).toBeDefined();
    });

    it("should preserve root-level fields when updating borrowing fields", () => {
      const input = {
        portfolio_id: "test-123",
        days: 365,
      };
      const result = patchBacktestConfig(input, "enable_borrowing", true);

      const parsed = JSON.parse(result!);
      expect(parsed.portfolio_id).toBe("test-123");
      expect(parsed.days).toBe(365);
      expect(parsed.configs).toBeDefined();
    });

    it("should handle negative numbers", () => {
      const input = {};
      const result = patchBacktestConfig(input, "offset", "-10");

      const parsed = JSON.parse(result!);
      expect(parsed.offset).toBe(-10);
    });

    it("should handle scientific notation as string (not converted)", () => {
      const input = {};
      const result = patchBacktestConfig(input, "threshold", "1e-5");

      const parsed = JSON.parse(result!);
      // Scientific notation string doesn't match String(Number(value))
      // because Number("1e-5") -> 0.00001 and String(0.00001) -> "0.00001"
      expect(parsed.threshold).toBe("1e-5");
    });

    it("should handle very large numbers", () => {
      const input = {};
      const result = patchBacktestConfig(input, "max_value", "999999999");

      const parsed = JSON.parse(result!);
      expect(parsed.max_value).toBe(999999999);
    });
  });

  describe("immutability", () => {
    it("should not mutate input object for standard fields", () => {
      const input = { field: "original" };
      const inputCopy = { ...input };

      patchBacktestConfig(input, "field", "updated");

      expect(input).toEqual(inputCopy);
    });

    it("should shallow copy top level but may share nested references for borrowing fields", () => {
      const input = {
        configs: [
          {
            config_id: SIMPLE_REGIME_STRATEGY_ID,
            strategy_id: SIMPLE_REGIME_STRATEGY_ID,
            params: { enable_borrowing: false },
          },
        ],
      };
      const originalConfigs = input.configs;

      const result = patchBacktestConfig(input, "enable_borrowing", true);
      const parsed = JSON.parse(result!);

      // Top-level object is different (not mutated)
      expect(input.configs).toBe(originalConfigs);

      // But the function modifies nested objects in the spread copy
      // This is expected behavior - shallow copy at top level only
      expect(parsed.configs[0].params.enable_borrowing).toBe(true);
    });
  });
});

describe("parseJsonField", () => {
  it("should return the numeric value for a valid key", () => {
    expect(parseJsonField('{"days": 500}', "days", 365)).toBe(500);
  });

  it("should return fallback when key is missing", () => {
    expect(parseJsonField('{"days": 500}', "total_capital", 10000)).toBe(10000);
  });

  it("should return fallback when JSON is invalid", () => {
    expect(parseJsonField("not json", "days", 365)).toBe(365);
  });

  it("should return fallback when value is not a number", () => {
    expect(parseJsonField('{"days": "500"}', "days", 365)).toBe(365);
  });

  it("should handle zero as a valid numeric value", () => {
    expect(parseJsonField('{"days": 0}', "days", 365)).toBe(0);
  });
});

describe("updateJsonField", () => {
  it("should update a field and preserve others", () => {
    const json = JSON.stringify({ days: 500, total_capital: 10000 });
    const result = JSON.parse(updateJsonField(json, "days", 365));
    expect(result.days).toBe(365);
    expect(result.total_capital).toBe(10000);
  });

  it("should return original JSON on invalid input", () => {
    const bad = "not json";
    expect(updateJsonField(bad, "days", 365)).toBe(bad);
  });

  it("should add a new field if it does not exist", () => {
    const json = JSON.stringify({ days: 500 });
    const result = JSON.parse(updateJsonField(json, "total_capital", 5000));
    expect(result.total_capital).toBe(5000);
  });
});

/** Build a minimal JSON string with a simple_regime config for regime param tests. */
const makeRegimeJson = (params: Record<string, unknown> = {}) =>
  JSON.stringify({
    configs: [{ strategy_id: SIMPLE_REGIME_STRATEGY_ID, params }],
  });

describe("parseRegimeParam", () => {
  it("should read a string param from the simple_regime config", () => {
    expect(
      parseRegimeParam(
        makeRegimeJson({ signal_provider: "fgi" }),
        "signal_provider",
        ""
      )
    ).toBe("fgi");
  });

  it("should return fallback when config is missing", () => {
    const json = JSON.stringify({ configs: [{ strategy_id: "dca_classic" }] });
    expect(parseRegimeParam(json, "signal_provider", "default")).toBe(
      "default"
    );
  });

  it("should return fallback when param value is not a string", () => {
    expect(
      parseRegimeParam(
        makeRegimeJson({ signal_provider: 42 }),
        "signal_provider",
        "default"
      )
    ).toBe("default");
  });

  it("should return fallback when configs is not an array", () => {
    expect(
      parseRegimeParam('{"configs": "invalid"}', "signal_provider", "default")
    ).toBe("default");
  });

  it("should return fallback on invalid JSON", () => {
    expect(parseRegimeParam("bad json", "signal_provider", "default")).toBe(
      "default"
    );
  });
});

describe("updateRegimeParam", () => {
  it("should set a param value", () => {
    const result = JSON.parse(
      updateRegimeParam(makeRegimeJson({}), "signal_provider", "fgi")
    );
    expect(result.configs[0].params.signal_provider).toBe("fgi");
  });

  it("should remove param key when value is empty string", () => {
    const json = makeRegimeJson({
      signal_provider: "fgi",
      pacing_policy: "exp",
    });
    const result = JSON.parse(updateRegimeParam(json, "signal_provider", ""));
    expect(result.configs[0].params.signal_provider).toBeUndefined();
    expect(result.configs[0].params.pacing_policy).toBe("exp");
  });

  it("should return original JSON when configs is not an array", () => {
    const json = '{"configs": "invalid"}';
    expect(updateRegimeParam(json, "signal_provider", "fgi")).toBe(json);
  });

  it("should return original JSON when simple_regime config is missing", () => {
    const json = JSON.stringify({ configs: [{ strategy_id: "dca_classic" }] });
    expect(updateRegimeParam(json, "signal_provider", "fgi")).toBe(json);
  });

  it("should create params object if missing on config", () => {
    const json = JSON.stringify({
      configs: [{ strategy_id: SIMPLE_REGIME_STRATEGY_ID }],
    });
    const result = JSON.parse(
      updateRegimeParam(json, "signal_provider", "fgi")
    );
    expect(result.configs[0].params.signal_provider).toBe("fgi");
  });

  it("should return original JSON on invalid input", () => {
    expect(updateRegimeParam("bad json", "signal_provider", "fgi")).toBe(
      "bad json"
    );
  });
});
