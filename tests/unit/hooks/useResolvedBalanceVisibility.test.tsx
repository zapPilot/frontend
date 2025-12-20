import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useResolvedBalanceVisibility } from "../../../src/hooks/useResolvedBalanceVisibility";

describe("useResolvedBalanceVisibility", () => {
  it("returns false when no prop is provided", () => {
    const { result } = renderHook(() => useResolvedBalanceVisibility());
    expect(result.current).toBe(false);
  });

  it("returns true when prop is true", () => {
    const { result } = renderHook(() => useResolvedBalanceVisibility(true));
    expect(result.current).toBe(true);
  });

  it("returns false when prop is false", () => {
    const { result } = renderHook(() => useResolvedBalanceVisibility(false));
    expect(result.current).toBe(false);
  });

  it("treats null as the default false", () => {
    const { result } = renderHook(() =>
      useResolvedBalanceVisibility(null as unknown as boolean)
    );
    expect(result.current).toBe(false);
  });

  it("handles rerenders with updated prop values", () => {
    const { result, rerender } = renderHook(
      ({ propValue }: { propValue?: boolean }) =>
        useResolvedBalanceVisibility(propValue),
      { initialProps: { propValue: true } }
    );

    expect(result.current).toBe(true);

    rerender({ propValue: false });
    expect(result.current).toBe(false);

    rerender({ propValue: undefined });
    expect(result.current).toBe(false);

    rerender({ propValue: true });
    expect(result.current).toBe(true);
  });
});
