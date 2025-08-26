/**
 * ThirdWeb Provider Adapter
 *
 * Implements the WalletProvider interface for ThirdWeb SDK integration.
 * Provides standardized wallet connection, chain switching, and event handling
 * while wrapping ThirdWeb-specific functionality.
 */

import {
  useActiveAccount,
  useConnect,
  useDisconnect,
  useActiveWallet,
  useActiveWalletChain,
  useSwitchActiveWalletChain,
  useWalletBalance,
  useConnectedWallets,
} from "thirdweb/react";

import { createThirdwebClient } from "thirdweb";
import { WALLET_CONFIG, chainUtils } from "@/config/wallet";

import {
  WalletError,
  WalletErrorType,
  type WalletProvider,
  type WalletAccount,
  type Chain,
  type ProviderType,
} from "@/types/wallet";
import { debugLog } from "../../utils/debug";
import { useEffect, useMemo, useState } from "react";

/**
 * ThirdWeb Provider Adapter Class
 *
 * Implements the standardized WalletProvider interface using ThirdWeb SDK hooks.
 * This adapter enables the application to work with ThirdWeb while maintaining
 * provider independence through the abstraction layer.
 */
export class ThirdWebAdapter implements WalletProvider {
  public readonly type: ProviderType = "thirdweb";
  public readonly name: string = "ThirdWeb";
  public isInitialized: boolean = false;

  // Static instance management for bridge pattern
  private static activeInstance: ThirdWebAdapter | null = null;
  private static instanceCleanupCallbacks: Array<() => void> = [];

  // State management
  private _account: WalletAccount | null = null;
  private _chain: Chain | null = null;
  private _isConnecting: boolean = false;
  private _isDisconnecting: boolean = false;

  // Event callbacks
  private accountChangeCallbacks: Array<
    (account: WalletAccount | null) => void
  > = [];
  private chainChangeCallbacks: Array<(chain: Chain | null) => void> = [];
  private connectionChangeCallbacks: Array<(isConnected: boolean) => void> = [];

  // ThirdWeb hooks (to be injected)
  private hooks: ThirdWebHooks | null = null;

  constructor() {
    this.isInitialized = true;
  }

  /**
   * Get or create the active ThirdWebAdapter instance
   * This ensures only one instance exists at a time
   */
  public static getActiveInstance(): ThirdWebAdapter {
    if (!ThirdWebAdapter.activeInstance) {
      ThirdWebAdapter.activeInstance = new ThirdWebAdapter();
    }
    return ThirdWebAdapter.activeInstance;
  }

  /**
   * Set the active instance (used by React hook)
   * This ensures the factory returns the same instance that gets hooks injected
   */
  public static setActiveInstance(instance: ThirdWebAdapter): void {
    // Clean up previous instance if exists
    if (
      ThirdWebAdapter.activeInstance &&
      ThirdWebAdapter.activeInstance !== instance
    ) {
      ThirdWebAdapter.cleanupInstance();
    }
    ThirdWebAdapter.activeInstance = instance;
  }

  /**
   * Register cleanup callback for instance lifecycle management
   */
  public static registerCleanupCallback(callback: () => void): void {
    ThirdWebAdapter.instanceCleanupCallbacks.push(callback);
  }

