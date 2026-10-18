import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { type GitWatcher } from "../../state/git-watcher.js";
import { type MetricsTracker } from "../../state/metrics-tracker.js";
import { type ToolLogger } from "../../state/tool-logger.js";
export declare class Sidebar implements Component {
    private agent;
    private metrics;
    private git;
    private toolLogger;
    private activeTab;
    private tabs;
    constructor(agent: AgentManager, metrics: MetricsTracker, git: GitWatcher, toolLogger: ToolLogger);
    invalidate(): void;
    nextTab(): void;
    prevTab(): void;
    setTab(index: number): void;
    getActiveTab(): number;
    render(width: number): string[];
    private renderTabBar;
    private renderMetricsTab;
    private renderGitTab;
    private renderToolLogsTab;
    private boxHeader;
    private boxLine;
    private boxRow;
    private boxBottom;
}
