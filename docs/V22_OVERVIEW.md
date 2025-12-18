# V22 Layout Overview

**Last Updated:** 2025-01-17 **Current Status:** V1 Production, V22 Demo-Only **Next Milestone:**
Post-enhancement polish **Latest Update (2025-12-17):** V22 demo now includes Connect Wallet CTA +
mock Deposit/Withdraw/Rebalance modals with strategy slider.

---

## Table of Contents

1. [Recent Changes](#recent-changes)
2. [Current Architecture](#current-architecture)
3. [V22 Features](#v22-features)
4. [Migration History](#migration-history)
5. [Enhancement Roadmap](#enhancement-roadmap)
6. [Testing & Quality](#testing--quality)
7. [Technical Documentation](#technical-documentation)

---

## Recent Changes

### Wallet UI Cleanup (2025-01-17)

**Summary:** Consolidated V22 wallet interface to single unified menu component.

**Changes Made:**

- ✅ Removed experimental wallet UI variations (WalletUIVariation2, WalletUIVariation3)
- ✅ Renamed WalletUIVariation1 → **WalletMenu** (semantic, future-proof naming)
- ✅ Removed development toggle UI from WalletPortfolioPresenterV22
- ✅ Simplified component structure and imports

**Rationale:**

- WalletUIVariation1 (Unified Menu) proved to be the optimal UX pattern
- Single-component approach reduces maintenance overhead
- Cleaner architecture for production readiness
- Transaction modals (Deposit, Withdraw, Rebalance) remain fully functional

**Component Location:**

- `/src/components/wallet/variations/v22/WalletMenu.tsx`

**Test IDs:**

- `unified-wallet-menu-button` - Main menu button
- `unified-wallet-menu-dropdown` - Dropdown menu

**Validation:**

- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors (2 acceptable console.error warnings)
- ✅ E2E tests: All passing

---

## Current Architecture

### Route Separation

| Route              | Layout           | Purpose            | Status    | Users            |
| ------------------ | ---------------- | ------------------ | --------- | ---------------- |
| `/bundle`          | V1 (sidebar)     | Production default | ✅ Active | All users        |
| `/layout-demo/v22` | V22 (horizontal) | Demo & testing     | ✅ Active | Development only |

### Decision: V1 Restored as Default (2025-01-17)

**Background:** After deploying V22 as production default (commit e215ebf), user feedback indicated
preference for V1 layout. V1 was restored as default while keeping V22 available at the demo route.

**Rationale:**

- V1 sidebar navigation preferred for desktop users
- V22 horizontal navigation better suited for specific workflows
- Both layouts maintained in parallel for different use cases

**Files Restored from Git:**

- `src/app/bundle/BundlePageClient.tsx` (100 lines)
- `src/components/DashboardShell.tsx` (280 lines)
- `src/components/Navigation.tsx` (181 lines)

**Commit:** `5ee6bbf` - "feat: Restore V1 layout as default for /bundle route"

### V1 Layout (Production)

**Navigation:** Desktop sidebar (72 units wide) + mobile bottom navigation **Tabs:** 5 tabs

- Portfolio (Wallet assets and allocation)
- Analytics (Performance charts and metrics)
- Community (Social features)
- Airdrop (Token distribution)
- Settings (User preferences)

**Key Components:**

- `DashboardShell` - Main layout container with tab management
- `Navigation` - Responsive navigation (sidebar + mobile bottom bar)
- `WalletPortfolio` - Portfolio presenter with category filtering
- `WalletPortfolioPresenter` - V1 presenter component

### V22 Layout (Demo-Only)

**Navigation:** Horizontal tab bar (top of page) **Tabs:** 3 tabs

- Dashboard (Net worth, strategy, composition)
- Analytics (Performance charts with regime annotations)
- Backtesting (Historical strategy analysis)

**Key Components:**

- `BundlePageClientV22` - V22 bundle wrapper
- `WalletPortfolioPresenterV22` - Main V22 presenter
- `AnalyticsView` - Enhanced analytics with tooltips
- Multi-wallet switcher (dropdown in navigation bar)

---

## V22 Features

### Completed Features

1. **Horizontal Navigation** ✅
   - Tab-based interface (Dashboard, Analytics, Backtesting)
   - Cleaner, more focused user experience
   - Mobile-responsive tab switching

2. **Regime-Aware Portfolio Display** ✅
   - Current regime indicator (Extreme Fear → Extreme Greed)
   - Strategy recommendations based on market conditions
   - Regime transition history tracking
   - Direction detection (`fromLeft`, `fromRight`, `default`)

3. **Enhanced Analytics Dashboard** ✅
   - Real-time portfolio performance charts
   - Drawdown analysis with recovery periods
   - Key metrics (TWR, Max Drawdown, Sharpe, Win Rate)
   - Monthly PnL heatmap
   - Regime annotations on performance timeline

4. **Multi-Wallet Support** ✅ (Phase 2D)
   - Wallet switcher dropdown in navigation bar
   - Active wallet indicator with purple glow
   - URL support: `/layout-demo/v22?userId={id}&walletId={id}`
   - Cache invalidation on wallet switch
   - Owner-only controls (visitors see read-only view)

5. **Bundle Sharing** ✅
   - Owner vs Visitor mode differentiation
   - Switch prompt banner for connected users viewing other bundles
   - Quick switch FAB (floating action button)
   - Email reminder banner integration

### Features In Progress

1. **Wallet Connectivity** 🔄 (Next: Add ConnectWalletButton to V22)
   - Integration point: Top navigation bar (after wallet switcher)
   - Component: `ConnectWalletButton` (already exists from Phase 2B.3)
   - Status: Component ready, needs integration into V22 layout

2. **Transaction Modals** 🔄 (Design & Implementation)
   - Deposit modal (chain → token → amount → confirm)
   - Withdraw modal (type → amount → slippage → confirm)
   - Rebalance modal with Strategy Slider (0-100% rebalancing intensity)
   - See: `docs/V22_DEMO_ENHANCEMENT_PLAN.md` for detailed specifications

### Planned Features

1. **Advanced Charting**
   - Comparative benchmark lines (not just BTC)
   - Regime transition markers with tooltips
   - Zoom/pan controls for detailed analysis

2. **Mobile Optimizations**
   - Touch-optimized chart interactions
   - Swipe gestures for tab switching
   - Compact modal designs for mobile viewports

3. **Real-Time Updates**
   - WebSocket integration for live portfolio values
   - Regime change notifications
   - Transaction status updates

---

## Migration History

### Phase 1: Backend API Assessment ✅ (2025-12-14)

**Key Discovery:** Analytics-engine already has comprehensive V2 API!

- 9 V2 endpoints cover all V22 requirements
- Regime tracking production-ready (5 regimes with transitions)
- Unified dashboard endpoint optimized (96% faster, 12-hour cache)
- No database schema migrations required

**V2 Endpoints Ready for V22:**

| Endpoint                                      | V22 Usage        | Performance   | Status   |
| --------------------------------------------- | ---------------- | ------------- | -------- |
| `GET /api/v2/analytics/{user_id}/dashboard`   | Primary data     | 55ms (cached) | ✅ Ready |
| `GET /api/v2/market/regime/history`           | Strategy display | 12h cache     | ✅ Ready |
| `GET /api/v2/analytics/{user_id}/yield/daily` | Monthly PnL      | Standard      | ✅ Ready |
| `GET /api/v2/pools/{user_id}/performance`     | Pool analysis    | Standard      | ✅ Ready |

### Phase 2: Multi-Wallet Integration ✅ (2025-12-15)

**Phase 2A: Core Infrastructure**

- Extended `WalletProvider` with multi-wallet support
- Added `connectedWallets`, `switchActiveWallet`, `hasMultipleWallets`
- Bundle URL support with `walletId` parameter
- Auto-switch logic for wallet-specific URLs

**Phase 2B: Wallet Manager UI**

- Active wallet indicator with purple glow
- "Switch to this wallet" buttons (owner mode only)
- "Connect Another Web3 Wallet" section with ThirdWeb ConnectButton
- Owner-only visibility controls

**Phase 2D: V22 Portfolio Integration**

- Multi-wallet dropdown in V22 navigation bar
- Framer Motion animations for dropdown
- Click-outside and Escape key handling
- Disabled state for active wallet

**Quality Grade:** A- (90/100) - Core functionality shipped, hardening deferred to Phase 2B.4

### Phase 3: V22 Production Migration ✅ (2025-12-16)

**Original Plan:** Deploy V22 as production default with feature flags

**Phase 3A: Component Setup** ✅

- Created `BundlePageClientV22.tsx`, `WalletPortfolioPresenterV22.tsx`
- Feature flag routing logic in `BundlePageEntry.tsx`
- Validation: 0 TypeScript errors, 0 ESLint errors

**Phase 3B: Percentage Rollout System** ✅

- `isUserInV22Rollout(userId)` function
- Deterministic hash-based user assignment
- Environment variables: `NEXT_PUBLIC_USE_V22_LAYOUT`, `NEXT_PUBLIC_V22_ROLLOUT_PERCENTAGE`

**Phase 3C: Testing & QA** ✅

- **Total Tests:** 237 tests across 9 files
- **New V22 Tests:** 163 tests (5 files)
- **Coverage:** All critical user flows
- Component instrumentation with `data-testid` attributes

**V22 Hard Cutover:** Deployed as production default (commit e215ebf)

**User Feedback & Reversal (2025-01-17):**

- User preferred V1 sidebar navigation
- V1 restored as default (commit 5ee6bbf)
- V22 remains active at `/layout-demo/v22` for continued development
- Feature flags cleaned up (commit dd1b4f6)

### Current State Summary

**Production (`/bundle`):**

- Layout: V1 (sidebar, 5 tabs)
- Status: Default for all users
- Components: `BundlePageClient`, `DashboardShell`, `Navigation`

**Demo (`/layout-demo/v22`):**

- Layout: V22 (horizontal, 3 tabs)
- Status: Development & testing only
- Components: `BundlePageClientV22`, `WalletPortfolioPresenterV22`

**Feature Flags:**

- Cleaned up (no longer needed for `/bundle` route)
- V22 demo route always shows V22 (no flags)

---

## Enhancement Roadmap

### Next Milestone: V22 Demo Enhancements

**Detailed Plan:** `docs/V22_DEMO_ENHANCEMENT_PLAN.md`

**Phase 1: Foundation (1 day)**

- Create type definitions for transaction modals
- Create service functions for mock transactions
- Create React Query hooks for chain/token data

**Phase 2: Shared Components (2-3 days)**

- ChainSelector (multi-chain dropdown)
- TokenSelector (searchable with balances)
- AmountInput (with max button and validation)
- TransactionSummary (preview before confirm)

**Phase 3: Modal Components (2-3 days)**

- Base TransactionModal
- DepositModal
- WithdrawModal
- RebalanceModal with Strategy Slider (innovation)

**Phase 4: Integration (1 day)**

- Add ConnectWalletButton to V22 navigation
- Wire modal triggers to dashboard buttons
- Implement modal state management
- Add loading and error states

**Phase 5: Testing & Documentation (1 day)**

- E2E tests for all user flows
- Accessibility verification (WCAG AA)
- Performance optimization (lazy loading)
- Documentation updates

**Total Timeline:** 7 days

### Strategy Slider Innovation

**Problem:** Traditional rebalance UIs force all-or-nothing decisions

**Solution:** Strategy Slider allows users to choose rebalancing intensity (0-100%)

**Benefits:**

- Clear impact visualization
- Risk control through partial rebalancing
- Gradual learning for new users
- Cost optimization (avoid unnecessary gas fees)

**Implementation:**

- Horizontal slider with live preview
- Expected APR change calculation
- Transaction cost estimate
- Preset quick-select buttons (0%, 25%, 50%, 75%, 100%)

### Future Enhancements (Post-MVP)

1. **Real Transaction Execution** - Replace mock services with blockchain integration
2. **Multi-Chain Gas Estimation** - Dynamic gas price fetching
3. **Transaction History** - Store and display past operations
4. **AI-Powered Rebalancing** - Allocation recommendations
5. **Batch Operations** - Multiple transactions in single session
6. **PWA Enhancement** - Native-like mobile experience

---

## Testing & Quality

### E2E Test Coverage

**Total Tests:** 237 tests across 9 files **V22-Specific:** 163 tests (5 files)

**Test Files:**

1. `v22-feature-flag.spec.ts` (19 tests)
   - Feature flag routing
   - Percentage-based rollout
   - Layout switching

2. `v22-multi-wallet.spec.ts` (24 tests)
   - Multi-wallet switching
   - URL parameter handling
   - Wallet persistence

3. `v22-bundle-sharing.spec.ts` (32 tests)
   - Owner vs visitor modes
   - Shared links
   - Switch prompt banner

4. `v22-core-functionality.spec.ts` (52 tests)
   - Dashboard, Analytics, Backtesting tabs
   - Regime detection
   - Portfolio composition
   - Quick actions

5. `v22-mobile-responsive.spec.ts` (36 tests)
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

### Test Execution

```bash
# Run all V22 tests
npx playwright test tests/e2e/v22-*.spec.ts

# Run with UI mode
npx playwright test tests/e2e/v22-*.spec.ts --ui

# Run specific test file
npx playwright test tests/e2e/v22-feature-flag.spec.ts
```

### CI/CD Configuration

- **Workers:** 1 (memory optimization)
- **Retries:** 2 (CI only)
- **Timeout:** 30s per test
- **Global Timeout:** 10 minutes
- **Reporter:** HTML (CI), List (local)

### Quality Metrics

- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ Test Coverage: 163 V22-specific tests
- ✅ All critical paths covered
- ✅ Mobile responsiveness verified

---

## Technical Documentation

### File Structure

```
src/
├── app/
│   ├── bundle/
│   │   ├── BundlePageEntry.tsx              # V1 route entry
│   │   ├── BundlePageClient.tsx             # V1 client (restored)
│   │   └── BundlePageClientV22.tsx          # V22 client (demo-only)
│   └── layout-demo/v22/
│       └── page.tsx                         # V22 demo route (independent)
│
├── components/
│   ├── DashboardShell.tsx                   # V1 layout shell (restored)
│   ├── Navigation.tsx                       # V1 navigation (restored)
│   ├── WalletPortfolio.tsx                  # Portfolio selector (V1 mode)
│   └── wallet/
│       ├── WalletPortfolioPresenter.tsx     # V1 presenter
│       └── variations/
│           ├── WalletPortfolioPresenterV22.tsx  # V22 presenter
│           └── v22/
│               └── WalletMenu.tsx           # V22 unified wallet menu
│
├── services/
│   ├── accountService.ts                    # User & wallet management
│   ├── intentService.ts                     # Transaction execution
│   ├── analyticsService.ts                  # Portfolio analytics (V2 endpoints)
│   └── bundleService.ts                     # Bundle sharing
│
└── hooks/
    ├── useBundlePage.ts                     # Bundle page logic with wallet auto-switch
    ├── useWalletPortfolioState.ts           # V1 portfolio state
    └── queries/
        ├── usePortfolioQuery.ts             # V1 portfolio data
        └── useAnalyticsQuery.ts             # V2 analytics data
```

### Key Dependencies

- **Next.js 15** - App Router with static export
- **React 19** - Latest features and optimizations
- **TypeScript 5** - Strict mode with exactOptionalPropertyTypes
- **Tailwind CSS v4** - Utility-first styling
- **ThirdWeb SDK v5** - Wallet connectivity
- **React Query (TanStack)** - API state management
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Declarative animations

### Environment Variables

```bash
# V22 Demo is always active (no flags needed for /layout-demo/v22)
# No environment variables required

# Legacy: Previously used for production /bundle route (now removed)
# NEXT_PUBLIC_USE_V22_LAYOUT=false (deprecated)
# NEXT_PUBLIC_V22_ROLLOUT_PERCENTAGE=0 (deprecated)
```

### Component Instrumentation

All V22 components have `data-testid` attributes for E2E testing:

```typescript
// Example: WalletPortfolioPresenterV22.tsx
<button data-testid="deposit-button">Deposit</button>
<button data-testid="withdraw-button">Withdraw</button>
<button data-testid="optimize-button">Optimize</button>
<div data-testid="wallet-switcher-button">Wallet Switcher</div>
<div data-testid="multi-wallet-dropdown">Dropdown</div>
```

### Rollback Procedures

**If V22 demo has issues:**

```bash
# Demo route is independent - simply fix bugs directly
# No rollback needed as it doesn't affect production
```

**If V1 production has issues:**

```bash
# Restore from git history (V22 hard cutover commit)
git show e215ebf:src/app/bundle/BundlePageEntry.tsx > src/app/bundle/BundlePageEntry.tsx
git show e215ebf:src/components/WalletPortfolio.tsx > src/components/WalletPortfolio.tsx

# Or revert the V1 restoration commit
git revert 5ee6bbf
```

---

## Related Documentation

### Development Guides

- **V22 Demo Enhancement Plan:** `docs/V22_DEMO_ENHANCEMENT_PLAN.md`
- **E2E Test Execution:** `tests/e2e/README.md`
- **Test Coverage Summary:** `tests/e2e/V22_TEST_SUITE_SUMMARY.md`
- **Data Test ID Guide:** `tests/e2e/DATA_TESTID_GUIDE.md`

### Architecture References

- **Service Documentation:** `docs/SERVICES.md`
- **Layering Standards:** `docs/LAYERING.md`
- **Architecture Overview:** `.serena/memories/architecture_overview.md`
- **Component Inventory:** `.serena/memories/component_inventory.md`

### Project Documentation

- **Development Guide:** `CLAUDE.md`
- **Zap Pilot Overview:** `README.md`

---

## Changelog

### 2025-01-17: Wallet UI Cleanup

- ✅ Removed experimental wallet variations (WalletUIVariation2, WalletUIVariation3)
- ✅ Renamed WalletUIVariation1 → WalletMenu
- ✅ Removed development toggle UI from WalletPortfolioPresenterV22
- ✅ Updated documentation (DATA_TESTID_GUIDE, V22_OVERVIEW)
- ✅ Validation: 0 TypeScript errors, 0 ESLint errors

### 2025-01-17: V1 Restoration & Documentation Consolidation

- ✅ Restored V1 as production default (commit 5ee6bbf)
- ✅ Cleaned up feature flags (commit dd1b4f6)
- ✅ Created V22_DEMO_ENHANCEMENT_PLAN.md
- ✅ Created consolidated V22_OVERVIEW.md
- ✅ Deprecated V22_MIGRATION_STATUS.md and V22_MIGRATION_ROADMAP.md

### 2025-12-16: V22 Production Deployment & Testing

- ✅ Deployed V22 as production default (commit e215ebf)
- ✅ Implemented percentage-based rollout system
- ✅ Added comprehensive E2E test suite (163 tests)
- ✅ Component instrumentation with data-testid attributes

### 2025-12-15: Multi-Wallet Integration

- ✅ Phase 2A: Core multi-wallet infrastructure
- ✅ Phase 2B: Wallet Manager UI enhancements
- ✅ Phase 2D: V22 portfolio integration with dropdown switcher
- ✅ ThirdWeb ConnectButton integration

### 2025-12-14: Backend API Assessment

- ✅ Phase 1: Comprehensive V2 endpoint evaluation
- ✅ Confirmed analytics-engine has all required APIs
- ✅ No database migrations needed

---

**Status:** V1 Production (Default) | V22 Demo (Active Development) **Next Action:** Implement V22
demo enhancements (wallet connect + transaction modals) **Estimated Timeline:** 7 days to complete
demo enhancements

_This document consolidates V22_MIGRATION_STATUS.md and V22_MIGRATION_ROADMAP.md. For historical
context, see git history._
