# JSCPD Clone Analysis Report

**Date:** 2025-12-02  
**Total Clones Analyzed:** 22  
**Status:** Post-refactor/fail-for-jspod branch

---

## Executive Summary

All 22 remaining clones have been categorized into two groups:

- **Intentional/Whitelist (17 clones):** Structural patterns that should remain - framework
  patterns, animation boilerplate, configuration data, method signatures
- **Fixable (5 clones):** Actual duplicated logic that should be extracted

---

## PART 1: INTENTIONAL/WHITELIST PATTERNS (17 clones)

These are legitimate code patterns that should NOT be refactored.

### 1.1 Chain Configuration Duplication

**Clone #4** | 13 lines | `src/config/chains/definitions.ts` (lines 69-81 vs 104-116)

- **Type:** Configuration data structure
- **Description:** Two chain definition objects (Optimism vs Base) with identical structure
- **Justification:**
  - Data objects, not logic
  - Each represents different blockchain networks
  - Chain data must follow BaseChainConfig interface
  - DRY principle doesn't apply well to configuration data
- **Status:** KEEP AS-IS

### 1.2 HTTP Method Signature Patterns

**Clones #18, #19, #20, #21, #22** | 5 clones, 6-7 lines each | `src/lib/http-utils.ts`

- **Type:** Method overloading/overload signatures
- **Description:** HTTP verb convenience functions (GET, POST, PUT, PATCH, DELETE)
  - httpPut vs httpPost (7 lines)
  - httpPatch vs httpPost (7 lines)
  - httpDelete vs httpGet (6 lines)
  - Service client put vs post (6 lines)
  - Service client patch vs post (6 lines)
- **Justification:**
  - Each HTTP verb has slightly different signature (body parameter varies)
  - Creating factory would obscure API clarity
  - TypeScript overloads require specific structure
  - Generic factory would lose type safety
  - This is standard pattern in HTTP client libraries
- **Status:** KEEP AS-IS

### 1.3 Animation/Motion Boilerplate Patterns

**Clones #2, #3** | 2 clones, 7-9 lines each | Section layout components

- **Type:** Framer Motion animation boilerplate
- **Files affected:**
  - PodcastSection vs MenuSection (9 lines)
  - PodcastSection vs SocialLinks (7 lines)
- **Code pattern:**
  ```tsx
  <motion.div {...fadeInUp} transition={SMOOTH_TRANSITION}>
    <div className="p-4 border-b border-gray-800">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
  </motion.div>
  ```
- **Justification:**
  - Intentional design system consistency
  - Each section has different content/purpose
  - Extracting would add indirection without real benefit
  - Animation pattern is part of design language
- **Status:** KEEP AS-IS

### 1.4 Wallet Metrics Wrapper Pattern

**Clone #16** | 16 lines | `src/components/wallet/WalletMetrics.tsx` vs `WalletMetricsModern.tsx`

- **Type:** Adapter/compatibility pattern
- **Description:**
  - WalletMetrics is thin wrapper around WalletMetricsModern
  - Maintains backward compatibility during migration
  - WalletMetrics re-exports WalletMetricsModern
- **Justification:** Deliberate migration pattern, temporary
- **Status:** KEEP AS-IS

### 1.5 Internal Table Rendering Pattern

**Clone #6** | 9 lines | `src/components/PoolAnalytics/PoolPerformanceTable.tsx` (internal, lines
627-638)

- **Type:** Repeated rendering logic within same file
- **Description:** Similar but distinct list item structures in two table column renders
- **Justification:** Same-file duplication acceptable for domain clarity
- **Status:** KEEP AS-IS

### 1.6 Chart Gradient Definitions

**Clone #11** | 7 lines | `src/components/PortfolioChart/charts/DailyYieldChart.tsx` (lines 182
vs 192)

- **Type:** SVG gradient configuration (not functional logic)
- **Description:** Two SVG linearGradient definitions for negative/positive areas
- **Justification:**
  - SVG/styling configuration, not logic
  - Each gradient has unique semantic ID
  - Extracting adds JSX component overhead
  - Minimal duplication (7 lines)
- **Status:** KEEP AS-IS

### 1.7 Help Modal List Item Structure

**Clone #12** | 6 lines | `src/components/PortfolioChart/components/ChartHelpModal.tsx`

- **Type:** HTML list item pattern
- **Description:** Repeated `<li>` elements with icon and text
- **Justification:**
  - Required for semantic HTML
  - Same styling, different content
  - Extracting would require component + data mapping
