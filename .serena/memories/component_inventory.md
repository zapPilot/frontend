# Component Inventory - Complete Catalog

## 🎯 UI Components (`src/components/ui/`)

### **Button Components**

- **`GradientButton`** - Primary action button with gradient styling and loading states
- **`ActionButton`** - ✅ CONSOLIDATED: Now uses GradientButton internally with enhanced animations

### **Layout Components**

- **`GlassCard`** - Glass morphism container with backdrop blur effects
- **`AnimatedContainer`** - Motion wrapper with preset animation variants
- **`FadeInUp`**, **`FadeInScale`**, **`StaggerContainer`** - Animation convenience components

### **Data Display Components**

- **`APRMetrics`** - Annual percentage return display with styling variants
- **`ToastNotification`** - Success/error notification system with auto-dismiss

## 📊 Chart & Visualization (`src/components/`)

### **Chart Components**

- **`PieChart`** + **`PieChartLegend`** - Interactive pie chart with click handlers
- **`PortfolioChart`** - Multi-tab chart (performance, allocation, drawdown)
- **`PortfolioCharts`** (in PortfolioAllocation) - Feature-specific chart container
- **`PerformanceTrendChart`** - ✅ NEW: Historical APR trend chart with category filtering support,
  SVG-based, mobile-responsive with interactive tooltips

### **Data Tables**

- **`AssetCategoriesDetail`** - Detailed asset breakdown with balance hiding
- **`CategoryRow`** - Expandable row showing protocols and allocations

## 🔗 Web3 Components (`src/components/Web3/`)

### **Wallet Management**

- **`WalletButton`** - Primary wallet connection with dropdown menu
- **`SimpleConnectButton`** - Minimal wallet connection interface
- **`HeaderWalletControls`** - Navigation-integrated wallet controls

### **Chain Management**

- **`ChainSwitcher`** - ✅ ACTIVE: Canonical chain switching component (simple, effective,
  production-ready)
- ~~**`ChainSelector`**~~ - ❌ REMOVED: Unused over-engineered alternative (500 lines eliminated)

## 🏦 Portfolio Management (`src/components/PortfolioAllocation/`)

### **Core Portfolio Components**

- **`PortfolioAllocationContainer`** - Main feature container orchestrating portfolio logic
- **`EnhancedOverview`** - ✅ ENHANCED: Comprehensive portfolio overview with performance trend
  chart, premium UI animations, and multi-data views

### **Control Components**

- **`SwapControls`** - Token selection, amount input, and validation
- **`SlippageComponent`** - ✅ CONSOLIDATED: Unified slippage configuration with context-aware
  behavior (replaces SlippageSettings + SlippageSelector)
- **`TokenSelector`** - Token selection dropdown with search
- **`ValidationMessages`** - Form validation error/warning display
- **`AmountInput`** - ✅ NEW: Modular amount input with balance display, max buttons, and operation
  mode support (extracted from SwapControls and ActionCenter)

### **Display Components**

- **`OverviewHeader`** - Portfolio summary header with metrics
- **`CategoryListSection`** - Asset category listing and management
- **`RebalanceSummary`** - Rebalancing action summary and preview
- **`ExcludedCategoriesChips`** - Visual tags for excluded categories

## 💱 Trading & Swap (`src/components/SwapPage/`)

### **Core Trading Components**

- **`SwapPage`** - Main swap interface container
- **`SwapTab`** - Basic token swapping interface
- **`OptimizeTab`** - Portfolio optimization and dust conversion

### **Trading Controls**

- **`AmountButtons`** - Quick percentage amount selection (25%, 50%, 75%, 100%)
- **`TabNavigation`** - Operation mode switching (swap, optimize)

### **Progress & Status**

- **`UnifiedProgressModal`** - ✅ ACTIVE IN PRODUCTION: Mode-based progress modal supporting
  'intent' and 'optimization' workflows (replaced IntentProgressModal + OptimizationProgress).
  Currently used in SwapTab.tsx.
- **`StreamingProgress`** - Real-time operation progress display with technical details (inline
  component)
- **`WalletTransactionProgress`** - Wallet transaction batch progress (inline component)

### **Data Components**

- **`TradingSummary`** - Transaction summary with technical details
- **`EventsList`** - Trading event log with impact calculations
- **`OptimizationPreview`** - Preview of optimization actions
- **`OptimizationSelector`** - ✅ DISTINCT: Optimization options selector (not a duplicate of
  TokenSelector - different purpose)

## 🧭 Navigation & Layout (`src/components/`)

### **Navigation Components**

- **`Navigation`** - Main tab-based navigation system
- **`SwapPageHeader`** - Swap page navigation with back button

### **Tab Components**

- **`AnalyticsTab`** - ✅ ENHANCED: Analytics and metrics dashboard with integrated pool performance
  analytics
