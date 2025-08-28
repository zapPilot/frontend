# Zap Pilot - Architectural Overview

## High-Level System Architecture

Zap Pilot is a sophisticated DeFi frontend application with a layered, feature-based architecture:

### 🏗️ Core Architecture Layers

#### 1. **Presentation Layer** (`src/app/`, `src/components/`)

- **Main App**: Single-page application with tab-based navigation
- **Component Hierarchy**: Feature-based organization with clear boundaries
- **UI Design System**: Consistent styling with Tailwind CSS + design tokens

#### 2. **Business Logic Layer** (`src/hooks/`, `src/lib/`, `src/utils/`, `src/services/`)

- **Custom Hooks**: Encapsulate complex business logic and state management
- **Service Functions**: ✅ **STANDARDIZED (2025)**: All API operations now use service functions
  instead of client classes
- **Utility Libraries**: Portfolio calculations, chart generation, formatting
- **Web3 Integration**: Wallet connectivity, chain management, transaction handling

#### 3. **Data Layer** (`src/types/`, `src/constants/`, `src/data/`)

- **Type System**: Comprehensive TypeScript definitions for all data structures
- **Configuration**: Chain definitions, portfolio constants, trading parameters
- **Mock Data**: Development and testing data fixtures

#### 4. **Infrastructure Layer** (`src/providers/`, `src/config/`)

- **Context Providers**: Global state management for wallet, onboarding
- **Configuration**: Multi-chain support, wallet adapters, environment settings

## 🎯 Feature Architecture

### **Portfolio Management System**

```
PortfolioAllocation/
├── components/           # UI components for allocation features
│   ├── Charts/          # Data visualization components
│   ├── Controls/        # User input and validation
│   ├── Actions/         # Action buttons and triggers
│   ├── Categories/      # Asset category management
│   └── Summary/         # Results and overview displays
├── hooks/               # Portfolio-specific business logic
├── utils/               # Data processing utilities
└── types.ts             # Portfolio domain types
```

### **Web3 Integration System**

```
Web3/
├── WalletButton         # Primary wallet interaction component
├── ChainSelector        # Multi-chain network switching
├── SimpleConnectButton  # Lightweight connection interface
└── HeaderWalletControls # Navigation-integrated controls
```

### **Swap & Trading System**

```
SwapPage/
├── SwapTab              # Basic swap interface
├── OptimizeTab          # Portfolio optimization features
├── hooks/               # Trading-specific logic (optimization, UI state, tokens)
└── components/          # Specialized trading UI elements
```

## 🔄 Data Flow Architecture - **UPDATED (2025)**

### **Service Function Architecture** ✅ **STANDARDIZED**

**NEW PATTERN**: All API operations use service functions for consistency and simplicity

```
src/services/
├── accountService.ts     # User & wallet management (replaces accountApiClient)
├── intentService.ts      # Transaction execution (replaces intentEngineClient)
├── backendService.ts     # Notifications & reporting (replaces backendApiClient)
├── analyticsEngine.ts    # Portfolio analytics (existing, enhanced)
└── userService.ts        # User data transformations (enhanced wrapper)
```

### **Service Function Benefits:**

- **Consistency**: Single architectural pattern across all APIs
- **Simplicity**: Easier to test, mock, and understand than client classes
- **React Query Integration**: Better compatibility with existing query patterns
- **Bundle Size**: Lighter weight, reduced complexity
- **Error Handling**: Structured errors where needed, simpler patterns where sufficient

### **Remaining Client Classes** (External Services Only):

- **DeBank API Client**: External service, complex authentication, kept as client class

### **State Management Pattern**

1. **React Context** for global application state (wallet, onboarding)
2. **Custom Hooks** for feature-specific state management
3. **Service Functions** for all API operations (standardized pattern)
4. **Component State** for UI-only concerns
5. **Constants** for configuration and static data

### **Component Communication**

