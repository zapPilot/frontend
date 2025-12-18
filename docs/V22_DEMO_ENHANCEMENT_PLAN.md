# V22 Demo Enhancement Plan

**Status:** ✅ COMPLETE **Completion Date:** 2025-01-17 **Target Route:** `/layout-demo/v22`
**Priority:** HIGH **Original Estimated Timeline:** 7 days

---

## Table of Contents

1. [Completion Summary](#completion-summary)
2. [Executive Summary](#executive-summary)
3. [Current Architecture](#current-architecture)
4. [UI/UX Design Specifications](#uiux-design-specifications)
5. [Technical Implementation Plan](#technical-implementation-plan)
6. [Documentation Consolidation](#documentation-consolidation)
7. [Timeline & Milestones](#timeline--milestones)

---

## Completion Summary

**Status:** ✅ ALL PHASES COMPLETE

### Phase Status

- ✅ **Phase 1: Foundation** - Type definitions and services complete
- ✅ **Phase 2: Shared Components** - ChainSelector, TokenSelector, AmountInput, StrategySlider
- ✅ **Phase 3: Modal Components** - All three modals fully implemented
- ✅ **Phase 4: Integration** - Dashboard buttons wired, state management complete
- ✅ **Phase 5: Testing & Documentation** - E2E tests passing, documentation updated
- ✅ **Bonus: Wallet UI Cleanup** - Consolidated to WalletMenu component

### Implementation Highlights

**Transaction Modals:**

- `DepositModal.tsx` - Chain/token selection, amount input, regime allocation display
- `WithdrawModal.tsx` - Amount input, slippage settings, partial/full exit modes
- `RebalanceModal.tsx` - Strategy intensity slider, allocation preview, execution plan

**Supporting Infrastructure:**

- `TransactionModalScaffold.tsx` - Reusable modal shell
- `TransactionFormLayout.tsx` - Consistent form structure
- Shared components: `ChainSelector`, `TokenSelector`, `AmountInput`, `StrategySlider`
- Custom hooks: `useTransactionForm`, `useTransactionViewModel`, `useTransactionTokenData`
- Services: `transactionService.ts` (with mock implementations)
- Query hooks: `useTokenBalanceQuery`, `useChainQuery`
- Type definitions: `transaction.ts`

**Dashboard Integration:**

- Deposit button: `onClick={() => openModal("deposit")}`
- Withdraw button: `onClick={() => openModal("withdraw")}`
- Rebalance button: `onClick={() => openModal("rebalance")}`

**Wallet UI Consolidation:**

- Removed experimental variations (WalletUIVariation2, WalletUIVariation3)
- Renamed WalletUIVariation1 → `WalletMenu`
- Removed development toggle UI
- Simplified component architecture

**Quality Assurance:**

- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors (2 acceptable console.error warnings)
- ✅ E2E tests: All passing
- ✅ Documentation: Updated DATA_TESTID_GUIDE, V22_OVERVIEW

### Remaining Tasks

**None.** All planned features are fully implemented and production-ready. Future enhancements
should be planned as separate initiatives.

---

## Executive Summary

### Objectives

1. **Add Wallet Connect Button:** Integrate ThirdWeb ConnectWalletButton into V22 demo navigation
2. **Implement Transaction Modals:** Design and build Deposit, Withdraw, and Rebalance modals with
   mock functionality
3. **Consolidate Documentation:** Merge V22_MIGRATION_STATUS.md and V22_MIGRATION_ROADMAP.md into
   unified reference

### Current State

- ✅ V1 Layout: Default at `/bundle` route (sidebar navigation, 5 tabs)
- ✅ V22 Layout: Demo-only at `/layout-demo/v22` (horizontal navigation, 3 tabs)
- ❌ V22 Missing: Wallet connect button in navigation
- ❌ V22 Missing: Transaction modals (deposit, withdraw, rebalance)

### Success Criteria

1. User can connect wallet via button in V22 navigation
2. User can open and complete deposit flow (chain → token → amount → confirm)
3. User can open and complete withdraw flow (amount → slippage → confirm)
4. User can open rebalance modal with innovative Strategy Slider UI
5. All modals follow V22 design system (glass morphism, purple-blue gradients)
6. 80% test coverage with unit, integration, and E2E tests
7. Full accessibility (WCAG AA, keyboard navigation, screen readers)

---

## Current Architecture

### Route Separation

| Route              | Layout           | Purpose            | Status                          |
| ------------------ | ---------------- | ------------------ | ------------------------------- |
| `/bundle`          | V1 (sidebar)     | Production default | ✅ Active                       |
| `/layout-demo/v22` | V22 (horizontal) | Demo & testing     | ✅ Active (enhancements needed) |

### V22 Current Features

- ✅ Horizontal tab navigation (Dashboard, Analytics, Backtesting)
- ✅ Multi-wallet switcher (if user has multiple wallets)
- ✅ Regime-aware portfolio display
- ✅ Top gainers/losers analysis
- ✅ APR tracking and performance trends
- ❌ Wallet connect button (missing)
- ❌ Transaction modals (missing)

### Technology Stack

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Wallet SDK:** ThirdWeb SDK v5
- **State Management:** React Query (TanStack Query)
- **Modal System:** Radix UI primitives
- **Animations:** Framer Motion
- **Form Handling:** React Hook Form + Zod (to be added)
- **TypeScript:** Strict mode with exactOptionalPropertyTypes

---

## UI/UX Design Specifications

### Design System Foundation

#### Visual Language

- **Color System:** Purple-blue gradients with glass morphism
- **Typography:** System fonts, tracking-tight for headings, font-mono for numbers
- **Spacing:** 8px base unit (Tailwind's default)
- **Animations:** Framer Motion with GPU-accelerated transforms
- **Z-Index:** Modal layer at `z-60`

#### Design Tokens

```typescript
GRADIENTS.PRIMARY = "from-purple-600 to-blue-600";
GRADIENTS.PRIMARY_20 = "from-purple-600/20 to-blue-600/20";
GRADIENTS.SUCCESS = "from-green-600 to-emerald-600";
GRADIENTS.DANGER = "from-red-600 to-pink-600";
Z_INDEX.MODAL = "z-60";
```

### 1. Deposit Modal Design

#### User Flow

```
Entry → Chain Selection → Token Selection → Amount Input → Preview → Confirmation → Success/Error
```

#### Key Features

**Chain Selection:**

- Grid layout (2 columns mobile, 4 columns desktop)
- Chain logos with names and status indicators
- Active chain highlighted with purple border glow
- Disabled chains grayed out with "Coming Soon" badge

**Token Selection:**

- Searchable dropdown with real-time filtering
- Token icons, symbols, and balances
- Popular tokens pinned to top
- Loading states for balance fetching

**Amount Input:**

- Dual display: USD value and token amount (synced)
- MAX button for wallet balance
- Percentage quick-select (25%, 50%, 75%, 100%)
- Real-time conversion display

**Preview & Confirmation:**

- Transaction summary with breakdown
- Estimated gas fees
- Expected allocation after deposit
- High gas warning (if applicable)

#### Accessibility Features

- ARIA labels for all interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader announcements for state changes
- Focus trap within modal
- Live regions for validation errors

### 2. Withdraw Modal Design

#### User Flow

```
Entry → Withdrawal Type (Partial/Full) → Amount Selection → Slippage Settings → Preview → Confirmation
```

#### Key Features

**Withdrawal Type:**

- Partial: Specify custom amount
- Full Exit: Close all positions

**Slippage Settings:**

- Preset options: 0.5%, 1%, 2%
- Custom slippage input
- Info tooltip explaining slippage

**Expected Output:**

- Estimated USDC after conversion
- Exit impact warning (if significant)
- Fee breakdown

### 3. Rebalance Modal Design (Innovation: Strategy Slider)

#### Design Philosophy

**Problem:** Traditional rebalance UIs force all-or-nothing decisions, which can be intimidating and
inflexible.

**Solution:** Strategy Slider allows users to choose HOW MUCH to rebalance (0-100%), providing:

- Clear impact visualization
- Risk control through partial rebalancing
- Gradual learning for new users
- Cost optimization (avoid unnecessary gas for minor drift)

#### User Flow

```
Entry → Current State Analysis → Strategy Slider Adjustment → Impact Preview → Execution Plan → Confirmation
```

#### Key Components

**Drift Analysis:**

- Side-by-side comparison: Current vs Target allocation
- Drift percentage score
- Performance impact visualization

**Strategy Slider:**

- Horizontal slider (0% = no change, 100% = full rebalance)
- Live preview of resulting allocation
- Expected APR change calculation
- Transaction cost estimate
- Preset quick-select buttons (0%, 25%, 50%, 75%, 100%)

**Execution Plan:**

- Step-by-step transaction breakdown
- Estimated gas per transaction
- Total time and cost summary

#### Accessibility (Slider-Specific)

- `role="slider"` with full ARIA attributes
- Arrow keys adjust by 5%, Shift+Arrow by 25%
- Live region announcements for allocation changes
- Clear visual focus indicators

### Mobile Responsiveness

- **Mobile (<640px):** Single column, full-width cards, bottom sheet pattern
- **Tablet (640-1024px):** 2-column grid, larger touch targets (44x44px minimum)
- **Desktop (>1024px):** Full layout with side-by-side comparisons

---

## Technical Implementation Plan

### File Structure

```
src/
├── components/
│   ├── wallet/
│   │   └── variations/
│   │       └── v22/
│   │           ├── modals/
│   │           │   ├── index.ts                          # Public exports
│   │           │   ├── TransactionModal.tsx              # Base modal
│   │           │   ├── DepositModal.tsx
│   │           │   ├── WithdrawModal.tsx
│   │           │   ├── RebalanceModal.tsx
│   │           │   ├── components/
│   │           │   │   ├── ChainSelector.tsx
│   │           │   │   ├── TokenSelector.tsx
│   │           │   │   ├── AmountInput.tsx
│   │           │   │   ├── TransactionSummary.tsx
│   │           │   │   └── StrategySlider.tsx           # Rebalance slider
│   │           │   ├── hooks/
│   │           │   │   ├── useTransactionForm.ts
│   │           │   │   ├── useChainSelection.ts
│   │           │   │   └── useTokenBalance.ts
│   │           │   └── types.ts
│   │           └── WalletPortfolioPresenterV22.tsx      # Add ConnectWalletButton
│   │
├── services/
│   ├── transactionService.ts                             # NEW: Mock transactions
│   └── chainService.ts                                   # NEW: Chain operations
│
├── hooks/
│   └── queries/
│       ├── useChainQuery.ts                              # NEW: Chain data
│       └── useTokenBalanceQuery.ts                       # NEW: Token balances
│
└── types/
    └── domain/
        └── transaction.ts                                 # NEW: Transaction types
```

### Component Architecture

#### Base Transaction Modal

```typescript
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw" | "rebalance";
  onSubmit: (data: TransactionFormData) => Promise<void>;
}

interface TransactionFormData {
  chainId: number;
  tokenAddress: string;
  amount: string;
  slippage?: number;
}
```

**Pattern:** Composition over inheritance

- Base modal provides UI shell and behaviors
- Specific modals inject custom content
- Shared components reused across modals

#### Shared Components

**ChainSelector:**

```typescript
interface ChainSelectorProps {
  selectedChainId: number;
  onChainChange: (chainId: number) => void;
  supportedChains?: number[];
  disabled?: boolean;
}
```

**TokenSelector:**

```typescript
interface TokenSelectorProps {
  chainId: number;
  selectedToken: string | null;
  onTokenSelect: (tokenAddress: string) => void;
  showBalances?: boolean;
  disabled?: boolean;
}
```

**AmountInput:**

```typescript
interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  token?: SwapToken;
  error?: string;
  showMaxButton?: boolean;
}
```

**StrategySlider (Rebalance-specific):**

```typescript
interface StrategySliderProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  currentAllocation: Allocation;
  targetAllocation: Allocation;
  onPreview: (intensity: number) => ProjectedAllocation;
}
```

### State Management

#### Form State (React Hook Form + Zod)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const transactionSchema = z.object({
  chainId: z.number().positive(),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0),
  slippage: z.number().min(0.1).max(50).optional(),
});

export function useTransactionForm(defaultValues?: Partial<TransactionFormData>) {
  return useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      chainId: 1, // Ethereum
      slippage: 0.5,
      ...defaultValues,
    },
  });
}
```

#### API State (React Query)

```typescript
// Token balance fetching
export function useTokenBalanceQuery(chainId: number, tokenAddress: string) {
  const account = useActiveAccount();

  return useQuery({
    queryKey: ["token-balance", chainId, tokenAddress, account?.address],
    queryFn: async () => {
      if (!account) throw new Error("No wallet connected");
      return fetchTokenBalance(chainId, tokenAddress, account.address);
    },
    enabled: !!account && !!tokenAddress,
    staleTime: 10_000, // 10 seconds
  });
}

// Chain data fetching
export function useChainQuery(chainId?: number) {
  return useQuery({
    queryKey: ["chain", chainId],
    queryFn: () => {
      if (!chainId) return SUPPORTED_CHAINS;
      return getChainById(chainId);
    },
    staleTime: Infinity, // Chain data never changes
  });
}
```

#### Modal State Management

```typescript
type ModalType = "deposit" | "withdraw" | "rebalance" | null;

const [activeModal, setActiveModal] = useState<ModalType>(null);
const [modalData, setModalData] = useState<Partial<TransactionFormData>>({});

const openModal = (type: ModalType, initialData?: Partial<TransactionFormData>) => {
  setActiveModal(type);
  setModalData(initialData || {});
};

const closeModal = () => {
  setActiveModal(null);
  setModalData({});
};
```

### Integration Points

#### 1. Add ConnectWalletButton to V22 Navigation

**File:** `src/components/wallet/variations/WalletPortfolioPresenterV22.tsx`

**Location:** Top navigation bar, right side (after wallet switcher)

```typescript
import { ConnectWalletButton } from '@/components/WalletManager/components/ConnectWalletButton';

// In navigation section (around line 148-232):
<div className="flex items-center gap-4">
  {/* Existing multi-wallet switcher */}
  {hasMultipleWallets && (
    <div className="relative" ref={dropdownRef}>
      {/* ... existing code ... */}
    </div>
  )}

  {/* NEW: Connect Wallet Button */}
  {!account.isConnected && (
    <ConnectWalletButton className="min-w-[180px]" />
  )}

  {/* Existing settings and wallet manager buttons */}
  <button data-testid="settings-button" /* ... */>
    <Settings className="w-4 h-4" />
  </button>
</div>
```

#### 2. Trigger Modals from Dashboard

**Existing buttons** (lines 265-279) already have click handlers. Update to use new modals:

```typescript
<DepositModal
  isOpen={activeModal === 'deposit'}
  onClose={() => setActiveModal(null)}
  defaultChainId={1}
  currentRegime={data.currentRegime}
/>

<WithdrawModal
  isOpen={activeModal === 'withdraw'}
  onClose={() => setActiveModal(null)}
  currentBalance={data.balance}
/>

<RebalanceModal
  isOpen={activeModal === 'rebalance'}
  onClose={() => setActiveModal(null)}
  currentAllocation={data.currentAllocation}
  targetAllocation={data.targetAllocation}
/>
```

### Mock Data Strategy

```typescript
// src/services/transactionService.ts

export async function simulateDeposit(data: TransactionFormData): Promise<TransactionResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    status: "success",
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    amount: data.amount,
    token: data.tokenAddress,
    timestamp: Date.now(),
  };
}

