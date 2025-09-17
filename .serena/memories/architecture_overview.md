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
- **Service Functions**: All API operations use service functions for consistency and simplicity
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
├── SimpleConnectButton  # Lightweight connection interface
├── ChainSwitcher        # Multi-chain network switching
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

## 🔄 Data Flow Architecture

### **Service Function Architecture**

All API operations use service functions for consistency and simplicity:

```
src/services/
├── accountService.ts     # User & wallet management
├── intentService.ts      # Transaction execution
├── analyticsService.ts   # Portfolio analytics & APR data
├── bundleService.ts      # URL generation & sharing
└── userService.ts        # User data transformations
```

### **HTTP Utilities** (`src/lib/http-utils.ts`)

- **Shared Logic**: Common HTTP request handling, error types, retry logic
- **Service Utilities**: Pre-configured utilities for each API endpoint
- **Error Handling**: Unified error types (APIError, NetworkError, TimeoutError)

### **Service Function Benefits:**

- **Consistency**: Single architectural pattern across all APIs
- **Simplicity**: Easier to test, mock, and understand than client classes
- **React Query Integration**: Better compatibility with existing query patterns
- **Bundle Size**: Lighter weight, reduced complexity
- **Error Handling**: Structured errors where needed, simpler patterns where sufficient

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

- **Tailwind CSS**: Utility-first styling framework v4
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
- **Mock APIs**: Development-time data simulation

### **Internal Services**

- **Account Service**: User and wallet management via service functions
- **Intent Service**: Transaction execution via service functions
- **Analytics Service**: Portfolio calculations and APR data via service functions
- **Bundle Service**: URL generation and sharing logic via service functions
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

## 🔍 Key Architectural Decisions

1. **Service Function Standardization**: All internal APIs use service functions
2. **Feature-Based Organization**: Groups related functionality together
3. **Composition Over Inheritance**: React component composition patterns
4. **Hook-First Design**: Business logic encapsulated in custom hooks
5. **Type-Driven Development**: TypeScript-first approach with strict typing
6. **Configuration-Based Flexibility**: Environment and chain configuration externalized

## 🧹 Architecture Benefits

### **Single Pattern**: Service functions for all internal APIs (no more dual architecture)

### **Consistency**: Unified approach eliminates developer confusion

### **Maintenance**: Reduced cognitive overhead and code duplication

### **Testing**: Simplified mocking with service function pattern

### **Bundle Size**: Eliminated class overhead for simple API operations

### **Type Safety**: Direct service function types vs generic API client

## 🤖 AI Development Aids

- `.serena/` stores project memories and configuration for the Serena agent.
- `CLAUDE.md` documents workflows for the Claude agent.
- **Service Function Pattern**: Use `src/services/` for new API endpoints, follow existing patterns
