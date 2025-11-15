# Tooltip Implementation Analysis & Consolidation Opportunities

## Current Tooltip Implementations

### 1. ROITooltip (src/components/wallet/ROITooltip.tsx)
**Purpose:** Display portfolio ROI estimation with time period breakdowns and top protocols

**Structure:**
- `MetricsTooltipContainer`: Reusable portal wrapper for tooltip positioning
- `ROITooltip`: Main component displaying ROI metrics
- `ROIWindowItem`: Time window data with label, value (percentage), and data points
- `ProtocolROIItem`: Protocol performance with net/token/reward yields

**Key Features:**
- Uses React portal for DOM positioning (fixed positioning with CSS transform)
- Portal root: `document.body`
- Position calculation: `{ top, left }` with `translateX(-50%)`
- Displays multiple time windows (7d, 30d, 90d, etc.) sorted by duration
- Shows top protocols by net yield (30d)
- Includes methodology explanation

**Window Sorting Logic:**
- Uses `deriveRoiWindowSortScore()` from `src/lib/roi.ts`
- Converts window keys (roi_7d, roi_30d, etc.) to numeric scores in days
- Sorts by ascending score (shortest periods first)
- Does NOT implement "smallest positive value" selection

### 2. ProtocolBreakdownTooltip (src/components/wallet/ProtocolBreakdownTooltip.tsx)
**Purpose:** Show protocol yield breakdown comparing today's moves vs historical window

**Structure:**
- Reuses `MetricsTooltipContainer` from ROITooltip
- Displays protocol-level yield data with today and window statistics
- Imports: `ProtocolYieldBreakdown` and `ProtocolYieldWindow` from analytics service

**Key Features:**
- Shows per-protocol breakdown with scrollable content (max-h-64)
- Displays today's yield and window totals/daily averages
- Color-coded values (positive=green, negative=red, neutral=gray)
- Window summary: shows positive/negative/flat days
- Outlier filtering information from IQR method

**Shared Helper Functions:**
- `getValueColor()`: Returns Tailwind color class based on value sign
- `formatSignedCurrency()`: Formats with +/- prefix for non-zero values
- `formatWindowSummary()`: Renders "X up · Y down · Z flat" summary

### 3. API Response Structures (analyticsService.ts)

**ProtocolYieldWindow:**
```typescript
{
  total_yield_usd: number;
  average_daily_yield_usd: number;
  data_points: number;
  positive_days: number;
  negative_days: number;
}
```

**ProtocolYieldToday:**
```typescript
{
  date: string;
  yield_usd: number;
}
```

**ProtocolYieldBreakdown:**
```typescript
{
  protocol: string;
  chain?: string | null;
  window: ProtocolYieldWindow;
  today?: ProtocolYieldToday | null;
}
```

**YieldReturnsSummaryResponse:**
- Contains `protocol_breakdown: ProtocolYieldBreakdown[]`
- Includes filtering statistics (outliers_removed, filtered_days, etc.)
- Period information (start_date, end_date, days)

**LandingPageResponse:**
- Contains `yield_summary?: YieldReturnsSummaryResponse`
- Contains `portfolio_roi` with multi-window support
- Windows format: `Record<string, { value: number; data_points: number; start_balance?: number }>`

## Current Tooltip Positioning/Behavior Logic

**Both tooltips share identical positioning logic:**

From WalletMetrics.tsx:
```typescript
const openRoiTooltip = useCallback(() => {
  const el = infoIconRef.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  setRoiTooltipPos({
    top: rect.bottom + 8 + window.scrollY,
    left: rect.left + rect.width / 2 + window.scrollX,
  });
  setRoiTooltipVisible(true);
}, []);
```

**Key observations:**
- Both tooltips use identical state management pattern
- Positioning is consistent: below trigger element, centered horizontally
- Offset: 8px below trigger element
- Both use `createPortal` to DOM body
- Both use fixed positioning with `translateX(-50%)`

## Existing Consolidated Tooltip Infrastructure

**ChartTooltip (src/components/charts/ChartTooltip.tsx):**
- Sophisticated tooltip for chart hovers
- Smart positioning: avoids edges, checks legend guards
- Content rendering: polymorphic based on chart type
- NOT used by wallet metrics tooltips (different use case)

## Consolidation Opportunities

### 1. **Shared Tooltip Hook** ⭐
**Opportunity:** Extract tooltip positioning and visibility logic into a custom hook

**Current Pattern (Duplicated in WalletMetrics.tsx):**
```typescript
const [roiTooltipVisible, setRoiTooltipVisible] = useState(false);
const [roiTooltipPos, setRoiTooltipPos] = useState({ top: 0, left: 0 });
const infoIconRef = useRef<HTMLSpanElement | null>(null);

const openRoiTooltip = useCallback(() => {
  const el = infoIconRef.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  setRoiTooltipPos({
    top: rect.bottom + 8 + window.scrollY,
    left: rect.left + rect.width / 2 + window.scrollX,
  });
  setRoiTooltipVisible(true);
}, []);

const closeRoiTooltip = useCallback(() => setRoiTooltipVisible(false), []);
```

