#!/usr/bin/env node

/**
 * Runs Knip and ts-prune back-to-back so that we catch unused files,
 * dependencies, and orphaned exports (including those hidden behind barrel files).
 *
 * Usage:
 *   npm run deadcode           -> default mode
 *   npm run deadcode:ci        -> CI/json reporter
 *   npm run deadcode:fix       -> Knip auto-fix + ts-prune report
 *   npm run deadcode:check     -> Knip check mode + ts-prune report
 */

const { spawnSync } = require("node:child_process");

const MODES = {
  default: {
    label: "Local dead-code scan",
    knipArgs: ["--exports", "--dependencies"],
    tsPruneArgs: [],
  },
  ci: {
    label: "CI dead-code scan",
    knipArgs: ["--exports", "--dependencies", "--reporter=json"],
    tsPruneArgs: [],
  },
  fix: {
    label: "Knip --fix + ts-prune",
    knipArgs: ["--exports", "--dependencies", "--fix"],
    tsPruneArgs: [],
  },
  check: {
    label: "Knip check + ts-prune",
    knipArgs: ["--exports", "--dependencies", "--no-config-hints"],
    tsPruneArgs: [],
  },
};

const modeKey = process.argv[2] ?? "default";
const mode = MODES[modeKey];

if (!mode) {
  console.error(
    `[deadcode] Unknown mode "${modeKey}". Supported modes: ${Object.keys(
      MODES
    ).join(", ")}`
  );
  process.exit(1);
}

const run = (command, args) => {
  console.log(`[deadcode] Running ${command} ${args.join(" ")}`.trim());
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(result.error);
  }

  if (typeof result.status === "number") {
    return result.status;
  }

  // If the process was terminated by a signal, treat it as failure.
  return result.signal ? 1 : 0;
};

const knipStatus = run("knip", mode.knipArgs);

// Run ts-prune for informational purposes only (many false positives from Next.js/internal modules)
// Only fail the build based on knip's more accurate analysis
run("ts-prune", ["-p", "tsconfig.tsprune.json", ...mode.tsPruneArgs]);

// Exit based only on knip status (ts-prune has too many false positives)
process.exit(knipStatus);
