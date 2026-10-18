import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { type GitWatcher } from "../../state/git-watcher.js";
import { type MetricsTracker } from "../../state/metrics-tracker.js";
import { type SpecGraphWatcher } from "../../state/spec-graph-watcher.js";
import { type ToolLogger } from "../../state/tool-logger.js";
import { type InputBox } from "./input-box.js";
export declare class Sidebar implements Component {
    private agent;
    private metrics;
    private git;
    private toolLogger?;
    private specGraph?;
    private inputBox?;
    private mcpExpanded;
    private skillsExpanded;
    constructor(agent: AgentManager, metrics: MetricsTracker, git: GitWatcher, toolLogger?: ToolLogger, specGraph?: SpecGraphWatcher, inputBox?: InputBox);
    invalidate(): void;
    toggleMcp(): void;
    toggleSkills(): void;
    isMcpExpanded(): boolean;
    isSkillsExpanded(): boolean;
    render(width: number): string[];
    private renderBar;
    private spaceBetween;
}
