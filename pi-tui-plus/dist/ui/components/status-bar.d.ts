import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { type MetricsTracker } from "../../state/metrics-tracker.js";
export declare class StatusBar implements Component {
    private agent;
    private metrics;
    constructor(agent: AgentManager, metrics: MetricsTracker);
    invalidate(): void;
    render(width: number): string[];
}