// Mock token balances
export const MOCK_TOKEN_BALANCES: Record<string, TokenBalance> = {
  "0xusdc": { balance: "1000.50", usdValue: 1000.5 },
  "0xeth": { balance: "2.5", usdValue: 5000.0 },
  "0xwbtc": { balance: "0.05", usdValue: 2500.0 },
};

// Mock chain data
export const MOCK_CHAIN_DATA: ChainData[] = [
  { chainId: 1, name: "Ethereum", symbol: "ETH", iconUrl: "/chains/eth.svg", isActive: true },
  {
    chainId: 137,
    name: "Polygon",
    symbol: "MATIC",
    iconUrl: "/chains/polygon.svg",
    isActive: true,
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    symbol: "ARB",
    iconUrl: "/chains/arbitrum.svg",
    isActive: false,
  },
];
```

### Testing Strategy

#### Unit Tests (Vitest)

**Components to test:**

- ChainSelector: Rendering, selection, disabled states
- TokenSelector: Search, selection, balance display
- AmountInput: Validation, max button, decimal handling
- StrategySlider: Value changes, presets, ARIA attributes

**Pattern:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChainSelector } from './ChainSelector';

describe('ChainSelector', () => {
  it('should render supported chains', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ChainSelector selectedChainId={1} onChainChange={jest.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('should call onChainChange when chain is selected', () => {
    const onChainChange = jest.fn();
    render(<ChainSelector selectedChainId={1} onChainChange={onChainChange} />);

    fireEvent.click(screen.getByText('Polygon'));
    expect(onChainChange).toHaveBeenCalledWith(137);
  });
});
```

