---
description: Frontend Optimization Workflow (Dead Code, Coverage, Refactoring)
---

This workflow automates the process of optimizing the frontend codebase by removing dead code,
increasing test coverage, and refactoring for maintainability.

**Working Directory**: `/Users/chouyasushi/htdocs/all-weather-protocol/frontend`

### 1. Remove Dead Code

First, identify and remove unused exports and files.

1. Run `npm run deadcode:exports` to identify potential dead code.
2. Manually investigate and remove unused exports. **Verify they are not false positives (e.g.
   Next.js pages/layouts)**.
3. If confident, you can run `npm run deadcode:fix` (if available/reliable), otherwise delete
   manually.
4. **Validation**: Run `npm run type-check` to ensure no regressions.

### 2. Validate (Pre-Commit Check)

Run the full pre-commit suite to validate the cleanup. // turbo

```bash
/Users/chouyasushi/htdocs/all-weather-protocol/frontend/.husky/pre-commit
```

_Note: This script runs type-check, deadcode checks, linting, duplication checks, and all tests._

### 3. Increase Test Coverage

Identify gaps and add tests.

1. Run `npm run test:safe:coverage` to generate the coverage report.
2. Analyze the report (usually in `coverage/index.html` or output summary).
3. Create or update unit tests in `tests/unit/` to cover uncovered logic.
4. Ensure all new tests pass.

### 4. Validate (Pre-Commit Check)

Run the validation suite again to ensure new tests pass and no regressions. // turbo

```bash
/Users/chouyasushi/htdocs/all-weather-protocol/frontend/.husky/pre-commit
```

### 5. Refactor & Modularize (SOLID/DRY)

Improve code quality in targeted areas.

1. **Identify**: Look for large files, duplicated logic (use `npm run dup:check`), or tightly
   coupled components.
2. **Refactor**:
   - Extract reusable logic into custom hooks (`src/hooks/`).
   - Move utility functions to `src/lib/` or specialized util files.
   - Break large components into smaller chunks in `src/components/`.
   - Apply **SOLID** principles (Single Responsibility, etc.).
3. **Verify**: Ensure the app builds and runs correctly.

### 6. Validate (Pre-Commit Check)

Final validation before committing. // turbo

```bash
/Users/chouyasushi/htdocs/all-weather-protocol/frontend/.husky/pre-commit
```

### 7. Commit

Commit the changes if all validation passes.

```bash
git add .
git commit -m "refactor(frontend): optimize code, remove dead code, and improve coverage"
```
