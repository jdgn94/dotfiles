import { type Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
export declare class ChatView implements Component {
    private agent;
    private tetrisLogo;
    private scrollOffset;
    private autoScroll;
    private cachedHeight;
    private imageRanges;
    constructor(agent: AgentManager);
    invalidate(): void;
    scrollUp(lines?: number): void;
    scrollDown(lines?: number): void;
    updateLogo(): boolean;
    isLogoComplete(): boolean;
    isAutoScroll(): boolean;
    getCachedHeight(): number;
    getImageAtPosition(line: number, col: number): string | null;
    render(width: number): string[];
    private renderBox;
    private wrapText;
    private visualLength;
}
