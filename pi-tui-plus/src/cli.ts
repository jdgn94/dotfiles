#!/usr/bin/env node

import { ProcessTerminal, TuiAltScreen } from "@earendil-works/pi-tui";
import { AgentManager } from "./state/agent-manager.js";
import { GitWatcher } from "./state/git-watcher.js";
import { MetricsTracker } from "./state/metrics-tracker.js";
import { SpecGraphWatcher } from "./state/spec-graph-watcher.js";
import { TodoTracker } from "./state/todo-tracker.js";
import { ToolLogger } from "./state/tool-logger.js";
import { AppLayout } from "./ui/app-layout.js";

async function main() {
  const cwd = process.cwd();

  // Initialize Terminal & TUI
  const terminal = new ProcessTerminal();
  const tui = new TuiAltScreen(terminal, false, undefined, {
    mouse: true,
    wheelScrollLines: 3,
  });

  // State collectors
  const gitWatcher = new GitWatcher(cwd);
  const metricsTracker = new MetricsTracker();
  const toolLogger = new ToolLogger();
  const todoTracker = new TodoTracker();
  const specGraphWatcher = new SpecGraphWatcher(cwd);
  const agentManager = new AgentManager(
    cwd,
    metricsTracker,
    toolLogger,
    gitWatcher,
    todoTracker
  );

  // Layout Root
  const layout = new AppLayout(
    tui,
    agentManager,
    metricsTracker,
    gitWatcher,
    todoTracker,
    toolLogger,
    specGraphWatcher
  );

  tui.setLayoutRoot(layout);
  tui.setFocus(layout);

  // Clean exit handlers
  const cleanup = () => {
    try {
      tui.stop();
      gitWatcher.dispose();
      specGraphWatcher.dispose();
      agentManager.dispose();
    } catch {
      // ignore
    }
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGHUP", () => {
    cleanup();
    process.exit(0);
  });
  process.on("uncaughtException", (err) => {
    cleanup();
    console.error("Uncaught exception in pi-tui-plus:", err);
    process.exit(1);
  });

  // Start services
  await gitWatcher.init();
  await specGraphWatcher.init();
  tui.start();

  // Initialize agent session
  try {
    await agentManager.init();
    tui.requestRender();
  } catch (err: any) {
    tui.stop();
    console.error("Error initializing Pi session:", err?.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error starting pi-tui-plus:", err);
  process.exit(1);
});
