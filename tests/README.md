# Test Strategy for Solo Developer

## Philosophy

As a solo developer, you need tests that **help you ship confidently** without wasting time on flaky
failures.

## Current Test Setup

### ✅ Essential Tests (`npm run test`)

**Fast, reliable tests that catch real issues:**

- **Page loads without errors** - Catches build/deployment issues
- **Button hover states work** - Ensures good UX (with warnings, not failures)
- **Navigation exists** - Basic functionality check
- **No broken images** - Asset loading verification
- **Responsive design** - Works on desktop and mobile
- **Investment buttons functional** - Core business flow
- **Performance check** - Page loads under 5 seconds
- **No console errors** - JavaScript health check

**Runtime: ~8 seconds** ⚡

### Other Commands

```bash
npm run test           # Run essential tests (recommended)
npm run test:smoke     # Just the basics (3 tests, ~3 seconds)
npm run test:dev       # Run with browser visible for debugging
npm run test:all       # Run ALL tests (including flaky ones)
```

## What We DON'T Test

- Complex navigation flows (too flaky)
- Detailed UI state management (changes too often)
- Pixel-perfect styling (not critical for solo dev)
- Every possible user interaction (time-consuming)

## When to Run Tests

- **Before each deployment** (`npm run test`)
- **After major changes** (`npm run test`)
- **When debugging issues** (`npm run test:dev`)

## Adding New Tests

Only add tests for:

1. **Critical business functionality** (payment, signup, etc.)
2. **Features that frequently break** (based on actual bugs)
3. **Performance regressions** (loading time, errors)

## Archived Tests

Complex tests that were too flaky are in `tests/archive/`. These can be useful for debugging
specific issues but shouldn't run automatically.

## Test Philosophy Summary

**Better to have 9 reliable tests than 50 flaky ones.** Focus on catching the issues that would
actually hurt your business or users.
