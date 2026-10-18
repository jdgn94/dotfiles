import type { Component, Focusable } from "@earendil-works/pi-tui";
export declare class InputBox implements Component, Focusable {
    focused: boolean;
    private text;
    private cursor;
    private history;
    private historyIndex;
    private placeholder;
    private onSubmitCallback?;
    onSubmit(cb: (text: string) => void): void;
    invalidate(): void;
    getText(): string;
    setText(val: string): void;
    clear(): void;
    handleInput(data: string): void;
    render(width: number): string[];
}
