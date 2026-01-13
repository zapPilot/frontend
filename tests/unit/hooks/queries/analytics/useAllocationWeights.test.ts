import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAllocationWeights } from "@/hooks/queries/analytics/useAllocationWeights";
import { getAllocationWeights } from "@/services/allocationService";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  keepPreviousData: false, // needed if imported
}));

vi.mock("@/services/allocationService", () => ({
  getAllocationWeights: vi.fn(),
}));

describe("useAllocationWeights", () => {
  it("calls useQuery with correct options", () => {
    renderHook(() => useAllocationWeights());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["allocation-weights"],
        queryFn: getAllocationWeights,
        staleTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
      })
    );
  });
});
