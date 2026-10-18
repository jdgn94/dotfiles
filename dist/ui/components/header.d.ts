import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { type GitWatcher } from "../../state/git-watcher.js";
export declare class Header implements Component {
    private agent;
    private git;
    constructor(agent: AgentManager, git: GitWatcher);
    invalidate(): void;
    render(width: number): string[];
}
