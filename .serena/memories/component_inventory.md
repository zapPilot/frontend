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

### **Data Tables**

- **`AssetCategoriesDetail`** - Detailed asset breakdown with balance hiding
- **`CategoryRow`** - Expandable row showing protocols and allocations

## 🔗 Web3 Components (`src/components/Web3/`)

### **Wallet Management**

- **`WalletButton`** - Primary wallet connection with dropdown menu
- **`SimpleConnectButton`** - Minimal wallet connection interface
- **`HeaderWalletControls`** - Navigation-integrated wallet controls

### **Chain Management**

- **`ChainSelector`** - Network switching with latency indicators
- **`ChainSwitcher`** - Simplified chain switching component

## 🏦 Portfolio Management (`src/components/PortfolioAllocation/`)

### **Core Portfolio Components**

- **`PortfolioAllocationContainer`** - Main feature container orchestrating portfolio logic
- **`EnhancedOverview`** - Comprehensive portfolio overview with multiple data views

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
- **`OptimizationSelector`** - Token selection for optimization

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
- `IntentProgressModal` - Swap-specific progress tracking

### **Composition Patterns**

- Container components orchestrate feature logic
- Presentational components handle display only
- Hook components encapsulate business logic
- Utility components provide cross-cutting concerns
