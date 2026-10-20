import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
export declare class Header implements Component {
    private agent;
    constructor(agent: AgentManager);
    invalidate(): void;
    render(width: number): string[];
}
