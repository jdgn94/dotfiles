import type { Component, Focusable, TUI } from "@earendil-works/pi-tui";
import { type AgentManager } from "../state/agent-manager.js";
import { type GitWatcher } from "../state/git-watcher.js";
import { type MetricsTracker } from "../state/metrics-tracker.js";
import { type ToolLogger } from "../state/tool-logger.js";
export declare class AppLayout implements Component, Focusable {
    focused: boolean;
    private tui;
    private agent;
    private header;
    private chatView;
    private sidebar;
    private inputBox;
    private statusBar;
    private sidebarVisible;
    private sidebarWidth;
    private scrollFollow;
    private chatScrollOffset;
    private lastRenderHeight;
    constructor(tui: TUI, agent: AgentManager, metrics: MetricsTracker, git: GitWatcher, toolLogger: ToolLogger);
    invalidate(): void;
    handleInput(data: string): void;
    render(width: number): string[];
    private padTo;
}
