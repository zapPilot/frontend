# Development Commands

## Primary Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## Code Quality Commands

```bash
# Linting
npm run lint           # Check for linting errors
npm run lint:fix       # Auto-fix linting errors

# Formatting
npm run format         # Format all files with Prettier
npm run format:check   # Check if files are properly formatted

# Type checking
npm run type-check     # TypeScript compilation check (no emit)
```

## Testing Commands

```bash
# Playwright E2E testing
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:headed   # Run tests in headed mode (visible browser)
npm run test:debug    # Debug tests
npm run test:report   # Show test report
```

## Git Hooks

- **Pre-commit**: Automatically runs prettier and eslint on staged files
- **Husky**: Manages git hooks
- **lint-staged**: Runs tools only on staged files

## System Commands (macOS)

```bash
# File operations
ls -la                # List files with details
find . -name "*.tsx"  # Find TypeScript React files
grep -r "pattern"     # Search for patterns in files
```
