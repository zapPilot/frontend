# Integration Patterns - Component Relationships

## 🏗️ Architectural Integration Patterns

### **Container-Presentational Pattern**

Most features follow a clear separation between logic and presentation:

```
FeatureContainer (business logic)
├── FeatureHeader (display)
├── FeatureControls (user input)
├── FeatureDisplay (data visualization)
└── FeatureActions (operations)
```

### **Hook-Component Integration**

Business logic is extracted into custom hooks that components consume:

```
useFeatureLogic() → FeatureComponent
├── Data processing hooks
├── State management hooks
└── Event handling hooks
```

## 🔄 Cross-Feature Integration Points

### **Web3 Provider Integration**

All Web3 functionality integrates through centralized providers:

```
Web3Provider
├── WalletContext → useWallet()
├── ChainContext → useChain()
└── WalletEvents → useWalletEvents()
```

**Integration Pattern:**

- Components import Web3 hooks
- Hooks access provider context
- State updates propagate automatically

### **Toast Notification System**

Cross-cutting notification system integrated via context:

```
ToastProvider
└── useToast() → Any Component
    ├── showToast(success/error/info)
    └── Auto-dismiss with timing
```

## 📊 Feature Integration Flows

### **Portfolio → Swap Integration**

Portfolio data flows into swap functionality:

```
WalletPortfolio
├── onOptimizeClick → SwapPage
├── onZapInClick → SwapPage
└── onZapOutClick → SwapPage

SwapPage
├── Receives strategy context
├── Uses portfolio data for optimization
└── Returns to portfolio on completion
```

### **Wallet → Portfolio Integration**

Wallet connection enables portfolio features:

```
WalletButton (connected)
├── Enables WalletPortfolio display
├── Provides account context
└── Triggers portfolio data loading

useWallet() + usePortfolio()
├── Wallet address → Portfolio queries
├── Chain changes → Portfolio refresh
└── Disconnection → Portfolio clear
```

## 🎨 UI Integration Patterns

### **Design System Integration**

Consistent styling through shared components and tokens:

```
Design Tokens (constants/design-system.ts)
├── GRADIENTS → GradientButton, headers
├── GLASS_MORPHISM → GlassCard, modals
├── ANIMATION_CONFIG → AnimatedContainer
└── LAYOUT → spacing, sizing
```

### **Chart Integration Pattern**

Charts integrate with multiple data sources:

```
Chart Data Sources
├── Portfolio data → PortfolioChart
├── Allocation data → PieChart
├── Performance data → PortfolioCharts
└── Rebalance data → Target charts

Chart Integration:
useChartDataTransforms() → Chart Components
├── Data processing hooks
├── Animation coordination
└── Responsive sizing
```

### **Form Integration Pattern**

Form components integrate validation and state:

```
Form Controls Integration:
Parent Component
├── Form state management
├── Validation logic (useCallback)
├── Submit handlers
└── Error display

Child Form Components:
├── TokenSelector → validation
├── SlippageSettings → warnings
├── ValidationMessages → errors
└── ActionButton → submit state
```

## 🔗 Data Flow Integration

### **Top-Down Data Flow**

```
App (page.tsx)
├── Tab state management
├── Strategy context
└── Navigation state

Feature Containers
├── Receive props from App
├── Manage feature-specific state
├── Coordinate child components
└── Handle feature actions

Child Components
├── Receive data via props
├── Handle UI-specific state
├── Emit events via callbacks
└── Focus on presentation
```

### **Context-Based Integration**

Global state flows through React Context:

```
Context Providers (providers/)
├── WalletProvider → wallet state
├── OnboardingProvider → guided tour
└── ToastProvider → notifications

Component Integration:
Any Component
├── useContext(WalletContext)
├── useContext(OnboardingContext)
└── useContext(ToastContext)
```

## 🎯 Feature-Specific Integration

### **PortfolioAllocation Integration**

Complex feature with multiple integration points:

```
PortfolioAllocationContainer
├── usePortfolioData() → data processing
├── useRebalanceData() → calculations
├── useCategoryFilters() → filtering
└── Child component coordination

Integration with:
├── SwapControls → user input
├── EnhancedOverview → display
├── Charts → visualization
└── ActionButton → operations
```

### **SwapPage Integration**

Multi-tab interface with shared state:

```
SwapPage Container
├── Tab state management
├── Operation mode context
└── Navigation coordination

Tab Components:
├── SwapTab → basic swapping
├── OptimizeTab → portfolio optimization
└── Shared hooks for common logic

Integration Hooks:
├── useOptimizationData()
├── useWalletTransactions()
├── useTokenState()
└── useUIState()
```

## 🔄 State Synchronization Patterns

### **Multi-Component State Sync**

Components that need synchronized state use shared hooks:

```
Shared State Pattern:
useFeatureState()
├── Centralized state management
├── Multiple component subscriptions
└── Coordinated updates

Example: Portfolio exclusion state
├── CategoryRow → toggle exclusion
├── ExcludedCategoriesChips → display
├── EnhancedOverview → filtering
└── Charts → data updates
```

### **Event-Driven Integration**

Components communicate through callback events:

```
Event Flow Pattern:
Parent → Child (props)
├── Data down
├── Event handlers down
└── Configuration down

Child → Parent (callbacks)
├── User actions up
├── State changes up
└── Error events up
```

## 🛠️ Integration Best Practices

### **Dependency Injection Pattern**

Components receive dependencies rather than importing directly:

```
// Good: Dependency injection
<SwapControls
  tokenValidator={validateToken}
  priceProvider={getPriceData}
  onError={handleError}
/>

// Avoid: Direct imports in components
import { validateToken } from '../utils'
```

### **Interface Standardization**

Consistent interfaces for similar components:

```
Standard Props Patterns:
- xxxProps interface for all components
- onXxx naming for event handlers
- xxxConfig for configuration objects
- isXxx for boolean flags
- xxxState for state objects
```

### **Error Boundary Integration**

Error handling integrated at feature boundaries:

```
Error Handling Flow:
Component Error
├── Catch in nearest boundary
├── Log to error service
├── Show user-friendly message
└── Provide recovery options
```
