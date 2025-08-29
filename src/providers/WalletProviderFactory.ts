/**
 * Wallet Provider Factory
 *
 * Factory class for creating and managing different wallet provider implementations.
 * Supports provider switching at runtime with proper initialization and cleanup.
 * Provides type-safe provider creation and lifecycle management.
 */

import {
  WalletError,
  WalletErrorType,
  type WalletProvider,
  type ProviderType,
  type WalletConfig,
} from "@/types/wallet";

import { WALLET_CONFIG, providerUtils } from "@/config/wallet";
import { ThirdWebAdapter } from "./adapters/ThirdWebAdapter";
import { walletLogger } from "@/utils/logger";

/**
 * Provider Factory Configuration
 */
interface ProviderFactoryConfig {
  /** Default provider type to use */
  defaultProvider: ProviderType;
  /** Custom provider configurations */
  providerConfigs?: Partial<WalletConfig["providers"]>;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Provider Factory Class
 *
 * Manages the creation, initialization, and lifecycle of wallet providers.
 * Supports dynamic provider switching and proper cleanup.
 */
export class WalletProviderFactory {
  private static instance: WalletProviderFactory | null = null;
  private activeProvider: WalletProvider | null = null;
  private debug: boolean;

  // Provider registry
  private providerRegistry: Map<ProviderType, () => WalletProvider> = new Map();

  // Event listeners for provider changes
  private providerChangeListeners: Array<
    (provider: WalletProvider | null) => void
  > = [];

  private constructor(config: ProviderFactoryConfig) {
    this.debug = config.debug || false;

    this.initializeProviderRegistry();
    this.log("WalletProviderFactory initialized", { config });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(
    config?: ProviderFactoryConfig
  ): WalletProviderFactory {
    if (!WalletProviderFactory.instance) {
      const defaultConfig: ProviderFactoryConfig = {
        defaultProvider: WALLET_CONFIG.defaultProvider,
        debug: WALLET_CONFIG.environment.isDevelopment,
      };

      WalletProviderFactory.instance = new WalletProviderFactory(
        config ? { ...defaultConfig, ...config } : defaultConfig
      );
    }

    return WalletProviderFactory.instance;
  }

  /**
   * Initialize provider registry with available providers
   */
  private initializeProviderRegistry(): void {
    // Register ThirdWeb provider - use static instance to ensure proper hook injection
    this.providerRegistry.set("thirdweb", () =>
      ThirdWebAdapter.getActiveInstance()
    );

    // Register RainbowKit provider (placeholder for future implementation)
    this.providerRegistry.set("rainbowkit", () => {
      throw new Error("RainbowKit provider not implemented yet");
    });

    // Register Wagmi provider (placeholder for future implementation)
    this.providerRegistry.set("wagmi", () => {
      throw new Error("Wagmi provider not implemented yet");
    });

    // Register WalletConnect provider (placeholder for future implementation)
    this.providerRegistry.set("walletconnect", () => {
      throw new Error("WalletConnect provider not implemented yet");
    });

    this.log("Provider registry initialized", {
      availableProviders: Array.from(this.providerRegistry.keys()),
    });
  }

  /**
   * Create a new provider instance
   */
  public createProvider(providerType: ProviderType): WalletProvider {
    this.log("Creating provider", { providerType });

    // Check if provider is registered
    const providerFactory = this.providerRegistry.get(providerType);
    if (!providerFactory) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        `Provider type '${providerType}' is not registered`
      );
    }

