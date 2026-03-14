import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SUPPORTED_CHAINS, DEFAULT_WALLETS } from "@/config/wallets";
import { WALLET_LABELS } from "@/constants/wallet";

import { render, screen } from "../../../../test-utils";

const connectButtonMock = vi.fn();
const originalVitestEnv = process.env["VITEST"];

const loadConnectWalletButton = async (vitestEnv: string | undefined) => {
  vi.resetModules();
  connectButtonMock.mockReset();

  if (vitestEnv === undefined) {
    delete process.env["VITEST"];
  } else {
    process.env["VITEST"] = vitestEnv;
  }

  vi.doMock("thirdweb/react", () => ({
    ConnectButton: (props: unknown) => {
      connectButtonMock(props);
      return <div data-testid="connect-button" />;
    },
  }));

  vi.doMock("@/utils/QueryClientBoundary", () => ({
    QueryClientBoundary: ({ children }: { children: ReactNode }) => (
      <div data-testid="query-client-boundary">{children}</div>
    ),
  }));

  return import("@/components/WalletManager/components/ConnectWalletButton");
};

describe("ConnectWalletButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.doUnmock("thirdweb/react");
    vi.doUnmock("@/utils/QueryClientBoundary");
    vi.resetModules();

    if (originalVitestEnv === undefined) {
      delete process.env["VITEST"];
      return;
    }

    process.env["VITEST"] = originalVitestEnv;
  });

  it("renders the fallback button in the Vitest environment", async () => {
    const { ConnectWalletButton } = await loadConnectWalletButton("true");
    const { container } = render(
      <ConnectWalletButton className="custom-class" />
    );

    expect(
      screen.getByRole("button", { name: WALLET_LABELS.CONNECT })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("connect-button")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders the production ConnectButton when the Vitest flag is unset", async () => {
    const { ConnectWalletButton } = await loadConnectWalletButton(undefined);
    const { container } = render(
      <ConnectWalletButton className="prod-class" />
    );

    expect(screen.getByTestId("query-client-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("connect-button")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("prod-class");
    expect(connectButtonMock).toHaveBeenCalledTimes(1);

    const props = connectButtonMock.mock.calls[0]?.[0] as {
      chains: { id: number }[];
      connectButton: {
        label: string;
        style: Record<string, string>;
      };
      connectModal: {
        size: string;
        title: string;
        titleIcon: string;
        showThirdwebBranding: boolean;
      };
      theme: string;
      wallets: unknown[];
    };

    expect(props.theme).toBe("dark");
    expect(props.wallets).toHaveLength(DEFAULT_WALLETS.length);
    expect(props.chains.map(chain => chain.id)).toEqual(
      DEFAULT_SUPPORTED_CHAINS.map(chain => chain.id)
    );
    expect(props.connectModal).toEqual({
      size: "compact",
      title: "Connect Another Wallet",
      titleIcon: "",
      showThirdwebBranding: false,
    });
    expect(props.connectButton.label).toBe(WALLET_LABELS.CONNECT);
    expect(props.connectButton.style).toEqual(
      expect.objectContaining({
        width: "100%",
        borderRadius: "12px",
        color: "white",
      })
    );
  });
});
