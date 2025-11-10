# Code Cleanup Analysis Report - 2025-11-06

## 1. ERROR CLASS DUPLICATION

### Summary

Found 5 error classes across different locations with overlapping responsibilities and similar
structures. Primary issue: **AccountServiceError** and **APIError** are simple duplicates that
should be consolidated.

### Detailed Findings

#### A. Duplicate Error Classes (PRIORITY: HIGH)

**AccountServiceError** (src/services/accountService.ts:30-40)

```typescript
export class AccountServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: AccountServiceErrorDetails
  ) {
    super(message);
    this.name = "AccountServiceError";
  }
}
```

- **Usage**: Only 2 references (accountService internal + userService check)
- **Can be replaced by**: APIError or BackendServiceError

**APIError** (src/lib/http-utils.ts:28-38)

```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
  }
}
```

- **Usage**: 4 references (internal to http-utils, 1 export usage)
- **Issue**: Simple duplicate structure vs AccountServiceError
- **Difference**: Details type varies (AccountServiceErrorDetails vs Record<string, unknown>)

#### B. Hierarchical Error Classes (PRIORITY: MEDIUM)

**BaseServiceError** (src/lib/base-error.ts:73-155)

- **Features**: Full-featured error with timestamp, source, severity, JSON serialization
- **Methods**: toJSON(), getUserMessage(), isRetryable(), isClientError(), isServerError()
- **Purpose**: Base class for service-specific errors

**BackendServiceError** (src/lib/base-error.ts:274-295)

- **Extends**: BaseServiceError
- **Purpose**: Backend-specific error handling with custom message translation
- **Override**: getUserMessage() with getBackendErrorMessage()

**IntentServiceError** (src/lib/base-error.ts:302-308)

- **Extends**: BaseServiceError
- **Purpose**: Intent service-specific error handling

#### C. Separate Error Class

**StrategiesApiError** (src/types/strategies.ts:220-229)

```typescript
export class StrategiesApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number // Note: named differently than 'status'
  ) {
    super(message);
    this.name = "StrategiesApiError";
  }
}
```

- **Usage**: 6 references in useStrategiesQuery.ts
- **Issue**: Property named `statusCode` instead of `status` (inconsistent naming)
- **Can be replaced by**: BackendServiceError or standardized API error

### Consolidation Recommendations

**Option 1 (Recommended)**: Use BaseServiceError family

- Replace AccountServiceError with APIError or BackendServiceError
- Convert StrategiesApiError to use BackendServiceError
- Keep APIError for backward compatibility (HTTP layer)
- Strategy: Migrate gradually, deprecate simple error classes

**Option 2**: Standardize on APIError + enhance

- Enhance APIError to include features from BaseServiceError
- Add optional severity, source, timestamp fields
- Update BackendServiceError to extend from enhanced APIError

**Option 3**: Consolidate into single error factory

- Create error factory function
- Return type: BaseServiceError (parent class)
- Reduces class duplication significantly

---

## 2. STRING NORMALIZATION FUNCTIONS

### Summary

Found 7 normalization functions with overlapping functionality. Key issue:
**normalizeForComparison()** and **normalizeAddress()** have near-identical implementations.

### Detailed Findings

#### A. Overlapping Functions

**normalizeAddress** (src/lib/stringUtils.ts:129-131)

```typescript
export function normalizeAddress(address: string): string {
  return address.toLowerCase().trim();
}
```

- **Usage**: 3 references (balanceService)
- **Implementation**: toLowerCase() + trim()

**normalizeForComparison** (src/lib/stringUtils.ts:278-283)

```typescript
export function normalizeForComparison(str: unknown): string {
  if (!isValidString(str)) {
    return "";
  }
  return str.toLowerCase().trim();
}
```

- **Usage**: Unknown (search returned type hint usage only)
- **Implementation**: Identical to normalizeAddress, with type safety check
- **Difference**: Accepts unknown type, includes isValidString() check

#### B. Related Functions

**normalizeStrings** (src/lib/stringUtils.ts:68-104)

```typescript
export function normalizeStrings(strings: string[], options: NormalizeOptions = {}): string[] {
  // Trim, case transform, filter, dedupe
}
```

- **Purpose**: Batch normalization with options
- **Options**: case (lower/upper/none), dedupe, trim, filter
- **Implementation**: 36 lines with flexible configuration

**normalizeSymbol** (src/lib/stringUtils.ts:183-190)

- **Purpose**: Symbol-specific normalization
- **Implementation**: Likely similar to normalizeAddress

**normalizeSymbols** (src/lib/stringUtils.ts:205-211)

- **Purpose**: Batch symbol normalization
- **Implementation**: Likely array wrapper

**normalizeProtocolName** (src/lib/stringUtils.ts:389-398)

- **Purpose**: Protocol name specific normalization
- **Implementation**: Handles undefined, special cases

### Consolidation Recommendations

**Issue 1: normalizeAddress vs normalizeForComparison**

- **Recommendation**: Use normalizeForComparison universally
  - Has type safety check
  - Identical core implementation
  - Safer for unknown inputs
- **Action**: Replace all normalizeAddress calls with normalizeForComparison
- **Deprecate**: normalizeAddress (keep as alias for 1 release)

**Issue 2: normalizeSymbol/normalizeSymbols pattern**

- **Recommendation**: Use normalizeStrings with options
  - Less code duplication
  - More flexible
  - Consistent API
