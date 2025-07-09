# Phase 2 - Provider Abstraction Layer

This directory contains the implementation of Phase 2 of the wallet abstraction architecture. The
Provider Abstraction Layer enables dynamic provider switching and provides a standardized interface
for wallet operations across different Web3 providers.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Web3Provider (Entry Point)                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                ThirdwebProvider                             │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │              WalletProvider                             │ │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │ │ │
│  │  │  │           WalletProviderFactory                     │ │ │ │
│  │  │  │  ┌─────────────────────────────────────────────────┐ │ │ │ │
│  │  │  │  │         Provider Adapters                       │ │ │ │ │
│  │  │  │  │  ┌─────────────────────────────────────────────┐ │ │ │ │ │
│  │  │  │  │  │  ThirdWebAdapter  │  RainbowKit  │  ZeroDev │ │ │ │ │ │
│  │  │  │  │  └─────────────────────────────────────────────┘ │ │ │ │ │
│  │  │  │  └─────────────────────────────────────────────────┘ │ │ │ │
│  │  │  └─────────────────────────────────────────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Web3Provider (`Web3Provider.tsx`)

The main entry point that provides both ThirdWeb SDK initialization and the wallet abstraction
layer.

**Features:**

- Multi-layered provider setup
- Backward compatibility with existing code
- Configurable provider selection
- Error handling integration

**Usage:**

```tsx
import { Web3Provider } from "@/providers";

function App() {
  return (
    <Web3Provider
      defaultProvider="thirdweb"
      enableDebug={true}
      onError={error => console.error("Wallet error:", error)}
    >
      <YourAppComponents />
    </Web3Provider>
  );
}
```

### 2. WalletContext (`WalletContext.tsx`)

Provides centralized wallet state management with event system and error handling.

**Features:**

- Provider-agnostic state management
- Event system for cross-component communication
- Comprehensive error handling
- Dynamic provider switching
- Lifecycle management

**Usage:**

```tsx
import { useWalletContext, useWalletConnection } from "@/providers";

function WalletComponent() {
  const { account, connect, disconnect, switchProvider } = useWalletContext();
  // or use the simplified hook
  const { account, connect, disconnect } = useWalletConnection();

  return (
    <div>
      {account ? (
        <button onClick={disconnect}>Disconnect {account.address}</button>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### 3. WalletProviderFactory (`WalletProviderFactory.ts`)

Factory class for creating and managing different wallet provider implementations.

**Features:**

- Type-safe provider creation
- Provider lifecycle management
- Runtime provider switching
- Provider registry system
- Singleton pattern with proper cleanup

**Usage:**

```tsx
import { getProviderFactory } from "@/providers";

// Get factory instance
const factory = getProviderFactory();

// Switch provider
await factory.switchProvider("rainbowkit");

// Get available providers
const providers = factory.getAvailableProviders();
```

### 4. ThirdWebAdapter (`adapters/ThirdWebAdapter.ts`)

ThirdWeb-specific implementation of the WalletProvider interface.

**Features:**

- Standardized ThirdWeb integration
- React hooks integration
- Event handling
- Error mapping
- Message signing support

**Usage:**

```tsx
import { useThirdWebAdapter } from "@/providers";

function ThirdWebComponent() {
  const adapter = useThirdWebAdapter();

  useEffect(() => {
    adapter.onAccountChanged(account => {
      console.log("Account changed:", account);
    });
  }, [adapter]);

  return <div>ThirdWeb integration</div>;
}
```

## Key Features

### 1. Provider Switching

Switch between different wallet providers at runtime without changing application code:

```tsx
const { switchProvider } = useWalletContext();

// Switch to RainbowKit
await switchProvider("rainbowkit");

// Switch to ThirdWeb
await switchProvider("thirdweb");
```

### 2. Event System

Subscribe to wallet events across components:

```tsx
const { addEventListener } = useWalletContext();

useEffect(() => {
  const unsubscribe = addEventListener("accountChanged", event => {
    console.log("Account changed:", event.payload);
  });

  return unsubscribe;
}, [addEventListener]);
```

### 3. Error Handling

Comprehensive error handling with standardized error types:

```tsx
const { error, clearError } = useWalletConnection();

