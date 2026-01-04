/**
 * Unit tests for serviceHelpers
 */
import { describe, expect, it, vi } from "vitest";

import { executeServiceCall } from "@/services/serviceHelpers";

describe("executeServiceCall", () => {
  it("should return successful result", async () => {
    const call = vi.fn().mockResolvedValue({ data: "success" });

    const result = await executeServiceCall(call);

    expect(result).toEqual({ data: "success" });
    expect(call).toHaveBeenCalledOnce();
  });

  it("should throw original error when no mapError provided", async () => {
    const originalError = new Error("Service failed");
    const call = vi.fn().mockRejectedValue(originalError);

    await expect(executeServiceCall(call)).rejects.toThrow("Service failed");
  });

  it("should throw mapped error when mapError provided", async () => {
    const originalError = new Error("Original error");
    const mappedError = new Error("Mapped error");
    const call = vi.fn().mockRejectedValue(originalError);
    const mapError = vi.fn().mockReturnValue(mappedError);

    await expect(executeServiceCall(call, { mapError })).rejects.toThrow(
      "Mapped error"
    );
    expect(mapError).toHaveBeenCalledWith(originalError);
  });

  it("should work with async call", async () => {
    const call = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { id: 123 };
    });

    const result = await executeServiceCall(call);

    expect(result).toEqual({ id: 123 });
  });

  it("should handle call returning null", async () => {
    const call = vi.fn().mockResolvedValue(null);

    const result = await executeServiceCall(call);

    expect(result).toBeNull();
  });

  it("should handle call returning undefined", async () => {
    const call = vi.fn().mockResolvedValue(undefined);

    const result = await executeServiceCall(call);

    expect(result).toBeUndefined();
  });
});