- **`AirdropTab`** - Token airdrop information and eligibility
- **`CommunityTab`** - Community links and engagement
- **`SettingsTab`** - Application settings and configuration

### **Settings Sub-Components**

- **`VersionInfo`** - App version display
- **`MenuSection`** - Settings menu section with items

## 📊 Pool Analytics (`src/components/PoolAnalytics/`)

### **Pool Performance Components** ✅ NEW (2025)

- **`PoolPerformanceTable`** - ✅ NEW: Comprehensive pool analytics table with sorting, filtering,
  and underperforming pool identification
  - **Purpose**: Display detailed pool performance metrics from APR API endpoint
  - **Features**: Sortable columns (APR, value, contribution, protocol), mobile-responsive cards,
    visual status indicators
  - **Integration**: Integrated into AnalyticsTab for pool-level performance analysis
  - **Technical**: Uses real APR data from `/api/v1/apr/portfolio/{userId}/summary` endpoint
  - **UX**: Color-coded performance indicators (green=good, yellow=underperforming, red=poor), chain
    badges, asset symbols

## 🌟 Analytics & Community Support (`src/components/MoreTab/`)

### **Shared Components**

- **`SocialLinks`** - Social media and external links
- **`PodcastSection`** - Podcast links and media
- **`AnalyticsDashboard`** - Advanced analytics visualization
- **`CommunityStats`** - Community metrics and statistics

These legacy-named components support the Analytics and Community tabs.

## 🎓 Onboarding (`src/components/Onboarding/`)

### **Guidance Components**

- **`TooltipHint`** - Contextual hints with positioning
- **`WalletConnectHint`**, **`ChainSwitchHint`**, **`NavigationHint`** - Pre-configured guidance
- **`MobileNavigationHint`** - Mobile-specific navigation guidance

## 🔧 Utility Components (`src/components/shared/`)

### **Image Components**

- **`ImageWithFallback`** - Robust image loading with fallback strategies
- **`TokenImage`** - Token logo display with symbol fallbacks

### **Portfolio Display**

- **`WalletPortfolio`** - ✅ ENHANCED: Main portfolio overview with balance controls and integrated
  APR data
- **`PortfolioOverview`** - Portfolio summary with category expansion
- **`WalletManager`** - Multi-wallet management interface

## 🎣 Custom Hooks Inventory (`src/hooks/`)

### **Web3 Hooks**

- **`useWallet`** - Wallet connection and state management
- **`useChain`** - Blockchain network management
- **`useWalletConnection`** - Connection lifecycle management
- **`useWalletEvents`** - Wallet event monitoring

### **Portfolio Hooks**

- **`usePortfolio`** - Portfolio data and calculations
- **`useStrategyPortfolio`** - Strategy-specific portfolio logic
- **`useDustZap`** - Dust token conversion functionality
- **`useDustZapStream`** - Streaming dust conversion

### **APR & Analytics Hooks** ✅ NEW (2025)

- **`usePortfolioAPR`** - ✅ NEW: Real-time APR data fetching with pool details
  - **Purpose**: Fetch portfolio APR summary and individual pool performance data
  - **Features**: React Query integration, automatic refetching, error handling, loading states
  - **Integration**: Used in WalletMetrics for accurate Portfolio APR display and AnalyticsTab for
    pool analytics
  - **Technical**: Connects to `/api/v1/apr/portfolio/{userId}/summary` endpoint with caching and
    retry logic

### **Feature-Specific Hooks**

- **`useToast`** - Toast notification system
- **`useCancellableOperation`** - Async operation cancellation
- **`useDropdown`** - ✅ CONSOLIDATED: Common dropdown state patterns (used by 5+ components)

### **PortfolioAllocation Hooks**

- **`usePortfolioData`** - Portfolio data processing
- **`useRebalanceData`** - Rebalancing calculations
- **`useSlippage`** - Slippage management with presets
- **`useTargetChartData`** - Target allocation visualization
- **`useChartDataTransforms`** - Chart data transformations
- **`useCategoryFilters`** - Category filtering logic

### **SwapPage Hooks**

- **`useOptimizationData`** - Portfolio optimization logic
- **`useWalletTransactions`** - Transaction batch management
- **`useUIState`** - UI state management
- **`useTokenState`** - Token selection and management

## 🔍 Component Usage Patterns

### **High-Reuse Components** (Used in multiple features)

- `GlassCard` - Layout container used throughout
- `GradientButton` - Primary action button across features
- `TokenImage` - Token display in multiple contexts
- `AnimatedContainer` - Animation wrapper used widely
- `AmountInput` - ✅ NEW: Reusable amount input across swap and portfolio features

### **Feature-Specific Components** (Single-use)

- `PortfolioAllocationContainer` - Portfolio feature only
- `SwapPage` - Trading feature only
- `ChainSwitcher` - Web3 wallet controls only
- `PerformanceTrendChart` - EnhancedOverview decision support only
- `PoolPerformanceTable` - AnalyticsTab pool analytics only

