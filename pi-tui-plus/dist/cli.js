#!/usr/bin/env node
import * as path from "node:path";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { ProcessTerminal, TuiAltScreen } from "@earendil-works/pi-tui";
import { AgentManager } from "./state/agent-manager.js";
import { GitWatcher } from "./state/git-watcher.js";
import { MetricsTracker } from "./state/metrics-tracker.js";
import { SpecGraphWatcher } from "./state/spec-graph-watcher.js";
import { TodoTracker } from "./state/todo-tracker.js";
import { ToolLogger } from "./state/tool-logger.js";
import { AppLayout } from "./ui/app-layout.js";
import { SixelOverlay } from "./ui/sixel-overlay.js";
async function resolveSessionManager(cwd) {
    const args = process.argv.slice(2);
    let sessionArg;
    let continueSession = false;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--continue" || arg === "-c") {
            continueSession = true;
        }
        else if (arg === "--session" || arg === "-s") {
            sessionArg = args[++i];
        }
        else if (arg.startsWith("--session=")) {
            sessionArg = arg.slice("--session=".length);
        }
        else if (arg === "--session-id") {
            sessionArg = args[++i];
        }
        else if (arg.startsWith("--session-id=")) {
            sessionArg = arg.slice("--session-id=".length);
        }
    }
    if (continueSession) {
        return SessionManager.continueRecent(cwd);
    }
    if (!sessionArg) {
        return undefined;
    }
    const isPath = sessionArg.includes("/") ||
        sessionArg.includes("\\") ||
        sessionArg.endsWith(".jsonl");
    if (isPath) {
        try {
            return SessionManager.open(path.resolve(cwd, sessionArg));
        }
        catch (err) {
            console.error(`Could not open session '${sessionArg}': ${err?.message || err}`);
            process.exit(1);
        }
    }
    const exact = SessionManager.findById(cwd, sessionArg);
    if (exact) {
        return SessionManager.open(exact);
    }
    const local = (await SessionManager.list(cwd)).find((session) => session.id.startsWith(sessionArg));
    if (local) {
        return SessionManager.open(local.path);
    }
    console.error(`No session found matching '${sessionArg}' in ${cwd}`);
    process.exit(1);
}
async function main() {
    const cwd = process.cwd();
    const sessionManager = await resolveSessionManager(cwd);
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
    const agentManager = new AgentManager(cwd, metricsTracker, toolLogger, gitWatcher, todoTracker, sessionManager);
    // Layout Root
    const layout = new AppLayout(tui, agentManager, metricsTracker, gitWatcher, todoTracker, toolLogger, specGraphWatcher);
    tui.setLayoutRoot(layout);
    tui.setFocus(layout);
    // Sixel previews are painted onto each frame the TUI writes.
    const writeFrame = terminal.write.bind(terminal);
    terminal.write = (data) => writeFrame(SixelOverlay.inject(data));
    // Clean exit handlers
    let cleaned = false;
    const cleanup = () => {
        if (cleaned)
            return;
        cleaned = true;
        const resumeCommand = agentManager.getResumeCommand();
        try {
            tui.stop();
            gitWatcher.dispose();
            specGraphWatcher.dispose();
            agentManager.dispose();
        }
        catch {
            // ignore
        }
        try {
            if (resumeCommand) {
                process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
                process.stdout.write(`\nSession closed.\n\nResume with:\n\n  ${resumeCommand}\n\n`);
            }
            process.stdout.write("\x1b[?25h");
            if (process.stdin.isTTY)
                process.stdin.setRawMode(false);
        }
        catch {
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
    SixelOverlay.probe(tui, terminal);
    // Initialize agent session
    try {
        await agentManager.init();
        tui.requestRender();
    }
    catch (err) {
        tui.stop();
        console.error("Error initializing Pi session:", err?.message || err);
        process.exit(1);
    }
}
main().catch((err) => {
    console.error("Fatal error starting pi-tui-plus:", err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map