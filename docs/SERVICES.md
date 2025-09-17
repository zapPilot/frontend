# Service Module Conventions

To keep service integrations consistent across the app:

- Locate all network-facing modules under `src/services/`.
- Export plain functions instead of classes or ad-hoc singletons.
- Use the shared `executeServiceCall` helper (see `src/services/serviceHelpers.ts`) to wrap HTTP
  calls and map errors with each service's error factory.
- Obtain HTTP clients from `httpUtils` (e.g. `httpUtils.accountApi`, `httpUtils.intentEngine`).
- Prefer typed request/response signatures for every exported function.
- Re-export service namespaces via `src/services/index.ts` so other modules can import from a single
  entrypoint when desired.
- Utility-only services (such as bundle helpers) should follow the same function-export pattern and
  keep logging centralized through `@/utils/logger`.

Following these guidelines keeps error handling, typing, and imports uniform and makes it easier to
add new backend integrations safely.
