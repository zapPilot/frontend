import { render } from "@testing-library/react";
import { describe, expect,it } from "vitest";

import { ProtocolImage } from "@/components/shared/ProtocolImage";

describe("ProtocolImage", () => {
  it("normalizes protocol name for CDN URL", () => {
    const { container } = render(
      <ProtocolImage protocol={{ name: "aerodrome v3" }} size={24} />
    );

    const img = container.querySelector("img");
    expect(img?.src).toContain("/projectPictures/aerodrome.webp");
  });

  it("uses logo_url when provided", () => {
    const logoUrl = "https://example.com/logo.png";
    const { container } = render(
      <ProtocolImage
        protocol={{ name: "aerodrome v3", logo_url: logoUrl }}
        size={24}
      />
    );

    const img = container.querySelector("img");
    expect(img?.src).toBe(logoUrl);
  });

  it("handles various version formats", () => {
    const testCases = [
      { input: "Uniswap V2", expected: "uniswap" },
      { input: "aerodrome-v3", expected: "aerodrome" },
      { input: "compoundV1", expected: "compound" },
      { input: "protocol/v2", expected: "protocol" },
    ];

    for (const { input, expected } of testCases) {
      const { container } = render(
        <ProtocolImage protocol={{ name: input }} size={24} />
      );
      const img = container.querySelector("img");
      expect(img?.src).toContain(`/projectPictures/${expected}.webp`);
    }
  });

  it("preserves protocol names without versions", () => {
    const { container } = render(
      <ProtocolImage protocol={{ name: "Aave" }} size={24} />
    );

    const img = container.querySelector("img");
    expect(img?.src).toContain("/projectPictures/aave.webp");
  });

  it("preserves legitimate 'v' in protocol names", () => {
    const { container } = render(
      <ProtocolImage protocol={{ name: "Venus Protocol" }} size={24} />
    );

    const img = container.querySelector("img");
    // URL encodes spaces as %20
    expect(img?.src).toContain("/projectPictures/venus%20protocol.webp");
  });

  it("handles empty protocol name", () => {
    const { container } = render(
      <ProtocolImage protocol={{ name: "" }} size={24} />
    );

    const img = container.querySelector("img");
    // Should still render an image (fallback will be triggered)
    expect(img).toBeTruthy();
  });

  it("handles undefined protocol name", () => {
    const { container } = render(
      <ProtocolImage protocol={{ name: undefined }} size={24} />
    );

    const img = container.querySelector("img");
    // Should still render an image (fallback will be triggered)
    expect(img).toBeTruthy();
  });

  it("renders with custom size", () => {
    const { container } = render(
      <ProtocolImage protocol={{ name: "aave" }} size={32} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper?.style.width).toBe("32px");
    expect(wrapper?.style.height).toBe("32px");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ProtocolImage
        protocol={{ name: "aave" }}
        size={24}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper?.className).toContain("custom-class");
  });
});