    // Check if provider is configured
    if (!providerUtils.isProviderConfigured(providerType)) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        `Provider type '${providerType}' is not properly configured`
      );
    }

    try {
      const provider = providerFactory();
      this.log("Provider created successfully", {
        providerType,
        provider: provider.name,
      });
      return provider;
    } catch (error) {
      this.log("Failed to create provider", { providerType, error });
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        `Failed to create provider '${providerType}': ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the currently active provider
   */
  public getActiveProvider(): WalletProvider | null {
    return this.activeProvider;
  }

  /**
   * Set the active provider
   */
  public async setActiveProvider(
    providerType: ProviderType
  ): Promise<WalletProvider> {
    this.log("Setting active provider", { providerType });

    // If the same provider is already active, return it
    if (this.activeProvider && this.activeProvider.type === providerType) {
      this.log("Provider already active", { providerType });
      return this.activeProvider;
    }

    // Clean up the current provider
    if (this.activeProvider) {
      await this.cleanupProvider(this.activeProvider);
    }

    // Create and initialize the new provider
    const newProvider = this.createProvider(providerType);

    // Validate provider initialization
    if (!newProvider.isInitialized) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        `Provider '${providerType}' failed to initialize`
      );
    }

    // Set as active provider
    this.activeProvider = newProvider;

    // Notify listeners
    this.notifyProviderChange(newProvider);

    this.log("Active provider set successfully", {
      providerType,
      providerName: newProvider.name,
    });

    return newProvider;
  }

  /**
   * Switch to a different provider
   */
  public async switchProvider(
    providerType: ProviderType
  ): Promise<WalletProvider> {
    this.log("Switching provider", {
      from: this.activeProvider?.type,
      to: providerType,
    });

    // Store current connection state
    const wasConnected = this.activeProvider?.account?.isConnected || false;
    const currentChain = this.activeProvider?.chain;

    // Switch to the new provider
    const newProvider = await this.setActiveProvider(providerType);

    // Optionally attempt to restore connection state
    if (wasConnected && currentChain) {
      try {
        await newProvider.connect();
        if (newProvider.chain?.id !== currentChain.id) {
          await newProvider.switchChain(currentChain.id);
        }
      } catch (error) {
        this.log("Failed to restore connection state after provider switch", {
          error,
        });
        // Don't throw here - provider switch succeeded, connection restoration failed
      }
    }

    return newProvider;
  }

  /**
   * Get available provider types
   */
  public getAvailableProviders(): ProviderType[] {
    return providerUtils.getAvailableProviders();
  }

  /**
   * Check if a provider type is available
   */
  public isProviderAvailable(providerType: ProviderType): boolean {
    return (
      this.providerRegistry.has(providerType) &&
      providerUtils.isProviderConfigured(providerType)
    );
  }

  /**
   * Register a custom provider
   */
  public registerProvider(
    providerType: ProviderType,
    providerFactory: () => WalletProvider
  ): void {
    this.log("Registering custom provider", { providerType });

    this.providerRegistry.set(providerType, providerFactory);

    this.log("Custom provider registered", {
      providerType,
      totalProviders: this.providerRegistry.size,
    });
  }

  /**
   * Unregister a provider
   */
  public unregisterProvider(providerType: ProviderType): void {
    this.log("Unregistering provider", { providerType });

    // If this is the active provider, clean it up first
    if (this.activeProvider?.type === providerType) {
      this.cleanupProvider(this.activeProvider);
      this.activeProvider = null;
      this.notifyProviderChange(null);
    }

    this.providerRegistry.delete(providerType);

    this.log("Provider unregistered", {
      providerType,
      totalProviders: this.providerRegistry.size,
    });
  }

  /**
   * Subscribe to provider changes
   */
  public onProviderChange(
    listener: (provider: WalletProvider | null) => void
  ): () => void {
    this.providerChangeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.providerChangeListeners.indexOf(listener);
      if (index > -1) {
        this.providerChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Clean up all resources
   */
  public async cleanup(): Promise<void> {
    this.log("Cleaning up factory");

    if (this.activeProvider) {
      await this.cleanupProvider(this.activeProvider);
      this.activeProvider = null;
    }

    this.providerChangeListeners = [];
    this.providerRegistry.clear();

    this.log("Factory cleanup completed");
  }

  /**
   * Reset factory to initial state
   */
  public static reset(): void {
    if (WalletProviderFactory.instance) {
      WalletProviderFactory.instance.cleanup();
      WalletProviderFactory.instance = null;
    }
  }

  // Private methods

  /**
   * Clean up a provider instance
   */
  private async cleanupProvider(provider: WalletProvider): Promise<void> {
    try {
      this.log("Cleaning up provider", {
        providerType: provider.type,
        providerName: provider.name,
      });

      // Disconnect if connected
      if (provider.account?.isConnected) {
        await provider.disconnect();
      }

      // Additional cleanup if provider supports it
      if ("cleanup" in provider && typeof provider.cleanup === "function") {
        await provider.cleanup();
      }

      this.log("Provider cleanup completed", { providerType: provider.type });
    } catch (error) {
      this.log("Error during provider cleanup", {
        providerType: provider.type,
        error,
      });
      // Don't throw - cleanup should be best effort
    }
  }

  /**
   * Notify listeners of provider changes
   */
  private notifyProviderChange(provider: WalletProvider | null): void {
    this.providerChangeListeners.forEach(listener => {
      try {
        listener(provider);
      } catch (error) {
        walletLogger.error("Error in provider change listener", error);
      }
    });
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: unknown): void {
    if (this.debug) {
      walletLogger.debug(message, data);
    }
  }
}

/**
 * Factory Configuration Builder
 *
 * Fluent interface for building factory configurations
 */
export class FactoryConfigBuilder {
  private config: ProviderFactoryConfig;

  constructor() {
    this.config = {
      defaultProvider: WALLET_CONFIG.defaultProvider,
    };
  }

  public withDefaultProvider(provider: ProviderType): this {
    this.config.defaultProvider = provider;
    return this;
  }

  public withProviderConfigs(
    configs: Partial<WalletConfig["providers"]>
  ): this {
    this.config.providerConfigs = configs;
    return this;
  }

  public withDebug(debug: boolean): this {
    this.config.debug = debug;
    return this;
  }

  public build(): ProviderFactoryConfig {
    return { ...this.config };
  }
}

/**
 * Convenience functions
 */

/**
 * Create a new provider factory instance
 */
export function createProviderFactory(
  config?: ProviderFactoryConfig
): WalletProviderFactory {
  return WalletProviderFactory.getInstance(config);
}

/**
 * Get the global provider factory instance
 */
export function getProviderFactory(): WalletProviderFactory {
  return WalletProviderFactory.getInstance();
}

/**
 * Export error types for convenience
 */
export { WalletError, WalletErrorType } from "@/types/wallet";

/**
 * Default export
 */
export default WalletProviderFactory;