if (error) {
  switch (error.type) {
    case WalletErrorType.USER_REJECTED:
      console.log("User rejected the request");
      break;
    case WalletErrorType.CHAIN_NOT_SUPPORTED:
      console.log("Chain not supported");
      break;
    // ... handle other error types
  }
}
```

### 4. Chain Management

Standardized chain switching and validation:

```tsx
const { chain, switchChain, isChainSupported } = useWalletConnection();

// Check if chain is supported
if (isChainSupported(42161)) {
  await switchChain(42161); // Switch to Arbitrum
}
```

## Configuration

Configure providers in `@/config/wallet.ts`:

```typescript
export const WALLET_CONFIG: WalletConfig = {
  defaultProvider: "thirdweb",
  providers: {
    thirdweb: {
      clientId: "your-client-id",
      supportedWallets: ["metamask", "coinbase", "walletConnect"],
      activeChain: CHAIN_IDS.ARBITRUM,
    },
    rainbowkit: {
      projectId: "your-project-id",
      appName: "Your App Name",
    },
  },
};
```

## Extending with New Providers

To add a new provider (e.g., ZeroDev):

1. **Create Adapter** (`adapters/ZeroDevAdapter.ts`):

```typescript
export class ZeroDevAdapter implements WalletProvider {
  public readonly type: ProviderType = "zerodev";
  public readonly name: string = "ZeroDev";

  // Implement WalletProvider interface
  async connect(): Promise<void> {
    // ZeroDev connection logic
  }

  // ... other methods
}
```

2. **Register Provider** in `WalletProviderFactory.ts`:

```typescript
this.providerRegistry.set("zerodev", () => new ZeroDevAdapter());
```

3. **Update Configuration** in `@/config/wallet.ts`:

```typescript
export const WALLET_CONFIG: WalletConfig = {
  providers: {
    // ... existing providers
    zerodev: {
      projectId: "your-zerodev-project-id",
      // ... other config
    },
  },
};
```

4. **Update Types** in `@/types/wallet.ts`:

```typescript
export type ProviderType =
  | "thirdweb"
  | "rainbowkit"
  | "wagmi"
  | "walletconnect"
  | "zerodev"
  | "custom";
```

## Testing

Test the implementation with different providers:

```tsx
describe("Provider Abstraction Layer", () => {
  it("should switch providers", async () => {
    const { switchProvider } = useWalletContext();

    await switchProvider("rainbowkit");
    expect(providerType).toBe("rainbowkit");
  });

  it("should handle errors", async () => {
    const { connect, error } = useWalletConnection();

    // Mock error scenario
    await expect(connect()).rejects.toThrow();
    expect(error).toBeDefined();
  });
});
```

## Backward Compatibility

The implementation maintains backward compatibility:

- Existing `useWalletConnection()` calls continue to work
- Same interface for wallet operations
- Gradual migration path
- Legacy exports available

## Performance Considerations

- Lazy provider initialization
- Efficient event handling
- Minimal re-renders
- Proper cleanup on unmount
- Singleton factory pattern

## Security Considerations

- Secure provider switching
- Error boundary integration
- Input validation
- Safe defaults
- Proper cleanup of sensitive data

## Future Enhancements

- Account abstraction integration
- Multi-wallet support
- Advanced error recovery
- Provider health monitoring
- Analytics integration

## Troubleshooting

### Common Issues

1. **Provider not initialized**: Ensure Web3Provider wraps your app
2. **Hook errors**: Make sure to use hooks inside WalletProvider
3. **Type errors**: Check that provider types are properly imported
4. **Connection failures**: Verify provider configuration

### Debug Mode

Enable debug logging:

```tsx
<Web3Provider enableDebug={true}>
  <App />
</Web3Provider>
```

Check browser console for detailed logs.

## Migration Guide

### From Legacy Implementation

1. **Update imports**:

```typescript
// Old
import { useWalletConnection } from "@/hooks/useWalletConnection";

// New (works the same way)
import { useWalletConnection } from "@/providers";
```

2. **Add provider wrapping** (if not already done):

```tsx
// Wrap your app with Web3Provider
<Web3Provider>
  <App />
</Web3Provider>
```

3. **Optional: Use new features**:

```tsx
// Access advanced features
const { switchProvider, addEventListener } = useWalletContext();
```

## API Reference

See TypeScript definitions in `@/types/wallet.ts` for complete API documentation.

## Contributing

When adding new providers or features:

1. Follow the existing patterns
2. Add comprehensive tests
3. Update documentation
4. Maintain backward compatibility
5. Consider performance implications
