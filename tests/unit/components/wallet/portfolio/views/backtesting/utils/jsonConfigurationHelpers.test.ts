import { describe, expect, it } from "vitest";

import {
  parseJsonField,
  parseRegimeParam,
  patchBacktestConfig,
  updateJsonField,
  updateRegimeParam,
} from "@/components/wallet/portfolio/views/backtesting/utils/jsonConfigurationHelpers";

function makeEditorJson(params: Record<string, unknown> = {}): string {
  return JSON.stringify(
    {
      days: 500,
      total_capital: 10000,
      configs: [
        {
          config_id: "dca_classic",
          strategy_id: "dca_classic",
          params: {},
        },
        {
          config_id: "dma_gated_fgi_default",
          strategy_id: "dma_gated_fgi",
          params,
        },
      ],
    },
    null,
    2
  );
}

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

describe("parseRegimeParam", () => {
  it("reads a string param from the first non-DCA config", () => {
    expect(
      parseRegimeParam(
        makeEditorJson({ signal_id: "fgi" }),
        "signal_id",
        "dma_gated_fgi"
      )
    ).toBe("fgi");
  });

  it("returns fallback for invalid JSON, missing configs, or non-string values", () => {
    expect(parseRegimeParam("bad json", "signal_id", "dma_gated_fgi")).toBe(
      "dma_gated_fgi"
    );
    expect(
      parseRegimeParam('{"configs":"invalid"}', "signal_id", "dma_gated_fgi")
    ).toBe("dma_gated_fgi");
    expect(
      parseRegimeParam(
        makeEditorJson({ signal_id: 42 }),
        "signal_id",
        "dma_gated_fgi"
      )
    ).toBe("dma_gated_fgi");
  });
});

describe("updateRegimeParam", () => {
  it("writes a param into the first non-DCA config", () => {
    const updated = JSON.parse(
      updateRegimeParam(makeEditorJson({}), "signal_id", "fgi")
    );

    expect(updated.configs[1].params.signal_id).toBe("fgi");
  });

  it("removes a param when given an empty string", () => {
    const updated = JSON.parse(
      updateRegimeParam(
        makeEditorJson({
          signal_id: "fgi",
          pacing_params: { k: 5 },
        }),
        "signal_id",
        ""
      )
    );

    expect(updated.configs[1].params.signal_id).toBeUndefined();
    expect(updated.configs[1].params.pacing_params).toEqual({ k: 5 });
  });

  it("returns the original JSON when parsing fails or no non-DCA config exists", () => {
    const dcaOnly = JSON.stringify({
      configs: [
        { config_id: "dca_classic", strategy_id: "dca_classic", params: {} },
      ],
    });

    expect(updateRegimeParam("bad json", "signal_id", "fgi")).toBe("bad json");
    expect(updateRegimeParam(dcaOnly, "signal_id", "fgi")).toBe(dcaOnly);
  });
});
