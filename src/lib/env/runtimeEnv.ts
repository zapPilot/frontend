type EnvValue = string | boolean | undefined;

type EnvRecord = Record<string, EnvValue>;

const MODE_ALIASES = {
  development: "development",
  production: "production",
  test: "test",
} as const;

function readImportMetaEnv(key: string): EnvValue {
  return (import.meta.env as EnvRecord | undefined)?.[key];
}

function readProcessEnv(key: string): EnvValue {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env[key];
}

function normalizePublicEnvKey(key: string): string[] {
  if (key.startsWith("VITE_")) {
    return [key];
  }

  if (key.startsWith("NEXT_PUBLIC_")) {
    return [`VITE_${key.slice("NEXT_PUBLIC_".length)}`, key];
  }

  return [key];
}

function readFirstDefined(keys: string[]): string | undefined {
  for (const key of keys) {
    const importMetaValue = readImportMetaEnv(key);
    if (typeof importMetaValue === "string") {
      return importMetaValue;
    }

    const processValue = readProcessEnv(key);
    if (typeof processValue === "string") {
      return processValue;
    }
  }

  return undefined;
}

/**
 * Read a runtime environment variable with Vite-first public env compatibility.
 *
 * Public keys automatically fall back from `VITE_*` to `NEXT_PUBLIC_*` during
 * the migration so existing local env files keep working.
 *
 * @param key - Environment variable name to read.
 * @returns The first defined string value, if present.
 *
 * @example
 * ```ts
 * const apiUrl = getRuntimeEnv("NEXT_PUBLIC_API_URL");
 * ```
 */
export function getRuntimeEnv(key: string): string | undefined {
  return readFirstDefined(normalizePublicEnvKey(key));
}

/**
 * Resolve the current runtime mode in a way that works in Vite, Vitest, and Node.
 *
 * @returns One of `development`, `production`, `test`, or the raw mode string.
 *
 * @example
 * ```ts
 * if (getRuntimeMode() === "development") {
 *   console.debug("debug mode");
 * }
 * ```
 */
export function getRuntimeMode(): string {
  const processMode = readProcessEnv("NODE_ENV");
  if (typeof processMode === "string" && processMode.length > 0) {
    return processMode;
  }

  const importMetaMode = readImportMetaEnv("MODE");
  if (typeof importMetaMode === "string" && importMetaMode.length > 0) {
    return importMetaMode;
  }

  return MODE_ALIASES.development;
}

/**
 * Determine whether the current runtime matches a specific mode.
 *
 * @param mode - Runtime mode to compare against.
 * @returns `true` when the active mode matches.
 *
 * @example
 * ```ts
 * const isProd = isRuntimeMode("production");
 * ```
 */
export function isRuntimeMode(mode: "development" | "production" | "test"): boolean {
  return getRuntimeMode() === MODE_ALIASES[mode];
}
