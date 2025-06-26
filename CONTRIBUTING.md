# Contributing to Zap Pilot

Thank you for your interest in contributing to Zap Pilot! This document provides guidelines for
contributing to the project.

## Development Setup

### Prerequisites

- Node.js 20+ and npm
- Git
- VS Code (recommended with suggested extensions)

### Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd zap-pilot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install recommended VS Code extensions** The project includes a `.vscode/extensions.json` file
   with recommended extensions that will enhance your development experience.

4. **Start development server**
   ```bash
   npm run dev
   ```

## Code Quality Standards

### Formatting with Prettier

We use Prettier for consistent code formatting:

```bash
# Check formatting
npm run format:check

# Auto-fix formatting
npm run format
```

### Linting with ESLint

ESLint ensures code quality and catches potential issues:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### TypeScript Type Checking

Strict TypeScript checking is enabled:

```bash
# Type check
npm run type-check
```

## Pre-commit Hooks

The project uses Husky and lint-staged to run quality checks before commits:

- **Prettier** - Formats staged files
- **ESLint** - Lints and fixes staged files
- **TypeScript** - Type checks (in CI)

These hooks run automatically when you commit. If they fail, fix the issues before committing.

## Coding Standards

### File Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── styles/             # Global styles and Tailwind utilities
```

### TypeScript Guidelines

- Use strict TypeScript settings (already configured)
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Use enums for constants with multiple values
- Export types and interfaces when they might be reused

### React/Next.js Guidelines

- Use functional components with hooks
- Prefer server components when possible (Next.js 13+ App Router)
- Use client components only when necessary (`"use client"`)
- Follow React hooks rules (enforced by ESLint)
- Use semantic HTML elements
- Ensure accessibility (a11y) compliance

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow the established design system (purple/blue gradients, glass morphism)
- Implement responsive design (mobile-first)
- Use CSS custom properties for theme values
- Prefer Tailwind over custom CSS when possible

### Component Guidelines

```typescript
// Good: Proper component structure
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({ children, variant = "primary", disabled, onClick }: ButtonProps) {
  return (
    <button
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-secondary"}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

## Commit Guidelines

### Commit Message Format

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(dashboard): add portfolio composition chart
fix(auth): resolve wallet connection issue
docs(readme): update installation instructions
style(components): format button component
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for complex components
- Use React Testing Library for component tests
- Aim for good test coverage (>80%)
- Test accessibility features

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Run quality checks**

   ```bash
   npm run format
   npm run lint
   npm run type-check
   npm test
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push and create PR**

   ```bash
   git push origin feat/your-feature-name
   ```

6. **PR Requirements**
   - All CI checks must pass
   - Code review approval required
   - No merge conflicts
   - Updated documentation (if applicable)

## CI/CD Pipeline

The project uses GitHub Actions for:

- **Code Quality**: Prettier, ESLint, TypeScript checks
- **Security**: Dependency audit and vulnerability scanning
- **Build**: Next.js production build verification
- **Testing**: Automated test execution

All checks must pass before merging.

## Architecture Decisions

### Design System

- **Colors**: Purple-blue gradients (#8b5cf6 to #3b82f6)
- **Dark Theme**: Primary background (#0a0a0f)
- **Glass Morphism**: Backdrop blur with transparency
- **Typography**: Geist Sans font family
- **Animations**: Framer Motion for interactions

### State Management

- React's built-in state for component state
- Consider adding Zustand or Jotai for global state when needed
- Server state management with React Query (future addition)

### Performance

- Next.js 15 with Turbopack for fast builds
- Image optimization with next/image
- Code splitting and lazy loading
- PWA optimizations for mobile performance

## Getting Help

- Check existing issues and discussions
- Review documentation and code comments
- Ask questions in pull request reviews
- Follow the project's coding patterns

## License

By contributing to Zap Pilot, you agree that your contributions will be licensed under the project's
license.