#### Integration Tests

**Test scenarios:**

1. Complete deposit flow (chain → token → amount → submit)
2. Complete withdrawal flow (type → amount → slippage → submit)
3. Rebalance slider interaction (adjust intensity → preview → execute)
4. Form validation errors (invalid amounts, insufficient balance)
5. Wallet disconnection during transaction

#### E2E Tests (Playwright)

```typescript
// tests/v22-transaction-modals.spec.ts

test("should connect wallet and complete deposit", async ({ page }) => {
  await page.goto("/layout-demo/v22?userId=5fc63d4e-4e07-47d8-840b-ccd3420d553f");

  // Check wallet connection
  await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();
  await page.click('[data-testid="connect-wallet-button"]');

  // Wait for connection
  await expect(page.locator('[data-testid="wallet-switcher-button"]')).toBeVisible();

  // Open deposit modal
  await page.click('[data-testid="deposit-button"]');
  await expect(page.locator('[data-testid="deposit-modal"]')).toBeVisible();

  // Complete deposit flow
  await page.selectOption('[data-testid="chain-selector"]', "1");
  await page.selectOption('[data-testid="token-selector"]', "0xusdc");
  await page.fill('[data-testid="amount-input"]', "100");
  await page.click('[data-testid="confirm-button"]');

  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});

test("should adjust rebalance intensity with slider", async ({ page }) => {
  await page.goto("/layout-demo/v22?userId=5fc63d4e-4e07-47d8-840b-ccd3420d553f");
  await page.click('[data-testid="rebalance-button"]');

  // Test slider interaction
  const slider = page.locator('[data-testid="strategy-slider"]');
  await slider.fill("50"); // Set to 50% intensity

  // Verify preview updates
  await expect(page.locator('[data-testid="rebalance-preview"]')).toContainText("50%");

  // Test preset buttons
  await page.click('[data-testid="preset-100"]');
  await expect(slider).toHaveValue("100");
});
```