- **Props Down**: Data flows from parent to child components
- **Callbacks Up**: Events bubble up through callback props
- **Context**: Global state accessible throughout component tree
- **Custom Hooks**: Shared logic between components
- **Service Functions**: Centralized API operations

## 🎨 Design System Architecture

### **Styling Strategy**

- **Tailwind CSS**: Utility-first styling framework
- **Design Tokens**: Centralized styling constants (`src/constants/design-system.ts`)
- **Glass Morphism**: Consistent visual theme with backdrop blur effects
- **Gradient System**: Predefined color gradients for branding

### **Animation Framework**

- **Framer Motion**: Declarative animations and transitions
- **Animation Containers**: Reusable animation wrappers
- **Staggered Animations**: Coordinated element entrance effects

## 🔌 Integration Points

### **External Services**

- **ThirdWeb SDK**: Web3 wallet connectivity and transactions
- **Chain Networks**: Multi-chain blockchain integration
- **DeBank API**: External DeFi data (client class pattern)
- **Mock APIs**: Development-time data simulation

### **Internal Services** ✅ **UPDATED (2025)**

- **Account Service**: User and wallet management via service functions
- **Intent Service**: Transaction execution via service functions
- **Backend Service**: Notifications and reporting via service functions
- **Analytics Engine**: Portfolio calculations via service functions
- **Wallet Management**: Address formatting, transaction batching

## 🛡️ Type Safety Architecture

### **TypeScript Strategy**

- **Strict Mode**: Maximum type safety with comprehensive checking
- **Domain Types**: Specific type definitions for each feature area
- **Interface Consistency**: Props interfaces for all components
- **Type Guards**: Runtime type validation where needed
- **Service Error Types**: Structured error handling for each service

## 📊 Performance Architecture

### **Optimization Patterns**

- **React.memo**: Component memoization for expensive renders
- **useMemo/useCallback**: Hook-level memoization for computations
- **Lazy Loading**: Code splitting for route-based loading
- **Animation Performance**: CSS transforms and GPU acceleration
- **Service Function Efficiency**: Lighter API layer reduces bundle size

## 🔍 Key Architectural Decisions - **UPDATED (2025)**

1. **Service Function Standardization**: ✅ **NEW** - Migrated from mixed client classes/service
   functions to standardized service function pattern
2. **Feature-Based Organization**: Groups related functionality together
3. **Composition Over Inheritance**: React component composition patterns
4. **Hook-First Design**: Business logic encapsulated in custom hooks
5. **Type-Driven Development**: TypeScript-first approach with strict typing
6. **Configuration-Based Flexibility**: Environment and chain configuration externalized
7. **External Service Boundary**: Client classes reserved only for external APIs (DeBank)

## 🧹 **Architecture Cleanup (2025)**

### **Dead Code Elimination:**

- ✅ **Removed**: `analytics-engine-client.ts` (367 lines of unused code)
- ✅ **Removed**: `account-api-client.ts`, `intent-engine-client.ts`, `backend-api-client.ts`
- ✅ **Cleaned**: `src/lib/clients/index.ts` exports and imports

### **Standardization Benefits:**

- **Single Pattern**: Developers no longer need to choose between client classes vs service
  functions
- **Consistency**: All internal APIs use the same approach
- **Maintenance**: Reduced cognitive overhead and code duplication
- **Testing**: Unified mocking and testing strategies
- **Bundle Size**: Eliminated class overhead for simple API operations

### **Migration Results:**

- **~1000 lines** of duplicate/unused code removed
- **TypeScript Compilation**: ✅ Clean, no errors
- **Functionality**: ✅ Preserved, all features working
- **Error Handling**: ✅ Enhanced in service functions where needed

## 🤖 AI Development Aids

- `.serena/` stores project memories and configuration for the Serena agent.
- `Claude.md` and `.claude/commands/` document workflows for the Claude agent.
- **Service Function Pattern**: Use `src/services/` for new API endpoints, follow existing patterns
