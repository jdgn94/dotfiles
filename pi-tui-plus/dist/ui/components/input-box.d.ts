import { type Component, type Focusable } from "@earendil-works/pi-tui";
import { type ChatImage } from "../../state/image-attachment.js";
export interface SlashCommand {
    name: string;
    description: string;
}
export interface MentionOption {
    type: "file" | "agent";
    name: string;
    detail?: string;
    color?: string;
}
export declare class InputBox implements Component, Focusable {
    focused: boolean;
    private text;
    private cursor;
    private history;
    private historyIndex;
    private placeholder;
    private onSubmitCallback?;
    private onOpenExternalEditorCallback?;
    private attachedImages;
    private activeAgentName;
    private activeAgentColor;
    private hasMultipleAgents;
    private availableCommands;
    private selectedCommandIndex;
    private availableSubagents;
    private workspaceFiles;
    private selectedMentionIndex;
    setAvailableSubagents(agents: Array<{
        name: string;
        description: string;
        color?: string;
    }>): void;
    setWorkspaceFiles(files: string[]): void;
    getActiveMention(): {
        query: string;
        atIndex: number;
    } | null;
    private getMatchingMentions;
    onSubmit(cb: (text: string, images: ChatImage[]) => void): void;
    onOpenExternalEditor(cb: () => void): void;
    setActiveAgent(name: string, color?: string, hasMultiple?: boolean): void;
    setAvailableCommands(commands: SlashCommand[]): void;
    invalidate(): void;
    getText(): string;
    setText(val: string): void;
    clear(): void;
    getAttachedImages(): ChatImage[];
    addImagePath(candidate: string): boolean;
    addImageFromClipboard(): boolean;
    private getMatchingCommands;
    getAttachedImageAtCursor(): string | null;
    private resolveImagePath;
    private insertTextAtCursor;
    private handleBracketedPaste;
    handleInput(data: string): void;
    render(width: number): string[];
}
