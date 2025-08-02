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

- **`AnalyticsTab`** - Analytics and metrics dashboard
- **`AirdropTab`** - Token airdrop information and eligibility
- **`CommunityTab`** - Community links and engagement
- **`SettingsTab`** - Application settings and configuration

### **Settings Sub-Components**

- **`VersionInfo`** - App version display
- **`MenuSection`** - Settings menu section with items

## 🌟 Feature-Specific Tabs (`src/components/MoreTab/`)

### **More Tab Components**

- **`SocialLinks`** - Social media and external links
- **`PodcastSection`** - Podcast links and media
- **`AnalyticsDashboard`** - Advanced analytics visualization
- **`CommunityStats`** - Community metrics and statistics

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

- **`WalletPortfolio`** - Main portfolio overview with balance controls
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

### **Feature-Specific Components** (Single-use)

- `PortfolioAllocationContainer` - Portfolio feature only
- `SwapPage` - Trading feature only
- `ChainSwitcher` - Web3 wallet controls only
- `PerformanceTrendChart` - EnhancedOverview decision support only

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

### **Architecture Benefits:**

- **Reduced Duplication**: Eliminated 4 duplicate components
- **Improved Consistency**: Unified patterns across features, PerformanceTrendChart uses existing
  SVG chart patterns
- **Better Maintainability**: Single source of truth for common functionality
- **Cleaner Codebase**: 500+ lines of unused code removed
- **Enhanced Decision Support**: Users now have historical context for financial decisions
