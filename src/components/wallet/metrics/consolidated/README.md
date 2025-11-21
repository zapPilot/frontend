# Consolidated Metrics Components

Three design variations for displaying ROI, PnL, and Yield metrics in a unified component.

## Overview

This directory contains three distinct approaches to consolidating the portfolio metrics (ROI, PnL, and Yield) into cohesive, reusable components. Each variation offers different trade-offs in terms of information density, user interaction, and visual design.

## Variations

### 1. Tabbed Interface (`TabbedMetricsCard`)

**Best for:** Focused analysis and minimal cognitive load

Single card with tab navigation between ROI, PnL, and Yield views. Only one metric is visible at a time with smooth animated transitions.

```tsx
import { TabbedMetricsCard } from "@/components/wallet/metrics/consolidated";

<TabbedMetricsCard data={metricsData} />
```

**Features:**
- Tab-based navigation with keyboard support
- Smooth Framer Motion transitions
- Badge indicators for data points
- Color-coded metric values
- Expandable detail sections

**Pros:**
- Minimal cognitive load - focus on one metric
- Smooth animations create engaging UX
- Easy to add more metrics without cluttering
- Works great on mobile

**Cons:**
- Only one metric visible at a time
- Requires interaction to see all data
- May slow down quick portfolio checks

### 2. Unified Stats Card (`UnifiedMetricsCard`)

**Best for:** Quick portfolio overview and comparison

All three metrics displayed simultaneously in a single card with hierarchical information display.

```tsx
import { UnifiedMetricsCard } from "@/components/wallet/metrics/consolidated";

<UnifiedMetricsCard
  data={metricsData}
  showBreakdown={true}
/>
```

**Features:**
- All metrics visible simultaneously
- Expandable sections for detailed breakdowns
- Responsive grid layout (3 columns desktop, 1 column mobile)
- Summary badges for quick context
- Hover states with visual feedback

**Pros:**
- See everything at once - no tab switching
- Efficient space usage
- Quick portfolio health check
- Great for comparison

**Cons:**
- High information density
- Less space for detailed breakdowns
- May be overwhelming for some users
- Harder to scale with more metrics

### 3. Expandable Accordion (`AccordionMetricsCard`)

**Best for:** Progressive disclosure and flexible information access

Compact summary bar with expandable sections for each metric. Start simple, reveal complexity on demand.

```tsx
import { AccordionMetricsCard } from "@/components/wallet/metrics/consolidated";

<AccordionMetricsCard
  data={metricsData}
  defaultExpanded="roi"
  allowMultipleExpanded={false}
/>
```

**Features:**
- Compact summary showing all metrics
- Expandable sections with smooth animations
- Single or multiple expansion modes
- Deep-link support via URL parameters
- Sticky summary bar option

**Pros:**
- Progressive disclosure pattern
- User controls information depth
- Space efficient when collapsed
- Flexible for different use cases

**Cons:**
- More complex interaction model
- May hide important information
- Requires user to discover expandability
- More states to manage

## Data Structure

All variations use the same data structure:

```typescript
interface ConsolidatedMetricsData {
  roi: {
    value: number;
    period: string;
    windows: Record<string, { value: number; dataPoints: number }>;
    confidence: "high" | "medium" | "low";
    isEstimated: boolean;
  };
  pnl: {
    value: number;
    currency: "USD";
    trend: "up" | "down" | "neutral";
    changePercentage: number;
    isEstimated: boolean;
  };
  yield: {
    avgDailyYield: number;
    daysWithData: number;
    outliersRemoved: number;
    badge: "preliminary" | "improving" | "established" | null;
    confidence: "high" | "medium" | "low";
    protocolBreakdown: ProtocolYieldBreakdown[];
  };
  loading: {
    roi: boolean;
    pnl: boolean;
    yield: boolean;
  };
}
```

## Mock Data

Pre-configured mock data presets are available for testing:

