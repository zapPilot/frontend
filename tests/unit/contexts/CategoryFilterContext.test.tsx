import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import {
  CategoryFilterProvider,
  useCategoryFilter,
} from "../../../src/contexts/CategoryFilterContext";

function Consumer() {
  const { selectedCategoryId, setSelectedCategoryId, clearCategoryFilter } =
    useCategoryFilter();
  return (
    <div>
      <div data-testid="value">{selectedCategoryId || "none"}</div>
      <button onClick={() => setSelectedCategoryId("eth")}>set-eth</button>
      <button onClick={() => clearCategoryFilter()}>clear</button>
    </div>
  );
}

describe("CategoryFilterContext", () => {
  it("provides and updates selectedCategoryId", async () => {
    const value = {
      selectedCategoryId: null as string | null,
      setSelectedCategoryId: (id: string | null) =>
        (value.selectedCategoryId = id),
      clearCategoryFilter: () => (value.selectedCategoryId = null),
    };

    const { rerender } = render(
      <CategoryFilterProvider value={value}>
        <Consumer />
      </CategoryFilterProvider>
    );

    expect(screen.getByTestId("value").textContent).toBe("none");

    screen.getByText("set-eth").click();
    // Re-render to reflect controlled provider value mutation
    rerender(
      <CategoryFilterProvider value={value}>
        <Consumer />
      </CategoryFilterProvider>
    );
    expect(screen.getByTestId("value").textContent).toBe("eth");

    screen.getByText("clear").click();
    rerender(
      <CategoryFilterProvider value={value}>
        <Consumer />
      </CategoryFilterProvider>
    );
    expect(screen.getByTestId("value").textContent).toBe("none");
  });
});
