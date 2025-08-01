# Task Completion Checklist

## Required Steps After Making Changes

### 1. Code Quality Checks

```bash
# MANDATORY - Run these after any code changes:
npm run type-check     # Ensure TypeScript compiles without errors
npm run lint          # Check for linting issues
npm run format:check  # Verify formatting is correct
```

### 2. Auto-fixes (if needed)

```bash
npm run lint:fix      # Auto-fix linting issues
npm run format        # Auto-format code
```

### 3. Testing (recommended)

```bash
npm test              # Run Playwright tests to ensure functionality
```

### 4. Build Verification (for significant changes)

```bash
npm run build         # Ensure production build succeeds
```

## Pre-commit Hooks

The project automatically runs formatting and linting on staged files via husky and lint-staged, but
manual verification is recommended for comprehensive changes.

## Common Issues to Check

- **TypeScript errors**: Strict type checking is enabled
- **Unused imports/variables**: Will cause linting errors
- **Missing exports**: Check index.ts files are updated
- **Component naming**: Ensure PascalCase for components
- **Path aliases**: Use `@/` prefix for imports from src/
