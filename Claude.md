# CLAUDE.md - Zap Pilot Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

Zap Pilot is a modern DeFi portfolio management Progressive Web App built with Next.js 15, React 19,
and TypeScript. It provides intelligent portfolio analytics, intent-based trading operations, and
real-time APR data for optimal DeFi portfolio management.

### Core Features

- **Portfolio Management**: Real-time portfolio analytics with APR data and performance trends
- **Intent-Based Trading**: ZapIn, ZapOut, and Optimize operations with unified progress tracking
- **Bundle Sharing**: Deep-linked portfolio sharing with visitor/owner modes
- **Multi-Chain Support**: Ethereum, Polygon, and other EVM chains via ThirdWeb SDK
- **Pool Analytics**: Individual pool performance analysis with underperforming position
  identification
- **PWA Support**: Offline-capable mobile app with service worker integration

## Architecture

This is a static-export Next.js application with a service-first, component-based architecture:

- **Service Layer**: All API operations use service functions (`src/services/`)
- **Component System**: Feature-based organization with reusable UI components
- **State Management**: React Query for API state, React Context for global state
- **Type Safety**: Comprehensive TypeScript with strict configuration
- **Security**: Hardened CSP headers and security best practices

### Key Architectural Patterns

- **Service Functions**: Plain functions for all API operations (no classes)
- **Custom Hooks**: Business logic encapsulation and state management
- **Component Composition**: Reusable components with clear prop interfaces
- **Error Boundary**: Comprehensive error handling with user-friendly fallbacks
- **Performance**: React.memo, useMemo, and lazy loading for optimization

## Project Structure & Module Organization

- `src/app`: Next.js App Router entry points (`layout.tsx`, `page.tsx`)
- `src/components`: Reusable UI components organized by feature
  - `ui/`: Design system components (buttons, cards, loading states)
  - `PortfolioAllocation/`: Main portfolio management feature
  - `SwapPage/`: Trading and optimization interface
  - `Web3/`: Wallet connectivity and chain management
  - `PoolAnalytics/`: Pool performance analysis components
  - `shared/`: Cross-feature shared components
- `src/hooks`: Custom hooks for business logic and state management
- `src/services`: API integration service functions
- `src/lib`: Utilities, formatters, and helper functions
- `src/types`: TypeScript type definitions
- `src/config`: Configuration files and constants
- `public/`: Static assets and PWA configuration

## Development Commands

### Core Development

```bash
npm run dev          # Start Next.js dev server (Turbopack) at localhost:3000
npm run dev:turbo    # Explicit Turbopack mode
npm run dev:webpack  # Fallback to Webpack mode
npm run build        # Production build with static export
npm run start        # Serve production build
```

### Code Quality & Testing

```bash
npm run lint            # ESLint check with auto-fix
npm run lint:fix        # Fix all auto-fixable issues
npm run format          # Prettier formatting
npm run format:check    # Check formatting without changes
npm run type-check      # TypeScript type checking

# Testing
npm test                # Run Vitest tests (memory optimized)
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report with thresholds
npm run test:safe       # Memory-safe test runner
npm run test:e2e        # Playwright E2E tests
npm run test:e2e:ui     # Playwright with UI mode
npm run test:e2e:debug  # Debug mode for E2E tests
npm run test:all        # Full test suite (coverage + E2E)
```

## Key API Integration Points

### Service Architecture

All API operations use service functions for consistency:

```typescript
// src/services/accountService.ts - User & wallet management
export async function connectWallet(address: string): Promise<UserProfile>;
export async function addWallet(userId: string, walletData: WalletData): Promise<Wallet>;

// src/services/intentService.ts - Transaction execution
export async function executeZapIn(request: ZapInRequest): Promise<TransactionResult>;
export async function executeOptimize(request: OptimizeRequest): Promise<OptimizationResult>;

// src/services/analyticsService.ts - Portfolio analytics
export async function getPortfolioAPR(userId: string): Promise<PortfolioAPRData>;
export async function getPoolPerformance(userId: string): Promise<PoolPerformanceData[]>;
```

### React Query Integration

API state management uses React Query patterns:

```typescript
// Custom hooks in src/hooks/queries/
export function usePortfolioQuery(userId: string) {
  return useQuery({
    queryKey: ["portfolio", userId],
    queryFn: () => analyticsService.getPortfolioData(userId),
  });
}
```

## Bundle Sharing System

### URL Structure

- **Bundle URL**: `/bundle?userId=<wallet-address>`
- **Owner Mode**: Connected user viewing their own bundle (full functionality)
- **Visitor Mode**: Viewing someone else's bundle or disconnected viewing (read-only)

### Implementation Components

- `BundlePageEntry`: URL parameter extraction and routing
- `BundlePageClient`: Page-level logic with switch banner management
- `SwitchPromptBanner`: Banner for connected users viewing other bundles
- `bundleService`: URL generation and ownership logic

## Component Development Patterns

### UI Component Structure

```typescript
// src/components/ui/ - Design system components
interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function GradientButton({ variant = "primary", ...props }: ButtonProps) {
  // Implementation with consistent styling and animation
}
```

### Feature Component Organization