- **Current**: Likely just toLowerCase().trim()
- **Unified**: normalizeStrings({ case: 'lower', trim: true })

**Issue 3: normalizeProtocolName specificity**

- **Recommendation**: Keep separate if has domain-specific logic
- **Check**: If just toLowerCase().trim() → consolidate
- **Keep**: Only if protocol names need special handling (undefined checks, etc.)

---

## 3. UNUSED EXPORTS ANALYSIS

### Knip Configuration

- Located: `knip.json` (configured)
- Script: `deadcode` command available
- Status: npm script shows knip is installed (^5.66.4)
- Usage: Run `npm run deadcode` to analyze

### Findings from Manual Analysis

#### A. UI Components (src/components/ui/index.ts)

**Aliases with unclear usage:**

```typescript
ButtonSkeleton as LoadingButton,      // Line 24
Skeleton as LoadingSkeleton,          // Line 25
Spinner as LoadingSpinner,            // Line 26
```

**Status**: LoadingSpinner IS used

- Found 5 active imports:
  - AnalyticsTab.tsx (1 usage)
  - WalletCard.tsx (2 usages)
  - EmailSubscription.tsx (1 usage)
  - AddWalletForm.tsx (1 usage)
  - EditWalletModal.tsx (1 usage)

**Status**: LoadingSkeleton, LoadingButton likely unused

- No direct imports found in search
- Need knip to confirm

#### B. Loading Components Export Status

**Exported but Usage Verified:**

- LoadingState ✓ (used in DashboardShell.tsx, 2 usages)
- AssetCategorySkeleton ✓ (used in AssetCategoriesDetail.tsx)
- BalanceLoading ✓ (used in WalletMetrics.tsx)
- BalanceSkeleton ✓ (exported, likely used)
- PieChartLoading ✓ (used in PortfolioOverview.tsx, 2 usages)
- PieChartSkeleton ✓ (used in PortfolioChartSkeleton.tsx)
- ButtonSkeleton ✓ (used in PortfolioChart/PortfolioChartSkeleton.tsx, 2 usages)
- Skeleton ✓ (used in PortfolioChart/PortfolioChartSkeleton.tsx)
- Spinner ✓ (aliased as LoadingSpinner, 5 usages)
- TokenListSkeleton ✓ (used in TokenSelector.tsx)
- UnifiedLoading ✓ (used in PoolPerformanceTable.tsx, WalletManager.tsx)
- WalletMetricsSkeleton ✓ (used in WalletMetrics.tsx, 2 usages)
- LoadingWrapper ✓ (exported, need knip for usage)

#### C. WalletManager Exports (src/components/WalletManager/index.ts)

All exports appear to be used (barrel exports pattern):

- WalletManager, WalletManagerProps ✓
- Form components (AddWalletForm, EditWalletModal, EmailSubscription) ✓
- WalletCard, WalletList, WalletActionMenu ✓
- All hooks and utilities ✓

#### D. Hooks Index (src/hooks/index.ts)

**Current status**: Minimal barrel exports

- Only useDropdown exported (1 line comment notes others removed for tree-shaking)
- This is intentional design pattern (prefer direct imports)

#### E. Services Index (src/services/index.ts)

**All services re-exported as namespaces**:

```typescript
export * as accountService from "./accountService";
export * as analyticsService from "./analyticsService";
// ... etc
```

- Allows: `services.accountService.connectWallet()`
- Usage: Likely in tests or type definitions
- Status: Likely all used

### Recommended Actions

1. **Run knip analysis**:

   ```bash
   npm run deadcode  # Full analysis
   npm run deadcode:ci  # JSON output for automation
   ```

2. **Review knip output** for:
   - src/components/ui/index.ts aliases (LoadingSkeleton, LoadingButton)
   - src/hooks/index.ts barrel exports
   - src/lib/ and src/utils/ utility functions
   - src/services/ namespaced exports

3. **Common unused patterns to look for**:
   - Utility functions in src/lib/ (formatters, mathUtils, etc.)
   - Legacy component exports
   - Type-only exports that might be inlined

---

## Summary of Cleanup Tasks

| Category                         | Priority | Action                                                         | Estimated Impact                 |
| -------------------------------- | -------- | -------------------------------------------------------------- | -------------------------------- |
| Remove duplicate error classes   | HIGH     | Consolidate APIError/AccountServiceError → BackendServiceError | 5-10 lines, 2 classes removed    |
| Standardize string normalization | MEDIUM   | Replace normalizeAddress with normalizeForComparison           | 3 call sites, 1 function removed |
| Consolidate StrategiesApiError   | MEDIUM   | Migrate to BackendServiceError, update property names          | 6 references, 1 class removed    |
| Remove unused UI aliases         | LOW      | Delete LoadingSkeleton, LoadingButton from index               | 2 lines, backward compat risk    |
| Clean up normalized utilities    | LOW      | Consolidate normalizeSymbol patterns (if applicable)           | TBD by knip output               |

---

## Next Steps

1. **Immediate**: Run `npm run deadcode` to get authoritative unused export list
2. **Phase 1**: Consolidate error classes (backward compat wrapper phase)
3. **Phase 2**: Normalize string functions, update imports
4. **Phase 3**: Remove deprecated aliases and utilities
5. **Phase 4**: Re-run deadcode, verify 0 unused exports