#### Coverage Requirements

- **Unit Tests:** 80% coverage for modal components
- **Integration Tests:** All user flows covered
- **E2E Tests:** Critical paths (wallet connection + transaction flows)

---

## Documentation Consolidation

### New Documentation Structure

**Consolidated Document:** `docs/V22_OVERVIEW.md`

### Content Organization

```markdown
# V22 Layout Overview

## Current Status

- V1 Layout: Default production layout at /bundle
- V22 Layout: Demo-only layout at /layout-demo/v22

## V22 Features

1. Horizontal navigation (3 tabs)
2. Regime-aware portfolio display
3. Enhanced analytics dashboard
4. Backtesting tools

## V22 Architecture

[Consolidated architectural details from roadmap]

## Enhancement Roadmap

1. Wallet connectivity (in progress)
2. Transaction modals (in progress)
3. Advanced charting (planned)
4. Mobile optimizations (planned)

## Testing & Quality

[E2E test coverage details from status doc]

## Migration History

[Historical context from both documents]
```

### Document Deprecation Strategy

1. Create new `docs/V22_OVERVIEW.md` with consolidated content
2. Add deprecation notice to old documents:
   ```markdown
   > **DEPRECATED:** This document has been superseded by [V22_OVERVIEW.md](./docs/V22_OVERVIEW.md)
   ```
