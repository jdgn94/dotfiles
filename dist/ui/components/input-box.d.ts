import { type Component, type Focusable } from "@earendil-works/pi-tui";
export interface SlashCommand {
    name: string;
    description: string;
}
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
    private availableCommands;
    private selectedCommandIndex;
    onSubmit(cb: (text: string) => void): void;
    setActiveAgent(name: string, hasMultiple?: boolean): void;
    setAvailableCommands(commands: SlashCommand[]): void;
    invalidate(): void;
    getText(): string;
    setText(val: string): void;
    clear(): void;
    private getMatchingCommands;
    getAttachedImageAtCursor(): string | null;
    private resolveImagePath;
    handleInput(data: string): void;
    render(width: number): string[];
}
