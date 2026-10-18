import type { Component, Focusable } from "@earendil-works/pi-tui";
import { colors, pad, style } from "../theme.js";

export class InputBox implements Component, Focusable {
  public focused = true;
  private text = "";
  private cursor = 0;
  private history: string[] = [];
  private historyIndex = -1;
  private placeholder = "Escribe un prompt... (Enter para enviar, Ctrl+C para salir)";
  private onSubmitCallback?: (text: string) => void;

  public onSubmit(cb: (text: string) => void): void {
    this.onSubmitCallback = cb;
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

    // Standard printable text
    if (!data.startsWith("\x1b")) {
      this.text = this.text.slice(0, this.cursor) + data + this.text.slice(this.cursor);
      this.cursor += data.length;
    }
  }

  public render(width: number): string[] {
    const safeWidth = Math.max(20, width);
    const borderColor = this.focused ? colors.activeBorder : colors.border;
    const title = this.focused ? " 󰌌 Entrada (Activa) " : " 󰌌 Entrada ";

    const rem = Math.max(0, safeWidth - 2 - title.length);
    const top = `${style("╭─", borderColor)}${style(title, colors.bold, borderColor)}${style("─".repeat(rem) + "╮", borderColor)}`;

    const innerWidth = safeWidth - 4;
    let contentDisplay = "";

    if (this.text.length === 0) {
      contentDisplay = style(this.placeholder.slice(0, innerWidth - 2), colors.muted);
    } else {
      // Show text with simulated reverse cursor
      const beforeCursor = this.text.slice(0, this.cursor);
      const atCursor = this.text[this.cursor] || " ";
      const afterCursor = this.text.slice(this.cursor + 1);

      contentDisplay = `${beforeCursor}\x1b[7m${atCursor}\x1b[27m${afterCursor}`;
    }

    const strippedLen = this.text.length === 0 ? this.placeholder.slice(0, innerWidth - 2).length : this.text.length + 1;
    const padCount = Math.max(0, innerWidth - strippedLen);
    const middle = `${style("│ ", borderColor)}> ${contentDisplay}${" ".repeat(padCount)}${style(" │", borderColor)}`;
    const bottom = `${style("╰" + "─".repeat(safeWidth - 2) + "╯", borderColor)}`;

    return [top, middle, bottom];
  }
}