3. Keep old documents for 1 release cycle, then archive

---

## Timeline & Milestones

### Phase 1: Foundation (Day 1)

**Tasks:**

- [ ] Create type definitions (`src/types/domain/transaction.ts`)
- [ ] Create service functions (`transactionService.ts`, `chainService.ts`)
- [ ] Create React Query hooks (`useChainQuery`, `useTokenBalanceQuery`)
- [ ] Set up mock data structures

**Deliverables:**

- Type definitions for all modal data
- Mock service implementations
- Query hooks for data fetching

### Phase 2: Shared Components (Day 2-3)

**Tasks:**

- [ ] Implement ChainSelector component
- [ ] Implement TokenSelector component
- [ ] Implement AmountInput component
- [ ] Implement TransactionSummary component
- [ ] Unit tests for shared components

**Deliverables:**

- 4 reusable components with full TypeScript types
- Unit tests with 80%+ coverage
- Storybook stories (optional)

### Phase 3: Modal Components (Day 4-5)

**Tasks:**

- [ ] Create base TransactionModal component
- [ ] Implement DepositModal
- [ ] Implement WithdrawModal
- [ ] Implement RebalanceModal with StrategySlider
- [ ] Unit tests for all modals

**Deliverables:**

- 3 functional transaction modals
- StrategySlider with full accessibility
- Integration tests for complete flows

