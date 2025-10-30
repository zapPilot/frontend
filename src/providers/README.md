# Providers Overview

This directory contains the lightweight provider stack that powers Zap Pilot's app shell. The
original “phase 2” abstraction layer (dynamic provider factory, adapter registry, event bus) has
been retired in favour of a lean, direct integration with Thirdweb. What remains is intentionally
simple and focused on the primitives the UI actually uses today.

## Current Stack

```
QueryProvider  →  SimpleWeb3Provider  →  WalletProvider  →  App
```

### QueryProvider (`QueryProvider.tsx`)

- Wraps the app with a shared `QueryClient` from TanStack Query.
- Enables React Query Devtools only when `NODE_ENV=development` **and**
  `NEXT_PUBLIC_ENABLE_RQ_DEVTOOLS=1` (keeps production bundle clean).

### SimpleWeb3Provider (`SimpleWeb3Provider.tsx`)

- A thin wrapper around `ThirdwebProvider`.
- No custom configuration is required; environment variables are read directly by Thirdweb’s SDK.
- Exists purely to keep the Thirdweb context colocated with the rest of the provider stack.

### WalletProvider (`WalletProvider.tsx`)

- Bridges a subset of Thirdweb React hooks into a single context that the app can consume.
- Exposes a simplified shape:
  ```ts
  {
    account: { address, isConnected, balance? } | null;
    chain: { id, name, symbol } | null;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    switchChain(chainId: number): Promise<void>;
    signMessage(message: string): Promise<string>;
    isConnected: boolean;
    isConnecting: boolean;
    isDisconnecting: boolean;
    error: { message; code? } | null;
    clearError(): void;
  }
  ```
- Use the `useWalletProvider` hook to access the context.
- Any errors surfaced today are logged through `walletLogger`; callers are expected to handle
  promise rejections.

## Usage

The Next.js root layout demonstrates the intended composition:

```tsx
import { QueryProvider } from "@/providers/QueryProvider";
import { SimpleWeb3Provider } from "@/providers/SimpleWeb3Provider";
import { WalletProvider } from "@/providers/WalletProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SimpleWeb3Provider>
        <WalletProvider>{children}</WalletProvider>
      </SimpleWeb3Provider>
    </QueryProvider>
  );
}
```

Inside feature code:

```tsx
import { useWalletProvider } from "@/providers/WalletProvider";

const ConnectButton = () => {
  const { account, connect, disconnect, isConnected } = useWalletProvider();

  return isConnected ? (
    <button onClick={disconnect}>Disconnect {account?.address}</button>
  ) : (
    <button onClick={connect}>Connect Wallet</button>
  );
};
```

## Extending or Reintroducing Advanced Features

- **Additional providers**: If multi-provider switching is needed again, start by abstracting
  `SimpleWeb3Provider` behind a new facade and reintroduce the factory pattern there rather than
  bloating `WalletProvider`.
- **Chain configuration**: `handleSwitchChain` currently constructs a basic chain object. Update it
  to pull concrete RPC metadata from a shared config module before shipping to production networks.
- **Error handling**: the provider presently logs and re-throws errors. If the UI needs richer
  feedback, add local state for error codes and expose helpers on the context.
- **Event tracking**: the old `useWalletEvents` hook was removed. Prefer React Query subscriptions
  or component-level effects tied to `account`/`chain` changes instead of recreating a global event
  bus unless requirements demand it.

## Migration Notes

- `Web3Provider.tsx`, `WalletProviderFactory.ts`, `api.internal.ts`, `optimize.ts`, and other legacy
  artifacts have been deleted. Update any external documentation or downstream consumers
  accordingly.
- `WALLET_CONFIG` is no longer exported; Thirdweb configuration should live in environment variables
  (see `.env.example`) or within the dedicated utility modules under `src/utils`.
