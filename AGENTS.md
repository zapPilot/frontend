# Repository Guidelines

## Project Structure & Module Organization

- `src/app`: Next.js App Router entry (`layout.tsx`, `page.tsx`).
- `src/components`: Reusable UI (PascalCase, e.g., `WalletManager.tsx`).
- `src/hooks`, `src/contexts`, `src/providers`: State and dependency wiring.
- `src/utils`, `src/lib`, `src/services`: Pure utilities, helpers, and API adapters.
- `src/config`, `src/constants`, `src/types`: App settings, constants, and TypeScript types.
- `public/`: Static assets; `cloudflare/`: deployment config; `tests/`: e2e and unit tests.

## Build, Test, and Development Commands

- `npm run dev`: Start Next.js dev server (Turbopack) at localhost:3000.
- `npm run build` / `npm start`: Production build and serve.
- `npm run lint` / `npm run lint:fix`: ESLint check/fix.
- `npm run format` / `npm run format:check`: Prettier write/check.
- `npm run type-check`: TypeScript type checking (no emit).
- `npm test`: Run Playwright tests. Variants: `test:ui`, `test:headed`, `test:debug`, `test:report`.
- Unit tests: `node --test tests/unit` (uses Node’s built-in test runner).

## Coding Style & Naming Conventions

- Language: TypeScript + React (Next.js). Files: `.ts` / `.tsx` for components.
- Prettier: 2 spaces, semicolons, double quotes, width 80, LF EOL, `arrowParens: "avoid"`.
- ESLint: Next + TS config; disallow unused vars, prefer `const`, enforce hooks rules.
- Naming: Components in PascalCase (`src/components/FooBar.tsx`); hooks start with `useX`; contexts
  end with `Context`; providers end with `Provider`.

## Testing Guidelines

- E2E: Playwright specs in `tests/*.spec.ts`. Disabled specs may have `.disabled` suffix—rename to
  enable.
- Unit: Node test files in `tests/unit/*.test.js`. Keep tests deterministic and side-effect free.
- Run locally: `npm test` (e2e) and `node --test tests/unit` (unit). Add screenshots or attach
  Playwright report when relevant (`npm run test:report`).

## Commit & Pull Request Guidelines

- Commits: Use concise, conventional prefixes when possible (`feat:`, `fix:`, `docs:`, `test:`,
  `refactor:`, `chore:`, `ci:`). Use imperative voice and optional scope (e.g.,
  `feat(Portfolio): add chart zoom`).
- PRs: Provide summary, linked issues (`#123`), screenshots/GIFs for UI, and a test plan (commands
  run). Keep PRs focused and small.

## Security & Configuration Tips

- Never commit secrets. Copy `.env.example` to `.env.local` and update locally.
- Check `next.config.ts` for runtime/config flags. Do not commit `.next/` or `out/` artifacts.
