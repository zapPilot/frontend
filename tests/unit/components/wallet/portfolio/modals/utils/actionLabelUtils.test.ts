import { describe, expect, it } from "vitest";

import { resolveActionLabel } from "@/components/wallet/portfolio/modals/utils/actionLabelUtils";
import { WALLET_LABELS } from "@/constants/wallet";

describe("resolveActionLabel", () => {
  it("returns 'Connect Wallet' when not connected", () => {
    const result = resolveActionLabel({
      isConnected: false,
      isReady: true,
      readyLabel: "Execute",
      notReadyLabel: "Not Ready",
      hasSelection: true,
    });

    expect(result).toBe(WALLET_LABELS.CONNECT);
  });

  it("returns selectionLabel when connected but no selection (hasSelection=false)", () => {
    const result = resolveActionLabel({
      isConnected: true,
      isReady: true,
      readyLabel: "Execute",
      notReadyLabel: "Not Ready",
      hasSelection: false,
      selectionLabel: "Select an option",
    });

    expect(result).toBe("Select an option");
  });

  it("returns notReadyLabel when connected with selection but not ready", () => {
    const result = resolveActionLabel({
      isConnected: true,
      isReady: false,
      readyLabel: "Execute",
      notReadyLabel: "Not Ready",
      hasSelection: true,
    });

    expect(result).toBe("Not Ready");
  });

  it("returns readyLabel when connected, has selection, and is ready", () => {
    const result = resolveActionLabel({
      isConnected: true,
      isReady: true,
      readyLabel: "Execute",
      notReadyLabel: "Not Ready",
      hasSelection: true,
    });

    expect(result).toBe("Execute");
  });

  it("defaults hasSelection to true when not provided", () => {
    const result = resolveActionLabel({
      isConnected: true,
      isReady: true,
      readyLabel: "Execute",
      notReadyLabel: "Not Ready",
    });

    expect(result).toBe("Execute");
  });

  it("defaults selectionLabel to notReadyLabel when not provided and hasSelection=false", () => {
    const result = resolveActionLabel({
      isConnected: true,
      isReady: true,
      readyLabel: "Execute",
      notReadyLabel: "Not Ready",
      hasSelection: false,
    });

    expect(result).toBe("Not Ready");
  });
});