  /**
   * Clean up the active instance
   */
  public static cleanupInstance(): void {
    if (ThirdWebAdapter.activeInstance) {
      // Execute cleanup callbacks
      ThirdWebAdapter.instanceCleanupCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          debugLog.error("Error in ThirdWebAdapter cleanup callback:", error);
        }
      });

      // Clear callbacks array
      ThirdWebAdapter.instanceCleanupCallbacks = [];

      // Clear active instance
      ThirdWebAdapter.activeInstance = null;
    }
  }

  /**
   * Reset static state (useful for testing)
   */
  public static reset(): void {
    ThirdWebAdapter.cleanupInstance();
  }

  /**
   * Inject ThirdWeb hooks for React integration
   * This method should be called from a React component context
   */
  public injectHooks(hooks: ThirdWebHooks): void {
    this.hooks = hooks;
    this.setupEventListeners();
  }

  /**
   * Public method to update account state (called by React hook)
   */
  public updateAccount(address: string | undefined): void {
    this.updateAccountInternal(address);
  }

  /**
   * Public method to update chain state (called by React hook)
   */
  public updateChain(network: { chainId?: number } | undefined): void {
    this.updateChainInternal(network);
  }

  // Account management
  public get account(): WalletAccount | null {
    return this._account;
  }

  public get isConnecting(): boolean {
    return this._isConnecting;
  }

  public get isDisconnecting(): boolean {
    return this._isDisconnecting;
  }

  public async connect(): Promise<void> {
    if (!this.hooks) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        "ThirdWeb hooks not initialized. Call injectHooks() first."
      );
    }

    try {
      this._isConnecting = true;
      this.notifyConnectionChange(false); // Still connecting

      // For v5, we need to pass a wallet instance
      // This is a basic implementation - in a real app, you'd want to
      // handle wallet selection properly
      if (this.hooks.connectedWallets.length > 0) {
        await this.hooks.connect(this.hooks.connectedWallets[0]);
      } else {
        throw new WalletError(
          WalletErrorType.WALLET_NOT_FOUND,
          "No wallet available to connect"
        );
      }

      // Connection success will be handled by the event listener
    } catch (error) {
      this._isConnecting = false;
      throw this.handleError(error, "Failed to connect wallet");
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.hooks) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        "ThirdWeb hooks not initialized"
      );
    }

    try {
      this._isDisconnecting = true;

      await this.hooks.disconnect();

      // Clear local state
      this._account = null;
      this._isDisconnecting = false;

      // Notify listeners
      this.notifyAccountChange(null);
      this.notifyConnectionChange(false);
    } catch (error) {
      this._isDisconnecting = false;
      throw this.handleError(error, "Failed to disconnect wallet");
    }
  }

  // Chain management
  public get chain(): Chain | null {
    return this._chain;
  }

  public async switchChain(chainId: number): Promise<void> {
    if (!this.hooks) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        "ThirdWeb hooks not initialized"
      );
    }

    // Check if chain is supported
    if (!chainUtils.isChainSupported(chainId)) {
      throw new WalletError(
        WalletErrorType.CHAIN_NOT_SUPPORTED,
        `Chain ${chainId} is not supported`
      );
    }

    try {
      // For v5, we need to pass a chain object
      // Create a basic chain object - in a real app, you'd import the proper chain
      const chainToSwitch = {
        id: chainId,
        name: chainUtils.getChainName(chainId),
        rpc: chainUtils.getChainById(chainId)?.rpcUrls.default.http[0] || "",
        nativeCurrency: {
          name: chainUtils.getChainSymbol(chainId),
          symbol: chainUtils.getChainSymbol(chainId),
          decimals: 18,
        },
      };

      await this.hooks.switchChain(chainToSwitch);

      // Chain change will be handled by the event listener
    } catch (error) {
      throw this.handleError(error, `Failed to switch to chain ${chainId}`);
    }
  }

  public getSupportedChains(): Chain[] {
    return chainUtils.getSupportedChains();
  }

  // Event subscription
  public onAccountChanged(
    callback: (account: WalletAccount | null) => void
  ): void {
    this.accountChangeCallbacks.push(callback);
  }

  public onChainChanged(callback: (chain: Chain | null) => void): void {
    this.chainChangeCallbacks.push(callback);
  }

  public onConnectionChanged(callback: (isConnected: boolean) => void): void {
    this.connectionChangeCallbacks.push(callback);
  }

  // Provider-specific methods
  public getProvider(): unknown {
    return this.hooks?.wallet || null;
  }

  public async signMessage(message: string): Promise<string> {
    if (!this.hooks?.account) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        "No account available"
      );
    }

    try {
      // In v5, signing is done through the account
      return await this.hooks.account.signMessage({ message });
    } catch (error) {
      throw this.handleError(error, "Failed to sign message");
    }
  }

  public async signTypedData(
    domain: Record<string, unknown>,
    types: Record<string, unknown>,
    value: Record<string, unknown>
  ): Promise<string> {
    if (!this.hooks?.account) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        "No account available"
      );
    }

    try {
      // In v5, typed data signing is done through the account
      return await this.hooks.account.signTypedData({
        domain,
        types,
        primaryType: Object.keys(types)[0] || "",
        message: value,
      });
    } catch (error) {
      throw this.handleError(error, "Failed to sign typed data");
    }
  }

  // Private methods
  private setupEventListeners(): void {
    if (!this.hooks) return;

    // Event listeners are now handled by the React hook
    // which calls updateAccount and updateChain directly
    // This ensures proper React lifecycle integration
  }

  private updateAccountInternal(address: string | undefined): void {
    if (address) {
      const newAccount: WalletAccount = {
        address,
        isConnected: true,
        balance: this.hooks?.balance?.data?.displayValue || "0",
      };

      this._account = newAccount;
      this._isConnecting = false;

      this.notifyAccountChange(newAccount);
      this.notifyConnectionChange(true);
    } else {
      this._account = null;
      this.notifyAccountChange(null);
      this.notifyConnectionChange(false);
    }
  }

  private updateChainInternal(network: { chainId?: number } | undefined): void {
    if (network?.chainId) {
      const chainInfo = chainUtils.getChainById(network.chainId);
      this._chain = chainInfo || {
        id: network.chainId,
        name: `Chain ${network.chainId}`,
        symbol: "UNKNOWN",
        isSupported: false,
      };
    } else {
      this._chain = null;
    }

    this.notifyChainChange(this._chain);
  }

  private notifyAccountChange(account: WalletAccount | null): void {
    this.accountChangeCallbacks.forEach(callback => {
      try {
        callback(account);
      } catch (error) {
        debugLog.error("Error in account change callback:", error);
      }
    });
  }

  private notifyChainChange(chain: Chain | null): void {
    this.chainChangeCallbacks.forEach(callback => {
      try {
        callback(chain);
      } catch (error) {
        debugLog.error("Error in chain change callback:", error);
      }
    });
  }

  private notifyConnectionChange(isConnected: boolean): void {
    this.connectionChangeCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        debugLog.error("Error in connection change callback:", error);
      }
    });
  }

  private handleError(error: unknown, contextMessage: string): WalletError {
    debugLog.error(`ThirdWeb Adapter Error: ${contextMessage}`, error);

    if (error instanceof Error) {
      // Map common ThirdWeb errors to standardized error types
      if (
        error.message.includes("user rejected") ||
        error.message.includes("User denied")
      ) {
        return new WalletError(
          WalletErrorType.USER_REJECTED,
          "User rejected the request",
          error
        );
      }

      if (
        error.message.includes("network") ||
        error.message.includes("chain")
      ) {
        return new WalletError(
          WalletErrorType.NETWORK_ERROR,
          `Network error: ${error.message}`,
          error
        );
      }

      if (
        error.message.includes("wallet") ||
        error.message.includes("provider")
      ) {
        return new WalletError(
          WalletErrorType.WALLET_NOT_FOUND,
          `Wallet error: ${error.message}`,
          error
        );
      }
    }

    return new WalletError(
      WalletErrorType.UNKNOWN_ERROR,
      `${contextMessage}: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * ThirdWeb Hooks Interface
 *
 * Defines the interface for ThirdWeb React hooks that will be injected
 * into the adapter for React context integration.
 */
export interface ThirdWebHooks {
  // Core hooks
  account: ReturnType<typeof useActiveAccount>;
  wallet: ReturnType<typeof useActiveWallet>;
  connect: (wallet: any) => Promise<void>;
  disconnect: () => Promise<void>;
  chain: ReturnType<typeof useActiveWalletChain>;
  switchChain: (chain: any) => Promise<void>;
  balance: ReturnType<typeof useWalletBalance>;
  connectedWallets: ReturnType<typeof useConnectedWallets>;
}

/**
 * React Hook for ThirdWeb Adapter
 *
 * This hook provides a React-integrated ThirdWeb adapter that automatically
 * syncs with ThirdWeb's React hooks and provides the standardized interface.
 * Uses static instance management to ensure proper bridge with factory pattern.
 */
export function useThirdWebAdapter(): ThirdWebAdapter {
  const [adapter] = useState(() => {
    // Get existing instance or create new one
    const instance = ThirdWebAdapter.getActiveInstance();
    // Register this instance as the active one
    ThirdWebAdapter.setActiveInstance(instance);
    return instance;
  });

  // Create ThirdWeb client
  const client = useMemo(() => {
    return createThirdwebClient({
      clientId: WALLET_CONFIG.providers.thirdweb?.clientId || "",
    });
  }, []);

  // ThirdWeb v5 hooks
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const balance = useWalletBalance({
    chain,
    address: account?.address,
    client,
  });
  const connectedWallets = useConnectedWallets();

  // Create hooks object with proper connect/disconnect handling
  const hooks = useMemo(
    (): ThirdWebHooks => ({
      account,
      wallet,
      connect: async (walletToConnect: any) => {
        if (connect) {
          try {
            await connect(walletToConnect);
          } catch (error) {
            debugLog.error("ThirdWeb connect error:", error);
            throw error;
          }
        }
      },
      disconnect: async () => {
        if (disconnect && wallet) {
          try {
            await disconnect(wallet);
          } catch (error) {
            debugLog.error("ThirdWeb disconnect error:", error);
            throw error;
          }
        }
      },
      chain,
      switchChain: async (chainToSwitch: any) => {
        if (switchChain) {
          try {
            await switchChain(chainToSwitch);
          } catch (error) {
            debugLog.error("ThirdWeb switchChain error:", error);
            throw error;
          }
        }
      },
      balance,
      connectedWallets,
    }),
    [
      account,
      wallet,
      connect,
      disconnect,
      chain,
      switchChain,
      balance,
      connectedWallets,
    ]
  );

  // Inject hooks and setup listeners
  useEffect(() => {
    adapter.injectHooks(hooks);
  }, [adapter, hooks]);

  // Sync account changes
  useEffect(() => {
    adapter.updateAccount(account?.address);
  }, [adapter, account]);

  // Sync chain changes
  useEffect(() => {
    adapter.updateChain(chain ? { chainId: chain.id } : undefined);
  }, [adapter, chain]);

  // Register cleanup callback for component unmount
  useEffect(() => {
    const cleanup = () => {
      // Clear hooks reference when component unmounts
      adapter.injectHooks({
        account: null,
        wallet: null,
        connect: async () => {},
        disconnect: async () => {},
        chain: null,
        switchChain: async () => {},
        balance: { data: null },
        connectedWallets: [],
      } as any);
    };

    ThirdWebAdapter.registerCleanupCallback(cleanup);

    return cleanup;
  }, [adapter]);

  return adapter;
}

/**
 * Export error types for convenience
 */
export { WalletError, WalletErrorType } from "@/types/wallet";

/**
 * Default export
 */
export default ThirdWebAdapter;
