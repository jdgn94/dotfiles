import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { type GitWatcher } from "../../state/git-watcher.js";
import { type MetricsTracker } from "../../state/metrics-tracker.js";
import { type SpecGraphWatcher } from "../../state/spec-graph-watcher.js";
import { type TodoTracker } from "../../state/todo-tracker.js";
import { type ToolLogger } from "../../state/tool-logger.js";
import { type InputBox } from "./input-box.js";
export interface SidebarClickAction {
    type: "toggle_plan" | "toggle_mcp" | "toggle_skills" | "open_diff";
    file?: string;
}
export declare class Sidebar implements Component {
    private agent;
    private metrics;
    private git;
    private toolLogger?;
    private todoTracker?;
    private specGraph?;
    private inputBox?;
    private hoveredImage;
    private mcpExpanded;
    private skillsExpanded;
    private planExpanded;
    private clickMap;
    constructor(agent: AgentManager, metrics: MetricsTracker, git: GitWatcher, toolLogger?: ToolLogger, todoTracker?: TodoTracker, specGraph?: SpecGraphWatcher, inputBox?: InputBox);
    invalidate(): void;
    toggleMcp(): void;
    toggleSkills(): void;
    togglePlan(): void;
    setHoveredImage(imagePath: string | null): void;
    isMcpExpanded(): boolean;
    isSkillsExpanded(): boolean;
    isPlanExpanded(): boolean;
    handleClick(sidebarRowIndex: number): SidebarClickAction | null;
    render(width: number): string[];
    /** `sixel` is relative to the returned lines: 0-based line and column. */
    renderHoveredImagePreview(width: number): {
        lines: string[];
        sixel?: {
            line: number;
            col: number;
            rows: number;
            data: string;
        };
    };
    private renderBar;
    private spaceBetween;
}