```typescript
// src/components/PortfolioAllocation/ - Feature-based structure
PortfolioAllocation/
├── components/        # Feature-specific UI components
├── hooks/            # Business logic hooks
├── types.ts          # Domain types
├── utils/            # Feature utilities
└── index.ts          # Public API exports
```

### Custom Hook Patterns

```typescript
// Business logic encapsulation
export function usePortfolioData(userId: string) {
  const query = usePortfolioQuery(userId);
  const analytics = usePortfolioAPR(userId);

  return {
    portfolio: query.data,
    apr: analytics.data,
    isLoading: query.isLoading || analytics.isLoading,
    error: query.error || analytics.error,
  };
}
```

## Styling & Design System

### Tailwind CSS Configuration

- **Framework**: Tailwind CSS v4 with PostCSS
- **Theme**: Custom purple-blue gradients with glass morphism
- **Responsive**: Mobile-first design with desktop enhancements
- **Dark Mode**: Default dark theme optimized for DeFi applications

### Design Tokens

```typescript
// src/constants/design-system.ts
export const Z_INDEX = {
  CONTENT: "z-10",
  BANNER: "z-20",
  HEADER: "z-30",
  MODAL: "z-40",
  TOOLTIP: "z-50",
};

export const HEADER = {
  HEIGHT: "h-16",
  TOP_OFFSET: "top-16",
};
```

### Animation System

- **Framework**: Framer Motion for declarative animations
- **Performance**: GPU-accelerated transforms and transitions
- **Patterns**: Stagger animations, fade transitions, and micro-interactions

## Web3 Integration

### Wallet Connectivity

- **SDK**: ThirdWeb SDK v5 for wallet management
- **Chains**: Multi-chain support with chain switching
- **Authentication**: Wallet-based user authentication

### Transaction Handling

```typescript
// Intent-based transaction execution
const { mutate: executeZapIn, isPending } = useMutation({
  mutationFn: intentService.executeZapIn,
  onSuccess: result => {
    // Handle successful transaction
  },
  onError: error => {
    // Handle transaction error
  },
});
```

## Testing Strategy

### Unit Testing (Vitest)

- **Location**: `tests/unit/` directory
- **Patterns**: Component testing with React Testing Library
- **Mocking**: Service function mocks for isolation
- **Coverage**: Minimum 80% coverage threshold

### E2E Testing (Playwright)

- **Location**: `tests/` directory with `.spec.ts` files
- **Coverage**: Critical user flows and wallet interactions
- **Mobile**: Responsive testing across device sizes

### Testing Best Practices

```typescript
// Component testing example
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function renderWithProviders(component: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}
```

## Performance Optimization

### Build Optimization

- **Static Export**: Pre-rendered static site generation
- **Code Splitting**: Route-based and component-level splitting
- **Tree Shaking**: Automatic unused code elimination
- **Image Optimization**: Next.js image optimization with CDN support

### Runtime Performance

- **React Query Caching**: Intelligent API response caching with stale-while-revalidate
- **Component Memoization**: React.memo for expensive components
- **Hook Optimization**: useMemo and useCallback for computation caching
- **Animation Performance**: CSS transforms for smooth 60fps animations

## Security & Compliance

### Content Security Policy

- **Strict CSP**: Comprehensive headers preventing XSS attacks
- **Web3 Security**: Secure wallet connection domains
- **Development/Production**: Environment-specific security policies

### Data Protection

- **Input Validation**: Comprehensive form validation with Zod schemas
- **Error Handling**: Safe error messages without data leakage
- **Wallet Security**: Read-only portfolio access for visitor mode

## Development Workflow

### Code Quality Gates

1. **Pre-commit Hooks**: Husky + lint-staged for automated checks
2. **TypeScript**: Strict type checking with no implicit any
3. **ESLint**: Comprehensive linting with Next.js and React rules
4. **Prettier**: Consistent code formatting

### Development Best Practices

- **Service Functions**: Use service functions for all API operations
- **Type Safety**: Comprehensive TypeScript types for all data structures
- **Error Boundaries**: Wrap components with error boundaries
- **Loading States**: Provide loading and error states for all async operations
- **Accessibility**: ARIA labels and keyboard navigation support

### Testing Before Commits

```bash
# Recommended pre-commit sequence
npm run type-check    # TypeScript compilation
npm run lint         # ESLint fixes
npm run test:unit    # Unit test suite
npm run test:e2e     # E2E test suite (if relevant changes)
```

### Memory Management

Due to the complex nature of the application, use memory-optimized commands:

- Use `npm run test:safe` for memory-constrained environments
- Use `npm run dev` with NODE_OPTIONS for development
- Monitor test execution with `--maxConcurrency=1` for stability

## AI Development Support

This project includes comprehensive AI agent configuration:

- **Architecture Memory**: `.serena/memories/architecture_overview.md`
- **Component Inventory**: `.serena/memories/component_inventory.md`
- **Service Documentation**: `docs/SERVICES.md` for API integration patterns
- **Layer Management**: `docs/LAYERING.md` for z-index and positioning standards

The codebase is designed with AI-friendly patterns, comprehensive documentation, and consistent
conventions to facilitate automated development and maintenance.

---

_Last updated: 2025-01-17 | Zap Pilot v0.1.0 | Next.js 15 + React 19 + TypeScript 5_
