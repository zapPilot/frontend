#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Custom coverage threshold checker for Vitest
 * This script enforces coverage thresholds when Vitest's built-in enforcement fails
 */

const fs = require("fs");
const path = require("path");

const COVERAGE_FILE = path.join(__dirname, "../coverage/coverage-summary.json");
const THRESHOLDS = {
  statements: 20,
  branches: 78,
  functions: 48,
  lines: 20,
};

function checkCoverageThresholds() {
  // Check if coverage file exists
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error("❌ Coverage file not found. Run tests with coverage first.");
    process.exit(1);
  }

  // Read coverage data
  const coverage = JSON.parse(fs.readFileSync(COVERAGE_FILE, "utf8"));
  const { total } = coverage;

  console.log("\n📊 Coverage Threshold Check");
  console.log("─".repeat(50));

  let failed = false;
  const results = [];

  Object.entries(THRESHOLDS).forEach(([metric, threshold]) => {
    const actual = total[metric].pct;
    const passed = actual >= threshold;

    if (!passed) failed = true;

    const status = passed ? "✅" : "❌";
    const result = `${status} ${metric.padEnd(12)}: ${actual.toFixed(2).padStart(6)}% (threshold: ${threshold}%)`;

    results.push(result);
    console.log(result);
  });

  console.log("─".repeat(50));

  if (failed) {
    console.log("\n❌ Coverage thresholds not met!");
    process.exit(1);
  } else {
    console.log("\n✅ All coverage thresholds passed!");
    process.exit(0);
  }
}

checkCoverageThresholds();