```typescript
import { MOCK_DATA_PRESETS } from "@/components/wallet/metrics/consolidated";

// Available presets
const presets = {
  default: MOCK_DATA_PRESETS.default,      // Balanced portfolio
  bullish: MOCK_DATA_PRESETS.bullish,      // Strong performance
  bearish: MOCK_DATA_PRESETS.bearish,      // Weak performance
  neutral: MOCK_DATA_PRESETS.neutral,      // Stable portfolio
  loading: MOCK_DATA_PRESETS.loading,      // Loading state
  partialLoading: MOCK_DATA_PRESETS.partialLoading, // Progressive loading
};
```

You can also generate custom mock data:

```typescript
import { generateCustomMockData } from "@/components/wallet/metrics/consolidated";

const customData = generateCustomMockData({
  roiValue: 25.5,
  pnlValue: 5000,
  yieldValue: 75.0,
  trend: "up",
});
```

## Demo Page

Visit `/metrics-demo` to see all three variations side-by-side with interactive controls:

- Switch between data presets (Balanced, Strong, Weak, Stable)
- Toggle between individual variations or compare all
- View pros/cons for each design
- Inspect current mock data values

## Integration Example

To integrate a variation into `WalletMetrics.tsx`:

```tsx
import { UnifiedMetricsCard } from "@/components/wallet/metrics/consolidated";
import type { ConsolidatedMetricsData } from "@/components/wallet/metrics/consolidated/types";

// In WalletMetrics component
const consolidatedData: ConsolidatedMetricsData = {
  roi: {
    value: landingPageData?.portfolio_roi?.recommended_yearly_roi ?? 0,
    period: "30d",
    windows: landingPageData?.portfolio_roi?.windows ?? {},
    confidence: "high",
    isEstimated: true,
  },
  pnl: {
    value: landingPageData?.portfolio_roi?.estimated_yearly_pnl_usd ?? 0,
    currency: "USD",
    trend: portfolioChangePercentage > 0 ? "up" : "down",
    changePercentage: portfolioChangePercentage,
    isEstimated: true,
  },
  yield: {
    avgDailyYield: resolvedYieldSummary?.avg_daily_yield_usd ?? 0,
    daysWithData: resolvedYieldSummary?.days_with_data ?? 0,
    outliersRemoved: resolvedYieldSummary?.outliers_removed ?? 0,
    badge: determineBadge(resolvedYieldSummary),
    confidence: "medium",
    protocolBreakdown: transformProtocolBreakdown(resolvedYieldSummary),
  },
  loading: {
    roi: isLandingLoading,
    pnl: isLandingLoading,
    yield: isYieldLoading,
  },
};

return <UnifiedMetricsCard data={consolidatedData} />;
```

## Design System Integration

All variations follow the existing design system:

- **Colors:** Purple-blue gradients, glassmorphism
- **Typography:** Same font scales and weights
- **Spacing:** Consistent padding and gaps
- **Animations:** Framer Motion with matching durations
- **Accessibility:** ARIA labels, keyboard navigation, focus states

## File Structure

```
consolidated/
├── types.ts                    # TypeScript type definitions
├── mockData.ts                 # Mock data generators and presets
├── TabbedMetricsCard.tsx       # Variation 1: Tabbed Interface
├── UnifiedMetricsCard.tsx      # Variation 2: Unified Stats Card
├── AccordionMetricsCard.tsx    # Variation 3: Expandable Accordion
├── index.ts                    # Public API exports
└── README.md                   # This file
```

## Next Steps

1. **User Testing:** Gather feedback on which variation works best for your users
2. **A/B Testing:** Measure metrics like engagement, time to insight, and user preference
3. **Integration:** Replace individual ROI, PnL, and Yield metrics with chosen variation
4. **Iteration:** Refine based on real-world usage patterns

## Contributing

When modifying these components:

1. Maintain type safety with strict TypeScript
2. Follow existing animation patterns
3. Ensure responsive behavior on all screen sizes
4. Add ARIA labels for accessibility
5. Test with all mock data presets
6. Update this README with any new features

---

*Last updated: 2025-01-21*
