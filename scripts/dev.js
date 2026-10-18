#!/usr/bin/env node

import { spawn } from "node:child_process";

// 1. Initial build to guarantee dist/ is ready
console.log("Compiling TypeScript...");
const initialBuild = spawn("pnpm", ["exec", "tsc"], { stdio: "inherit" });

initialBuild.on("close", (code) => {
  if (code !== 0) {
    console.error("Initial TypeScript build failed.");
    process.exit(code ?? 1);
  }

  console.log("Starting TUI in live development mode...");

  // 2. Start tsc compiler in watch mode in the background
  const tscWatch = spawn(
    "pnpm",
    ["exec", "tsc", "-w", "--preserveWatchOutput"],
    { stdio: "ignore" }
  );

  // 3. Start node --watch in foreground with full inherited stdin (no keystroke interception)
  const nodeWatch = spawn(
    "node",
    ["--watch", "--watch-path=dist", "dist/cli.js"],
    { stdio: "inherit" }
  );

  const cleanup = () => {
    try {
      tscWatch.kill();
    } catch {
      // ignore
    }
    try {
      nodeWatch.kill();
    } catch {
      // ignore
    }
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
  process.on("exit", cleanup);

  nodeWatch.on("close", (exitCode) => {
    cleanup();
    process.exit(exitCode ?? 0);
  });
});
