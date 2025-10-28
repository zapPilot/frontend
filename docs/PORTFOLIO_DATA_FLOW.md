# Portfolio Data Flow & Category Interaction

This document describes the agreed service pattern, portfolio data flow, and the cross‑screen
category interaction contract.

## Overview

- Data source: `useLandingPageData(userId)` makes a single request for landing page data.
- Transformation: `usePortfolioData(landingPageData)` memoizes chart data, category summaries, debt
  summaries, and metrics.
- Portfolio state: `usePortfolioState({ ... })` derives UI states (loading, errors, retrying) and
  exposes helpers.
- View model: `useWalletPortfolioState(params)` aggregates the above into a single object consumed
  by the presenter and exposes shared view toggles via `usePortfolioViewToggles`.

## Container vs. Presenter

- `WalletPortfolio` is now a thin container that calls `useWalletPortfolioState` and passes a single
  `vm` prop to `WalletPortfolioPresenter`.
- `WalletPortfolioPresenter` is a presentational component that renders header, metrics, actions,
  overview, and the wallet modal. It’s easy to unit test in isolation.

## Category Interaction Contract

- Stable Category IDs: Category summaries use stable IDs (`btc`, `eth`, `stablecoins`, `others`)
  generated in `createCategoriesFromApiData`.
- Centralized Filter State: `CategoryFilterContext` holds `selectedCategoryId`, with
  `setSelectedCategoryId` and `clearCategoryFilter`.
- Dashboard integration: `DashboardShell` provides the context using its `selectedCategoryFilter`
  state and routes `onCategoryClick` to both set the filter and switch to the Analytics tab.
- Analytics integration: `AnalyticsTab` consumes the context and uses `selectedCategoryId` as the
  effective filter, with `clearCategoryFilter` wired to the table’s clear action.

## Testing Guidance

- Services: Mock HTTP with lightweight stubs (e.g., `vi.mock` on service functions or `fetch`) to
  validate error/retry handling.
- Hooks: Prefer testing hooks via small wrapper components and `@testing-library/react` utilities.
  Example targets:
  - `useWalletPortfolioState`: visitor gating for actions, `onRetry` pass‑through, identity
    resolution.
  - `useBundlePage`: localStorage sync for switch prompt, email banner visibility, and modal state
    transitions.
  - `CategoryFilterContext`: set and clear behavior and consumer updates.

## File Map

- Hooks
  - `src/hooks/useWalletPortfolioState.ts` — Container VM hook plus exported view toggles helper
  - `src/hooks/useBundlePage.ts` — Bundle page state
  - `src/hooks/usePortfolioData.ts` — Transformation adapter
  - `src/hooks/queries/usePortfolioQuery.ts` — Data fetch
  - `src/hooks/usePortfolio.ts` — Legacy compatibility wrapper delegating to shared view toggles
- Contexts
  - `src/contexts/CategoryFilterContext.tsx` — Shared category filter state
- Components
  - `src/components/wallet/WalletPortfolioPresenter.tsx` — Presenter
  - `src/components/DashboardShell.tsx` — Provides category filter context
  - `src/components/AnalyticsTab.tsx` — Consumes category filter context

## Notes

- Strict TypeScript settings (`exactOptionalPropertyTypes`) are respected by using conditional
  spreads instead of passing explicit `undefined`.
- Existing test IDs were preserved in refactors to keep regression tests stable.