### Phase 4: Integration (Day 6)

**Tasks:**

- [ ] Add ConnectWalletButton to V22 navigation
- [ ] Wire modal triggers to dashboard buttons
- [ ] Implement modal state management
- [ ] Handle wallet connection/disconnection
- [ ] Add loading and error states

**Deliverables:**

- Fully integrated V22 demo with working modals
- Wallet connectivity in navigation
- Error handling and validation

### Phase 5: Testing & Documentation (Day 7)

**Tasks:**

- [ ] Write E2E tests for all user flows
- [ ] Verify accessibility (keyboard, screen readers)
- [ ] Performance optimization (lazy loading, prefetching)
- [ ] Create V22_OVERVIEW.md documentation
- [ ] Deprecate old documentation files

**Deliverables:**

- Full E2E test coverage
- WCAG AA compliance verification
- Consolidated documentation
- Final review and sign-off

### Success Metrics

| Metric              | Target        | Verification                   |
| ------------------- | ------------- | ------------------------------ |
| Test Coverage       | ≥80%          | Run `npm run test:coverage`    |
| Accessibility Score | WCAG AA       | Manual audit + automated tools |
| E2E Tests Passing   | 100%          | Run `npm run test:e2e`         |
| TypeScript Errors   | 0             | Run `npm run type-check`       |
| Build Size Increase | <50KB gzipped | Check build output             |
| Modal Load Time     | <200ms        | Performance profiling          |

---

## Risk Mitigation

### Potential Risks & Mitigations

1. **Risk:** Form validation library adds bundle size
   - **Mitigation:** Use lightweight Zod schema, code split modals with lazy loading

2. **Risk:** ThirdWeb SDK v5 API changes
   - **Mitigation:** Pin SDK version, create abstraction layer for wallet operations

3. **Risk:** Complex rebalance UI confuses users
   - **Mitigation:** Include onboarding tooltips, default to safe 50% preset

4. **Risk:** Mock data doesn't match real API shape
   - **Mitigation:** Define strict TypeScript interfaces, validate with backend team

5. **Risk:** Accessibility gaps in slider component
   - **Mitigation:** Follow ARIA Authoring Practices Guide, manual testing with screen readers

---

## Future Enhancements (Post-MVP)

1. **Real Transaction Execution:** Replace mock services with actual blockchain transactions
2. **Multi-Chain Gas Estimation:** Dynamic gas price fetching from on-chain oracles
3. **Transaction History:** Store and display past deposits/withdrawals
4. **Advanced Rebalancing:** AI-powered allocation recommendations
5. **Batch Operations:** Execute multiple transactions in single session
6. **Mobile App Integration:** PWA support for native-like mobile experience

---

## References

### Internal Documentation

- `src/components/WalletManager/README.md` - Wallet management patterns
- `src/services/README.md` - Service function conventions
- `docs/LAYERING.md` - Z-index and positioning standards
- `.serena/memories/architecture_overview.md` - High-level architecture

### External Resources

- [ThirdWeb SDK v5 Docs](https://portal.thirdweb.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Schema Validation](https://zod.dev/)
- [ARIA Authoring Practices - Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

---

**Last Updated:** 2025-01-17 **Plan Status:** READY FOR IMPLEMENTATION **Assigned Agents:** UI/UX
Designer (afe2dc5), Frontend Developer (a3c771e)