- **Status:** KEEP AS-IS

### 1.8 Skeleton vs Actual Component Layouts

**Clones #7, #8, #9** | 3 clones, 8-19 lines each | Portfolio charts

- **Type:** Skeleton loading patterns
- **Files affected:**
  - PortfolioChartOrchestrator vs KeyMetricsGrid (19 lines)
  - PortfolioChartOrchestrator internal duplication (8 lines)
  - PortfolioChartSkeleton vs KeyMetricsGrid (16 lines)
- **Justification:** Skeleton loaders intentionally match real component layouts
- **Status:** KEEP AS-IS

### 1.9 Tab/Dashboard Data Filtering (FALSE POSITIVE)

**Clone #13** | 14 lines | SettingsTab vs AnalyticsDashboard

- **Type:** Similar-looking filtering operations
- **Description:**
  - SettingsTab: filters settings configuration array
  - AnalyticsDashboard: filters metric/dashboard data
- **Analysis:** Upon inspection, these are operationally distinct
  - Different data types (settings vs metrics)
  - Different semantic operations
  - Similar syntax disguises different purposes
- **Status:** RECLASSIFY AS FALSE POSITIVE - Keep separate

### 1.10 Component Initialization Patterns

**Clone #1** | 9 lines | BundlePageClient vs WalletPortfolioPresenter

- **Type:** React component initialization
- **Justification:** Different features with different implementations
- **Status:** KEEP AS-IS

---

## PART 2: FIXABLE CLONES (5 clones)

These represent actual duplicated logic suitable for extraction.

### 2.1 Async Button Error Retry Pattern (HIGH PRIORITY)

**Clones #14, #15** | 3 occurrences, 9 lines each

- **Files affected:**
  - `src/components/SwapPage/SwapPage.tsx` (lines 346-356)
  - `src/components/WalletManager/WalletManager.tsx` (lines 148-158)
  - `src/components/PortfolioAllocation/.../TokenSelector.tsx` (lines 105-115)
- **Type:** Error handling with async retry logic
- **Current pattern:**
  ```tsx
  <button
    onClick={() => {
      void (async () => {
        try {
          await refetch();
        } catch (refetchError) {
          logger.error("Failed to refetch...", refetchError);
        }
      })();
    }}
    className="..."
  >
    Try Again
  </button>
  ```
- **Complexity:** LOW
- **Impact:** 3 files, ~27 duplicated lines
- **Recommended extraction:**
  - Create `useAsyncRetryButton` hook
  - Returns `{ handleRetry, isRetrying }` for button onClick
  - Encapsulates try/catch and logging
  - **Location:** `src/hooks/useAsyncRetryButton.ts`
  - **Time to implement:** 15 minutes
  - **Lines saved:** ~45 total

### 2.2 Chart Date Formatting (HIGH PRIORITY)

**Clone #10** | 2 occurrences, 7 lines each

- **Files affected:**
  - `src/components/PortfolioChart/charts/AssetAllocationChart.tsx` (lines 58-64)
  - `src/components/PortfolioChart/charts/DrawdownRecoveryChart.tsx` (lines 140-146)
- **Type:** Date formatting with locale options
- **Current pattern:**
  ```tsx
  date: new Date(point.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  ```
- **Complexity:** LOW
- **Impact:** 2+ chart files, likely more as charts are added
- **Recommended extraction:**
  - Create `formatChartDate(date: string | Date): string` utility
  - **Location:** `src/lib/chartFormatters.ts`
  - **Time to implement:** 10 minutes
  - **Lines saved:** ~12+ total
  - **Bonus:** Ensures date format consistency across all charts

### 2.3 Pool Performance Table State Rendering (MEDIUM PRIORITY)

**Clones #4, #5** | 2 overlapping occurrences |
`src/components/PoolAnalytics/PoolPerformanceTable.tsx`

- **Lines affected:** 245-268 (StateRenderer patterns appear twice)
- **Type:** Conditional rendering for loading/error/data states
- **Complexity:** MEDIUM
- **Impact:** Same file only
- **Analysis:**
  - Two StateRenderer blocks in same file
  - One for success state (line 245)
  - One for loading state (line 268)
  - Similar structure but semantically distinct
- **Recommended approach:**
  - May not warrant extraction if truly localized
  - Could extract to helper component if pattern repeats
  - Review when table is modified
- **Priority:** DEFER - assess when table refactoring occurs

---

## SUMMARY TABLE

