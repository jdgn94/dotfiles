import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
export declare class ChatView implements Component {
    private agent;
    private scrollOffset;
    private autoScroll;
    private cachedHeight;
    constructor(agent: AgentManager);
    invalidate(): void;
    scrollUp(lines?: number): void;
    scrollDown(lines?: number): void;
    scrollToBottom(): void;
    render(width: number): string[];
    private renderBox;
    private wrapText;
    private visualLength;
}
