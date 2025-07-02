# ESLint Control Guide

## Current Status: ESLint Disabled ✅

ESLint is currently disabled during builds to allow for JS→TS migration.

## Methods to Control ESLint

### 1. Next.js Config (Current Method)

In `next.config.ts`:

```typescript
export default {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Currently active
  },
};
```

### 2. Selective Rule Disabling

Create/modify `.eslintrc.json` to disable specific rules:

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": "off",
    "react/no-children-prop": "off"
  }
}
```

### 3. Environment-Based Control

```typescript
// next.config.ts
export default {
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === "production",
  },
};
```

### 4. CI-Only Disabling

```typescript
// next.config.ts
export default {
  eslint: {
    ignoreDuringBuilds: !!process.env.CI,
  },
};
```

### 5. Inline Rule Disabling

For specific lines/files:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = someFunction();

/* eslint-disable @typescript-eslint/no-explicit-any */
// Multiple lines here
/* eslint-enable @typescript-eslint/no-explicit-any */
```

## How to Re-enable ESLint Later

### Step 1: Enable in Next.js Config

```typescript
// next.config.ts
export default {
  eslint: {
    ignoreDuringBuilds: false, // Re-enable
    // Or remove the eslint section entirely
  },
};
```

### Step 2: Fix Critical Issues First

Run lint to see issues:

```bash
npm run lint
```

### Step 3: Gradual Migration Strategy

1. **Start with errors only**:

   ```json
   {
     "extends": ["next/core-web-vitals"],
     "rules": {
       "@typescript-eslint/no-explicit-any": "warn", // Start with warnings
       "no-console": "warn"
     }
   }
   ```

2. **Fix file by file**:

   ```bash
   npm run lint -- --fix  # Auto-fix what it can
   ```

3. **Gradually increase strictness**:
   ```json
   {
     "rules": {
       "@typescript-eslint/no-explicit-any": "error" // Upgrade to error
     }
   }
   ```

## Current Issues Found (For Future Reference)

### Type Issues to Fix Later:

- `@typescript-eslint/no-explicit-any` warnings in:
  - `src/components/AnalyticsProvider.tsx`
  - `src/hooks/useZeroDevWallet.ts`
  - `src/lib/analytics.ts`
  - `src/types/api.ts`

### Console Issues:

- `no-console` warnings (development debugging)

### React Issues:

- `react/no-children-prop` (already fixed in ErrorBoundary)

## Quick Commands

```bash
# Current status (disabled)
npm run build  # No linting

# Check what lint issues exist (when re-enabled)
npm run lint

# Auto-fix issues
npm run lint -- --fix

# Check specific file
npm run lint -- src/components/ErrorBoundary.tsx

# Run with different severity
npm run lint -- --max-warnings 0  # Treat warnings as errors
```

## Migration Strategy Recommendation

1. **Phase 1 (Current)**: Keep ESLint disabled during active JS→TS migration
2. **Phase 2**: Enable with warnings only, fix critical errors
3. **Phase 3**: Gradually convert warnings to errors
4. **Phase 4**: Enable strict TypeScript rules

This allows you to migrate gradually without blocking development! 🚀
