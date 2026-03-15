import { describe, expect, it } from "vitest";

import {
  parseJsonField,
  patchBacktestConfig,
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
