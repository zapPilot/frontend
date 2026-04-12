#!/usr/bin/env node

const { spawn } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const launchCwd = process.cwd();
const [, , subcommand, ...forwardArgs] = process.argv;
const expectedNodeMajor = 20;
const currentNodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);

if (!subcommand) {
  console.error(
    "[next-runner] Usage: node scripts/run-next.js <dev|build|start> [args...]"
  );
  process.exit(1);
}

let nextBin;

try {
  nextBin = require.resolve("next/dist/bin/next", {
    paths: [projectRoot],
  });
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Failed to resolve local Next.js";
  console.error(`[next-runner] ${message}`);
  process.exit(1);
}

process.chdir(projectRoot);

if (currentNodeMajor !== expectedNodeMajor) {
  console.warn(
    `[next-runner] Warning: detected Node ${process.versions.node}. Dev memory baselines are only validated on Node ${expectedNodeMajor}; run \`nvm use\` before comparing RAM usage.`
  );
}

const bundler = forwardArgs.includes("--webpack")
  ? "webpack"
  : forwardArgs.includes("--turbopack")
    ? "turbopack"
    : "default";

console.log(
  `[next-runner] launch_cwd=${launchCwd} cwd=${projectRoot} command=${subcommand} bundler=${bundler}`
);

const child = spawn(process.execPath, [nextBin, subcommand, ...forwardArgs], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

const forwardSignal = signal => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => {
  forwardSignal("SIGINT");
});

process.on("SIGTERM", () => {
  forwardSignal("SIGTERM");
});

child.on("error", error => {
  console.error(`[next-runner] Failed to start Next.js: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
