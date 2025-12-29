/**
 * SimpleWeb3Provider Unit Tests
 *
 * Tests for the ThirdWeb provider wrapper
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { SimpleWeb3Provider } from "@/providers/SimpleWeb3Provider";

// Mock thirdweb/react
vi.mock("thirdweb/react", () => ({
  ThirdwebProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="thirdweb-provider">{children}</div>
  ),
  AutoConnect: () => <div data-testid="auto-connect" />,
}));

vi.mock("@/config/wallets", () => ({
  DEFAULT_WALLETS: [],
}));

vi.mock("@/utils/thirdweb", () => ({
  default: {},
}));

describe("SimpleWeb3Provider", () => {
  it("should render children", () => {
    render(
      <SimpleWeb3Provider>
        <div data-testid="child">Web3 Content</div>
      </SimpleWeb3Provider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Web3 Content")).toBeInTheDocument();
  });

  it("should wrap children with ThirdwebProvider", () => {
    render(
      <SimpleWeb3Provider>
        <span>Content</span>
      </SimpleWeb3Provider>
    );

    expect(screen.getByTestId("thirdweb-provider")).toBeInTheDocument();
  });

  it("should include AutoConnect component", () => {
    render(
      <SimpleWeb3Provider>
        <span>Content</span>
      </SimpleWeb3Provider>
    );

    expect(screen.getByTestId("auto-connect")).toBeInTheDocument();
  });
});
