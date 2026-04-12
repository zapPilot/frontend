#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const nextDir = path.join(projectRoot, ".next");

if (!fs.existsSync(nextDir)) {
  console.log("[next-clean] .next is already clean");
  process.exit(0);
}

fs.rmSync(nextDir, { recursive: true, force: true });
console.log("[next-clean] Removed .next cache and build output");
