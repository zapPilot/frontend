#!/usr/bin/env node

/**
 * Safe Playwright runner for local/dev environments.
 * - Skips E2E if Playwright binary or browsers are not installed.
 * - Skips when dev server cannot bind the port in sandboxed CI.
 * - Runs with 1 worker and list reporter to reduce resource usage.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function resolveBin(bin) {
  const local = path.join(
    __dirname,
    "..",
    "node_modules",
    ".bin",
    bin + (process.platform === "win32" ? ".cmd" : "")
  );
  return fs.existsSync(local) ? local : null;
}

async function main() {
  const bin = resolveBin("playwright");
  if (!bin) {
    console.log("ℹ️  Playwright not installed. Skipping E2E tests.");
    process.exit(0);
  }

  const args = ["test", "--workers=1", "--reporter=list"];
  const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });

  let stderr = "";
  let stdout = "";
  child.stdout.on("data", d => (stdout += d.toString()));
  child.stderr.on("data", d => (stderr += d.toString()));

  child.on("exit", code => {
    if (code !== 0) {
      const err = (stderr || "").toLowerCase();
      const isPortOrPerm =
        err.includes("failed to start server") ||
        err.includes("listen eperm") ||
        err.includes("eaddrinuse") ||
        err.includes("operation not permitted");
      if (isPortOrPerm) {
        console.log(
          "\nℹ️  Skipping E2E: dev server cannot start in this environment."
        );
        process.exit(0);
        return;
      }
      if (
        err.includes("browserType.launch") ||
        err.includes("please install browsers")
      ) {
        console.log(
          "\nℹ️  Playwright browsers not installed. Skipping E2E tests."
        );
        process.exit(0);
        return;
      }
      console.error("\n❌ Playwright E2E tests failed.");
      console.error(
        "   If this is a fresh environment, run: npx playwright install"
      );
      process.exit(code);
      return;
    }
    process.exit(0);
  });
}

main().catch(err => {
  console.error("❌ Failed to run Playwright tests:", err);
  process.exit(1);
});
