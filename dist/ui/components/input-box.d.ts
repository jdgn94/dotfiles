import type { Component, Focusable } from "@earendil-works/pi-tui";
export declare class InputBox implements Component, Focusable {
    focused: boolean;
    private text;
    private cursor;
    private history;
    private historyIndex;
    private placeholder;
    private onSubmitCallback?;
    private activeAgentName;
    private hasMultipleAgents;
    onSubmit(cb: (text: string) => void): void;
    setActiveAgent(name: string, hasMultiple?: boolean): void;
    invalidate(): void;
    getText(): string;
    setText(val: string): void;
    clear(): void;
    getAttachedImageAtCursor(): string | null;
    private resolveImagePath;
    handleInput(data: string): void;
    render(width: number): string[];
}