### **Composition Patterns**

- Container components orchestrate feature logic
- Presentational components handle display only
- Hook components encapsulate business logic
- Utility components provide cross-cutting concerns

## 🧹 Recent Cleanup (Component Consolidation)

### **Successfully Consolidated:**

1. **SlippageComponent** - Unified slippage settings (eliminated SlippageSettings +
   SlippageSelector)
2. **UnifiedProgressModal** - Consolidated progress tracking (eliminated IntentProgressModal +
   OptimizationProgress)
3. **useDropdown** - Common dropdown patterns (5+ components now use shared hook)
4. **ChainSwitcher** - Canonical chain switching (eliminated unused ChainSelector - 500 lines
   removed)
5. **AmountInput** - ✅ NEW (2025): Modular amount input component (extracted from SwapControls and
   ActionCenter duplicates)

### **Recent Additions:**

1. **PerformanceTrendChart** - ✅ NEW (2025): Historical APR visualization for transaction decision
   support
   - **Purpose**: Shows historical portfolio performance to aid zapin/zapout/rebalance decisions
   - **Features**: Category filtering integration, SVG-based custom charts, mobile-responsive design
   - **Integration**: Seamlessly integrated into EnhancedOverview between header and actions
   - **Technical**: Uses existing chart utilities (generateSVGPath, generateAreaPath) for
     consistency
   - **UX**: Follows decision-making psychology: Current state → Historical context → Action
     decision

2. **AmountInput** - ✅ NEW (2025): Modular amount input for financial transactions
   - **Purpose**: Unified amount input across all swap, zap, and rebalance operations
   - **Features**: Operation mode-aware labels, currency symbol display, balance/portfolio info, max
     buttons
   - **Integration**: Extracted from duplicate code in SwapControls.tsx and ActionCenter.tsx
   - **Technical**: Supports zapIn (token balance), zapOut/rebalance (portfolio value) modes
   - **UX**: Consistent input experience across all financial operations

3. **PoolPerformanceTable** - ✅ NEW (2025): Pool-level performance analytics with real APR data
   - **Purpose**: Display and analyze individual pool performance metrics to identify
     underperforming positions
   - **Features**: Real-time APR data, sortable table, mobile-responsive cards, visual performance
     indicators, chain/protocol identification
   - **Integration**: Integrated into AnalyticsTab alongside existing performance charts
   - **Technical**: Uses new APR API endpoint with React Query integration for caching and real-time
     updates
   - **UX**: Color-coded performance states, detailed pool information, contribution percentage
     analysis

4. **usePortfolioAPR Hook** - ✅ NEW (2025): Real APR data integration replacing hardcoded values
   - **Purpose**: Fetch accurate portfolio-wide APR and individual pool performance data
   - **Features**: React Query integration, automatic caching, error handling, monthly income
     calculations
   - **Integration**: Used in WalletMetrics for accurate Portfolio APR display and AnalyticsTab for
     pool analytics
   - **Technical**: Connects to `/api/v1/apr/portfolio/{userId}/summary` endpoint with optimized
     query strategies
   - **UX**: Real-time APR updates, accurate estimated monthly income, loading states

### **API Integration Enhancements:**

1. **WalletMetrics APR Enhancement** - ✅ ENHANCED (2025): Real APR data integration
   - **Change**: Replaced hardcoded `BUSINESS_CONSTANTS.PORTFOLIO.DEFAULT_APR` with live API data
   - **Features**: Real Portfolio APR display, accurate Est. Monthly Income calculations, fallback
     to default APR when API unavailable
   - **Integration**: Seamless integration with existing loading/error states
   - **UX**: More accurate financial projections based on actual pool performance

2. **AnalyticsTab Pool Analytics** - ✅ ENHANCED (2025): Added pool-level performance analysis
   - **Change**: Added comprehensive pool performance section with detailed analytics
   - **Features**: Pool performance table, underperforming pool identification, sortable metrics,
     mobile-responsive design
   - **Integration**: Integrated alongside existing portfolio charts and analytics dashboard
   - **UX**: Enhanced decision-making capabilities with pool-level insights

### **Architecture Benefits:**

- **Reduced Duplication**: Eliminated 5 duplicate components
- **Improved Consistency**: Unified patterns across features, consistent financial input experience
- **Better Maintainability**: Single source of truth for common functionality
- **Cleaner Codebase**: 650+ lines of duplicate code removed
- **Enhanced Decision Support**: Users now have historical context for financial decisions
- **Modular Financial Controls**: Reusable amount input component across all transaction types
- **Real APR Data**: Accurate portfolio performance metrics replacing static calculations
- **Pool-Level Analytics**: Granular performance insights for optimization decisions
