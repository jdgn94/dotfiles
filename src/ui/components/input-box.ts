import * as fs from "node:fs";
import * as path from "node:path";
import type { Component, Focusable } from "@earendil-works/pi-tui";
import { colors, style } from "../theme.js";

export class InputBox implements Component, Focusable {
  public focused = true;
  private text = "";
  private cursor = 0;
  private history: string[] = [];
  private historyIndex = -1;
  private placeholder = "Type a prompt... (Enter to send, Ctrl+A to switch agent, Ctrl+C to exit)";
  private onSubmitCallback?: (text: string) => void;

  private activeAgentName = "default";
  private hasMultipleAgents = false;

  public onSubmit(cb: (text: string) => void): void {
    this.onSubmitCallback = cb;
  }

  public setActiveAgent(name: string, hasMultiple = true): void {
    this.activeAgentName = name;
    this.hasMultipleAgents = hasMultiple;
  }

  public invalidate(): void {}

  public getText(): string {
    return this.text;
  }

  public setText(val: string): void {
    this.text = val;
    this.cursor = val.length;
  }

  public clear(): void {
    this.text = "";
    this.cursor = 0;
    this.historyIndex = -1;
  }

  public getAttachedImageAtCursor(): string | null {
    if (!this.text.trim()) return null;

    const text = this.text;
    const cursor = this.cursor;

    // Extract word around cursor
    let start = cursor;
    while (start > 0 && !/\s|"|'/.test(text[start - 1])) {
      start--;
    }
    let end = cursor;
    while (end < text.length && !/\s|"|'/.test(text[end])) {
      end++;
    }

    const candidate = text.slice(start, end).trim().replace(/^['"]|['"]$/g, "");
    if (this.resolveImagePath(candidate)) {
      return this.resolveImagePath(candidate);
    }

    // Also check if any word in the text is an existing image path
    const matches = text.match(/[^\s"']+\.(png|jpg|jpeg|webp|gif|bmp|svg)/gi);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const clean = m.replace(/^['"]|['"]$/g, "");
        const resolved = this.resolveImagePath(clean);
        if (resolved) return resolved;
      }
    }

    return null;
  }

  private resolveImagePath(candidate: string): string | null {
    if (!candidate || candidate.length < 4) return null;
    const extMatch = candidate.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i);
    if (!extMatch) return null;

    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return path.resolve(candidate);
      }
      const resolved = path.resolve(process.cwd(), candidate);
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        return resolved;
      }
    } catch {
      return null;
    }
    return null;
  }

  public handleInput(data: string): void {
    // Enter key
    if (data === "\r" || data === "\n") {
      const trimmed = this.text.trim();
      if (trimmed) {
        this.history.push(this.text);
        if (this.onSubmitCallback) {
          this.onSubmitCallback(this.text);
        }
        this.clear();
      }
      return;
    }

    // Backspace
    if (data === "\x7f" || data === "\b") {
      if (this.cursor > 0) {
        this.text = this.text.slice(0, this.cursor - 1) + this.text.slice(this.cursor);
        this.cursor--;
      }
      return;
    }

    // Arrow keys & special ANSI sequences
    if (data.startsWith("\x1b[")) {
      const code = data.slice(2);
      if (code === "D") {
        // Left
        this.cursor = Math.max(0, this.cursor - 1);
        return;
      }
      if (code === "C") {
        // Right
        this.cursor = Math.min(this.text.length, this.cursor + 1);
        return;
      }
      if (code === "H" || code === "1~") {
        // Home
        this.cursor = 0;
        return;
      }
      if (code === "F" || code === "4~") {
        // End
        this.cursor = this.text.length;
        return;
      }
      if (code === "3~") {
        // Delete
        if (this.cursor < this.text.length) {
          this.text = this.text.slice(0, this.cursor) + this.text.slice(this.cursor + 1);
        }
        return;
      }
      if (code === "A") {
        // Up arrow (History prev)
        if (this.history.length > 0) {
          if (this.historyIndex === -1) {
            this.historyIndex = this.history.length - 1;
          } else if (this.historyIndex > 0) {
            this.historyIndex--;
          }
          this.setText(this.history[this.historyIndex]);
        }
        return;
      }
      if (code === "B") {
        // Down arrow (History next)
        if (this.historyIndex !== -1) {
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.setText(this.history[this.historyIndex]);
          } else {
            this.historyIndex = -1;
            this.clear();
          }
        }
        return;
      }
      return;
    }

    // Standard printable text (ignore other ESC control codes)
    if (!data.startsWith("\x1b")) {
      this.text = this.text.slice(0, this.cursor) + data + this.text.slice(this.cursor);
      this.cursor += data.length;
    }
  }

  public render(width: number): string[] {
    const safeWidth = Math.max(20, width);
    const borderColor = this.focused ? colors.activeBorder : colors.border;

    // Header title with active agent visual indicator
    let title = "";
    if (this.hasMultipleAgents || this.activeAgentName !== "default") {
      title = this.focused
        ? ` 󰌌 Active Input [Agent: ${this.activeAgentName}] `
        : ` 󰌌 Input [Agent: ${this.activeAgentName}] `;
    } else {
      title = this.focused ? " 󰌌 Active Input " : " 󰌌 Input ";
    }

    const titleVisualLen = title.replace(/\x1b\[[0-9;]*m/g, "").length;
    const remTop = Math.max(0, safeWidth - 3 - titleVisualLen);
    const top = `${style("┌─", borderColor)}${style(title, colors.bold, borderColor)}${style(
      "─".repeat(remTop) + "┐",
      borderColor
    )}`;

    const innerWidth = safeWidth - 4;
    let contentDisplay = "";

    if (this.text.length === 0) {
      contentDisplay = style(this.placeholder.slice(0, innerWidth - 2), colors.muted);
    } else {
      // Horizontal windowing for long text
      const maxVisible = Math.max(1, innerWidth - 2);
      let sliceStart = 0;
      if (this.cursor >= maxVisible) {
        sliceStart = this.cursor - maxVisible + 1;
      }
      const visibleSub = this.text.slice(sliceStart, sliceStart + maxVisible);
      const visibleCursor = this.cursor - sliceStart;

      const beforeCursor = visibleSub.slice(0, visibleCursor);
      const atCursor = visibleSub[visibleCursor] || " ";
      const afterCursor = visibleSub.slice(visibleCursor + 1);

      contentDisplay = `${beforeCursor}\x1b[7m${atCursor}\x1b[27m${afterCursor}`;
    }

    const textLen =
      this.text.length === 0
        ? this.placeholder.slice(0, innerWidth - 2).length
        : Math.min(innerWidth - 2, this.text.length + 1);
    const padCount = Math.max(0, innerWidth - 2 - textLen);
    const middle = `${style("│ ", borderColor)}> ${contentDisplay}${" ".repeat(padCount)}${style(
      " │",
      borderColor
    )}`;

    // Clean bottom border without project/branch (now moved to right panel)
    const bottom = `${style("└" + "─".repeat(safeWidth - 2) + "┘", borderColor)}`;

    return [top, middle, bottom];
  }
}