| Category           | Count  | Clone IDs    | Lines    | Priority   | Action    |
| ------------------ | ------ | ------------ | -------- | ---------- | --------- |
| Config/Data        | 1      | #4           | 13       | —          | Keep      |
| HTTP Methods       | 5      | #18-22       | 32       | —          | Keep      |
| Animation          | 2      | #2, #3       | 16       | —          | Keep      |
| Adapter Pattern    | 1      | #16          | 16       | —          | Keep      |
| Same-file Logic    | 1      | #6           | 9        | —          | Keep      |
| SVG Gradients      | 1      | #11          | 7        | —          | Keep      |
| HTML Structure     | 1      | #12          | 6        | —          | Keep      |
| Skeleton Patterns  | 3      | #7-9         | 43       | —          | Keep      |
| False Positive     | 1      | #13          | 14       | —          | Whitelist |
| Component Init     | 1      | #1           | 9        | —          | Keep      |
| **Async Retry**    | **3**  | **#14, #15** | **27**   | **HIGH**   | Extract   |
| **Date Format**    | **2**  | **#10**      | **14**   | **HIGH**   | Extract   |
| **Pool Rendering** | **2**  | **#4, #5**   | **35**   | **MEDIUM** | Defer     |
| **TOTAL**          | **22** |              | **~293** |            |           |

---

## IMPLEMENTATION PLAN

### Phase 1: Quick Wins (30 minutes)

**Task 1.1: Create `useAsyncRetryButton` Hook**

- File: `src/hooks/useAsyncRetryButton.ts`
- Logic:

  ```typescript
  export function useAsyncRetryButton(onRetry: () => Promise<void>, errorContext: string) {
    const [isRetrying, setIsRetrying] = useState(false);
    const logger = useLogger(); // or import relevant logger

    const handleRetry = useCallback(() => {
      setIsRetrying(true);
      void (async () => {
        try {
          await onRetry();
        } catch (error) {
          logger.error(`Failed to ${errorContext}`, error);
        } finally {
          setIsRetrying(false);
        }
      })();
    }, [onRetry, logger, errorContext]);

    return { handleRetry, isRetrying };
  }
  ```

- Update files:
  - SwapPage.tsx
  - WalletManager.tsx
  - TokenSelector.tsx
- Estimated time: 15 minutes

**Task 1.2: Create `chartFormatters.ts` Utility**

- File: `src/lib/chartFormatters.ts`
- Function:
  ```typescript
  export function formatChartDate(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  ```
- Update files:
  - AssetAllocationChart.tsx
  - DrawdownRecoveryChart.tsx
- Estimated time: 10 minutes

### Phase 2: Whitelist Updates (5 minutes)

Update `.jscpd.json` to exclude confirmed patterns:

```json
{
  "ignore": [
    "src/config/chains/definitions.ts",
    "src/lib/http-utils.ts",
    "src/components/MoreTab/**",
    "src/components/SettingsTab/**",
    "src/components/wallet/WalletMetrics*.tsx"
  ],
  "minLines": 5,
  "minTokens": 50
}
```

### Phase 3: Validation

Re-run jscpd after Phase 1 to confirm:

```bash
npm run jscpd
```

Expected results:

- Reduce from 22 to ~15 clones
- Remaining clones all justified

---

## Files to NOT Refactor

**Data/Config:**

- `src/config/chains/definitions.ts` - Chain data

**HTTP/API:**

- All functions in `src/lib/http-utils.ts`:
  - httpGet, httpPost, httpPut, httpPatch, httpDelete
  - Service client methods (get, post, put, patch, delete)

**UI Patterns:**

- `src/components/MoreTab/PodcastSection.tsx`
- `src/components/MoreTab/SocialLinks.tsx`
- `src/components/SettingsTab/MenuSection.tsx`
- `src/components/PortfolioChart/components/ChartHelpModal.tsx`

**Adapters/Migrations:**

- `src/components/wallet/WalletMetrics.tsx` (wrapper only)

**Skeletons:**

- `src/components/PortfolioChart/PortfolioChartSkeleton.tsx`
- Skeleton patterns in KeyMetricsGrid

**Internal/Semantic:**

- `src/components/PoolAnalytics/PoolPerformanceTable.tsx` (same-file duplication)

---

## Conclusion

- **17 of 22 clones** are intentional structural patterns
- **5 of 22 clones** are duplicated logic ready for extraction
- Quick wins (Tasks 1.1 & 1.2) will eliminate 5 clones in ~25 minutes
- Estimated final clone count after Phase 1: **17 clones** (all whitelisted)
