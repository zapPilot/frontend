/**
 * useTokenPricesQuery Usage Examples
 *
 * Demonstrates common patterns for using the token prices query hook
 * in various component scenarios.
 */

import {
  useTokenPricesQuery,
  useTokenPricesWithStates,
} from "../useTokenPricesQuery";

// =============================================================================
// BASIC USAGE
// =============================================================================

/**
 * Simple price display component
 */
export function BasicPriceDisplay() {
  const { priceMap, isLoading, isError } = useTokenPricesQuery({
    symbols: ["BTC", "ETH", "USDC"],
  });

  if (isLoading) return <div>Loading prices...</div>;
  if (isError) return <div>Failed to load prices</div>;

  return (
    <div>
      <div>Bitcoin: ${priceMap["BTC"]?.price?.toFixed(2)}</div>
      <div>Ethereum: ${priceMap["ETH"]?.price?.toFixed(2)}</div>
      <div>USDC: ${priceMap["USDC"]?.price?.toFixed(2)}</div>
    </div>
  );
}

// =============================================================================
// WITH STALENESS DETECTION
// =============================================================================

/**
 * Price display with stale data warning
 */
export function PriceDisplayWithStaleness() {
  const { priceMap, hasStaleData, isLoading } = useTokenPricesQuery({
    symbols: ["BTC", "ETH"],
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {hasStaleData && (
        <div className="warning">
          Price data may be outdated (older than 5 minutes)
        </div>
      )}
      {Object.entries(priceMap).map(([symbol, data]) => (
        <div key={symbol} className={data.isStale ? "stale" : "fresh"}>
          {symbol}: ${data.price?.toFixed(2)}
          {data.isStale && " (stale)"}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// CONDITIONAL FETCHING
// =============================================================================

/**
 * Fetch prices only when user is authenticated
 */
export function ConditionalPriceFetch({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const { priceMap, isLoading } = useTokenPricesQuery({
    symbols: ["BTC", "ETH", "USDC"],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  if (!isAuthenticated) {
    return <div>Please connect wallet to view prices</div>;
  }

  if (isLoading) return <div>Loading prices...</div>;

  return (
    <div>
      {Object.entries(priceMap).map(([symbol, data]) => (
        <div key={symbol}>
          {symbol}: ${data.price?.toFixed(2)}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// DYNAMIC SYMBOL LIST
// =============================================================================

/**
 * Fetch prices for dynamically selected tokens
 */
export function DynamicTokenPrices({ tokens }: { tokens: string[] }) {
  const { priceMap, symbolCount, successCount, isLoading } =
    useTokenPricesQuery({
      symbols: tokens,
    });

  if (isLoading) return <div>Loading {symbolCount} prices...</div>;

  return (
    <div>
      <div className="header">
        Loaded {successCount} of {symbolCount} prices
      </div>
      {tokens.map(symbol => {
        const data = priceMap[symbol.toUpperCase()];
        if (!data || !data.success) {
          return (
            <div key={symbol} className="error">
              {symbol}: Price unavailable
            </div>
          );
        }
        return (
          <div key={symbol}>
            {symbol}: ${data.price?.toFixed(2)}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// CUSTOM REFETCH INTERVAL
// =============================================================================

/**
 * Real-time price ticker with fast refresh
 */
export function RealtimePriceTicker() {
  const { priceMap, isFetching } = useTokenPricesQuery({
    symbols: ["BTC", "ETH"],
    refetchInterval: 30_000, // Refetch every 30 seconds
  });

  return (
    <div className="ticker">
      {isFetching && <span className="indicator">Updating...</span>}
      {Object.entries(priceMap).map(([symbol, data]) => (
        <div key={symbol} className="ticker-item">
          <span className="symbol">{symbol}</span>
          <span className="price">${data.price?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MANUAL REFETCH
// =============================================================================

/**
 * Price display with manual refresh button
 */
export function ManualRefreshPrices() {
  const { priceMap, refetch, isFetching } = useTokenPricesQuery({
    symbols: ["BTC", "ETH", "USDC"],
    refetchInterval: false, // Disable auto-refresh
  });

  return (
    <div>
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? "Refreshing..." : "Refresh Prices"}
      </button>
      <div className="prices">
        {Object.entries(priceMap).map(([symbol, data]) => (
          <div key={symbol}>
            {symbol}: ${data.price?.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// EXTENDED HOOK WITH COMPUTED STATES
// =============================================================================

/**
 * Advanced price display with computed helper states
 */
export function AdvancedPriceDisplay() {
  const {
    priceMap,
    allSuccessful,
    allFailed,
    averageAge,
    oldestDataAge,
    isLoading,
  } = useTokenPricesWithStates({
    symbols: ["BTC", "ETH", "USDC", "USDT"],
  });

  if (isLoading) return <div>Loading...</div>;

  if (allFailed) {
    return (
      <div className="error">All price fetches failed. Please try again.</div>
    );
  }

  const avgMinutes = Math.floor(averageAge / 60_000);
  const oldestMinutes = Math.floor(oldestDataAge / 60_000);

  return (
    <div>
      {allSuccessful && (
        <div className="success">All prices loaded successfully</div>
      )}
      <div className="metadata">
        <div>Average data age: {avgMinutes} minutes</div>
        <div>Oldest data: {oldestMinutes} minutes ago</div>
      </div>
      <div className="prices">
        {Object.entries(priceMap).map(([symbol, data]) => (
          <div key={symbol} className={data.success ? "success" : "failed"}>
            {symbol}: {data.success ? `$${data.price?.toFixed(2)}` : "Failed"}
            {data.fromCache && <span className="badge">Cached</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PORTFOLIO VALUE CALCULATION
// =============================================================================

/**
 * Calculate and display total portfolio value using prices
 */
export function PortfolioValue({
  holdings,
}: {
  holdings: Record<string, number>;
}) {
  const symbols = Object.keys(holdings);
  const { priceMap, allSuccessful, isLoading } = useTokenPricesWithStates({
    symbols,
  });

  if (isLoading) return <div>Calculating portfolio value...</div>;

  if (!allSuccessful) {
    return (
      <div className="warning">
        Some prices unavailable - value may be incomplete
      </div>
    );
  }

  const totalValue = symbols.reduce((total, symbol) => {
    const amount = holdings[symbol] || 0;
    const price = priceMap[symbol.toUpperCase()]?.price || 0;
    return total + amount * price;
  }, 0);

  return (
    <div className="portfolio-value">
      <h3>Portfolio Value</h3>
      <div className="total">
        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
      <div className="breakdown">
        {symbols.map(symbol => {
          const amount = holdings[symbol] || 0;
          const price = priceMap[symbol.toUpperCase()]?.price || 0;
          const value = amount * price;
          return (
            <div key={symbol} className="holding">
              <span>{symbol}:</span>
              <span>{amount.toFixed(4)}</span>
              <span>× ${price.toFixed(2)}</span>
              <span>= ${value.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Comprehensive error handling example
 */
export function RobustPriceDisplay() {
  const { priceMap, prices, isLoading, isError, error, failureCount } =
    useTokenPricesQuery({
      symbols: ["BTC", "ETH", "INVALID_TOKEN"],
    });

  if (isLoading) {
    return <div>Loading prices...</div>;
  }

  if (isError && error) {
    return (
      <div className="error">
        <h3>Error Loading Prices</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (failureCount > 0) {
    return (
      <div>
        <div className="warning">{failureCount} price(s) failed to load</div>
        <div className="prices">
          {prices?.map(priceData => (
            <div key={priceData.symbol}>
              {priceData.success ? (
                <span>
                  {priceData.symbol}: ${priceData.price?.toFixed(2)}
                </span>
              ) : (
                <span className="error">
                  {priceData.symbol}: {priceData.error || "Failed"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="prices">
      {Object.entries(priceMap).map(([symbol, data]) => (
        <div key={symbol}>
          {symbol}: ${data.price?.toFixed(2)}
        </div>
      ))}
    </div>
  );
}
