# Web3 Integration with wagmi + viem

## wagmi Setup

### Configuration

```typescript
// src/config/wagmi.ts
import { http, createConfig } from "wagmi";
import { arbitrum, base, optimism } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  ssr: true,
  chains: [arbitrum, base, optimism],
  connectors: [injected()],
  transports: {
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    [base.id]: http("https://mainnet.base.org"),
    [optimism.id]: http("https://mainnet.optimism.io"),
  },
});
```

### Provider Configuration

```typescript
// src/providers/SimpleWeb3Provider.tsx
'use client';

import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/config/wagmi';

export function SimpleWeb3Provider({ children }: { children: React.ReactNode }) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
}
```

### Wallet Provider

The project uses a unified WalletProvider that wraps wagmi hooks:

```typescript
// src/providers/WalletProvider.tsx
"use client";

import { createContext, useContext } from "react";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useSignMessage,
} from "wagmi";
import { formatUnits } from "viem";

interface WalletContextValue {
  account: { address: string; isConnected: boolean; balance?: string } | null;
  chain: { id: number; name: string; symbol: string } | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  error: { message: string; code?: string } | null;
  clearError: () => void;
  connectedWallets: { address: string; isActive: boolean }[];
  switchActiveWallet: (address: string) => Promise<void>;
  hasMultipleWallets: boolean;
}
```

## Key wagmi Hooks

| Hook               | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `useAccount()`     | Get connected address, chain, connection status |
| `useConnect()`     | Connect to injected wallet                      |
| `useDisconnect()`  | Disconnect wallet                               |
| `useBalance()`     | Get native token balance                        |
| `useSwitchChain()` | Switch to a different chain                     |
| `useSignMessage()` | Sign a message with connected wallet            |

## Auto-Reconnect

wagmi's `WagmiProvider` automatically calls `reconnect()` on mount (default behavior). The
`ssr: true` config option prevents hydration mismatches in Next.js App Router.

## Wallet Connection

### Connect Button

```typescript
import { useAccount, useConnect } from 'wagmi';

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  const handleConnect = () => {
    const connector = connectors[0]; // injected (MetaMask/Rabby)
    if (connector) connect({ connector });
  };

  if (isConnected && address) {
    return <span>{address.slice(0, 6)}...{address.slice(-4)}</span>;
  }

  return (
    <button onClick={handleConnect} disabled={isPending}>
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
```

## Best Practices

1. **Use `useWalletProvider()` hook** — Don't import wagmi hooks directly in components; go through
   the abstraction layer
2. **Handle Rejections** — User can reject connections/transactions; handle gracefully
3. **Chain Validation** — Ensure user is on correct chain before transactions
4. **Error Messages** — Provide clear, user-friendly error messages via the error state
5. **Loading States** — Show connection/transaction progress
6. **Security** — Never expose private keys or sensitive data
7. **Address Validation** — Always validate Ethereum addresses