**Proposed Hook: `useMetricsTooltip`**
```typescript
export function useMetricsTooltip(offsetY: number = 8) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.bottom + offsetY + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
    setVisible(true);
  }, [offsetY]);

  const close = useCallback(() => setVisible(false), []);

  return { visible, position, ref, open, close };
}
```

### 2. **Dedicated Shared Utilities Module**

**Opportunity:** Create `src/components/wallet/tooltips/utils.ts`

Move shared logic:
- `getValueColor()` - currently in ProtocolBreakdownTooltip
- `formatSignedCurrency()` - currently in ProtocolBreakdownTooltip
- `formatWindowSummary()` - currently in ProtocolBreakdownTooltip
- Add common formatting utilities

### 3. **Generic MetricsTooltip Component** 

**Current State:**
- `MetricsTooltipContainer` is exported from ROITooltip.tsx
- ProtocolBreakdownTooltip imports it
- Could be extracted to standalone shared component

**Proposed File Structure:**
```
src/components/wallet/tooltips/
├── MetricsTooltipContainer.tsx    # Extracted shared container
├── ROITooltip.tsx                  # Specialized ROI content
├── ProtocolBreakdownTooltip.tsx   # Specialized protocol breakdown
├── hooks.ts                        # useMetricsTooltip hook
└── utils.ts                        # Shared helpers
```

### 4. **Enhanced Tooltip Types**

**Opportunity:** Create shared type definitions

```typescript
// src/components/wallet/tooltips/types.ts
export interface TooltipPosition {
  top: number;
  left: number;
}

export interface MetricsTooltipProps {
  position: TooltipPosition;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}
```

### 5. **Shared Window/Period Formatting**

**Observation:** Both tooltips need to format window/period labels

**Current Usage:**
- ROI tooltip: Shows time windows with data points
- Protocol breakdown: Shows period days in label

**Opportunity:** Centralize period formatting in `src/lib/roi.ts` or new `src/lib/metrics.ts`

## "Smallest Positive Value" Logic Investigation

**Finding:** NOT CURRENTLY IMPLEMENTED

The ROI window selection uses **chronological ordering** (shortest to longest period), NOT smallest positive value selection.

**Code Evidence:**
```typescript
const roiWindows = portfolioROI?.windows
  ? Object.entries(portfolioROI.windows)
      .map(([key, value]) => ({
        key,
        label: formatRoiWindowLabel(key),
        value: value.value,
        dataPoints: value.data_points,
      }))
      .sort(
        (a, b) =>
          deriveRoiWindowSortScore(a.key) - deriveRoiWindowSortScore(b.key)
      ) // Shortest period first
  : [];
```

**If "smallest positive value" selection is desired:**
- Would need to: `windows.filter(w => w.value > 0).sort((a,b) => a.value - b.value)[0]`
- Could be added as recommendation/highlighting feature

## Data Type Alignment

**No Breaking Issues:**
- API provides `windows: Record<string, { value: number; data_points: number }>`
- Components map this to: `ROIWindowItem[]` with matching structure
- ProtocolBreakdown types are well-structured
- IQR outlier filtering is properly exposed in statistics

## Summary of Consolidation Wins

| Item | Current | Consolidated | Benefit |
|------|---------|--------------|---------|
| Tooltip positioning logic | Duplicated in WalletMetrics | `useMetricsTooltip` hook | DRY, reusable |
| Tooltip container | In ROITooltip.tsx | Standalone component | Cleaner separation |
| Value formatting helpers | In ProtocolBreakdownTooltip | Shared utils.ts | DRY |
| Window summary formatting | In ProtocolBreakdownTooltip | Could move to roi.ts | Consolidation |
| Tooltip types | Inline interfaces | Dedicated types.ts | Better typing |
| Portal mounting | Both use createPortal | Consistent via hook | Unified approach |

## Recommended Implementation Order

1. **First:** Extract `useMetricsTooltip` hook → Immediate DRY improvement
2. **Second:** Create `tooltips/utils.ts` → Move shared helpers
3. **Third:** Extract `MetricsTooltipContainer` to standalone file
4. **Fourth:** Create `tooltips/types.ts` → Better type organization
5. **Fifth:** Consider adding "smallest positive value" selection if needed

## Files That Would Change

- `src/components/wallet/ROITooltip.tsx` - Export MetricsTooltipContainer separately
- `src/components/wallet/ProtocolBreakdownTooltip.tsx` - Import from tooltips/
- `src/components/wallet/WalletMetrics.tsx` - Use useMetricsTooltip hook
- NEW: `src/components/wallet/tooltips/MetricsTooltipContainer.tsx`
- NEW: `src/components/wallet/tooltips/hooks.ts`
- NEW: `src/components/wallet/tooltips/utils.ts`
- NEW: `src/components/wallet/tooltips/types.ts`
