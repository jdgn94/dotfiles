import * as fs from "node:fs";
import * as path from "node:path";
import { matchesKey, visibleWidth, type Component, type Focusable } from "@earendil-works/pi-tui";
import { colors, style, truncate } from "../theme.js";

export interface SlashCommand {
  name: string;
  description: string;
}

const CORE_COMMANDS: SlashCommand[] = [
  { name: "skills", description: "List all installed global skills" },
  { name: "mcp", description: "Show MCP server status and active tools" },
  { name: "agent", description: "Switch or list available agents" },
  { name: "status", description: "Show global metrics and session status" },
  { name: "diff", description: "View git diff of current session changes" },
  { name: "todos", description: "View or toggle current plan tasks" },
  { name: "opsx-propose", description: "Propose a new OpenSpec change" },
  { name: "opsx-apply", description: "Apply tasks from an OpenSpec change" },
  { name: "opsx-explore", description: "Enter OpenSpec explore mode" },
  { name: "graphify", description: "Inspect AST code knowledge graph" },
  { name: "exit", description: "Quit Pi" },
];

export class InputBox implements Component, Focusable {
  public focused = true;
  private text = "";
  private cursor = 0;
  private history: string[] = [];
  private historyIndex = -1;
  private placeholder = "Type a prompt... (Enter to send, Ctrl+A to switch agent, / for commands)";
  private onSubmitCallback?: (text: string) => void;

  private activeAgentName = "default";
  private activeAgentColor = colors.activeBorder;
  private hasMultipleAgents = false;

  // Slash commands autocomplete state
  private availableCommands: SlashCommand[] = [...CORE_COMMANDS];
  private selectedCommandIndex = 0;

  public onSubmit(cb: (text: string) => void): void {
    this.onSubmitCallback = cb;
  }

  public setActiveAgent(name: string, color?: string, hasMultiple = true): void {
    this.activeAgentName = name;
    if (color) this.activeAgentColor = color;
    this.hasMultipleAgents = hasMultiple;
  }

  public setAvailableCommands(commands: SlashCommand[]): void {
    const map = new Map<string, SlashCommand>();
    for (const c of CORE_COMMANDS) {
      map.set(c.name, c);
    }
    for (const c of commands) {
      map.set(c.name, c);
    }
    this.availableCommands = Array.from(map.values());
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
    this.selectedCommandIndex = 0;
  }

  private getMatchingCommands(): SlashCommand[] {
    if (!this.text.startsWith("/")) return [];
    const query = this.text.slice(1).toLowerCase().trim();
    if (!query) {
      // Return top commands when only "/" is typed
      return this.availableCommands.slice(0, 6);
    }
    return this.availableCommands
      .filter(
        (c) =>
          c.name.toLowerCase().startsWith(query) ||
          c.name.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }

  public getAttachedImageAtCursor(): string | null {
    if (!this.text.trim()) return null;

    const text = this.text;
    const cursor = this.cursor;

    // Extract word around cursor
    let start = cursor;
    while (start > 0 && !/\s|"|'/.test(text[start - 1] ?? "")) {
      start--;
    }
    let end = cursor;
    while (end < text.length && !/\s|"|'/.test(text[end] ?? "")) {
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
    const isCommandMode = this.text.startsWith("/");
    const matching = isCommandMode ? this.getMatchingCommands() : [];

    // Tab key in command mode -> Autocomplete selected command
    if (data === "\t" && isCommandMode && matching.length > 0) {
      const chosen = matching[this.selectedCommandIndex] ?? matching[0];
      if (chosen) {
        this.setText(`/${chosen.name} `);
        this.selectedCommandIndex = 0;
      }
      return;
    }

    // Enter key
    if (data === "\r" || data === "\n") {
      let finalSubmission = this.text.trim();
      if (
        isCommandMode &&
        matching.length > 0 &&
        !this.text.includes(" ")
      ) {
        const chosen = matching[this.selectedCommandIndex] ?? matching[0];
        if (chosen) {
          finalSubmission = `/${chosen.name}`;
        }
      }

      if (finalSubmission) {
        this.history.push(this.text);
        if (this.onSubmitCallback) {
          this.onSubmitCallback(finalSubmission);
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
        this.selectedCommandIndex = 0;
      }
      return;
    }

    // Arrow keys & special navigation keys using standard matchesKey
    if (matchesKey(data, "left")) {
      this.cursor = Math.max(0, this.cursor - 1);
      return;
    }
    if (matchesKey(data, "right")) {
      this.cursor = Math.min(this.text.length, this.cursor + 1);
      return;
    }
    if (matchesKey(data, "home")) {
      this.cursor = 0;
      return;
    }
    if (matchesKey(data, "end")) {
      this.cursor = this.text.length;
      return;
    }
    if (matchesKey(data, "delete")) {
      if (this.cursor < this.text.length) {
        this.text = this.text.slice(0, this.cursor) + this.text.slice(this.cursor + 1);
      }
      return;
    }

    if (matchesKey(data, "up")) {
      // Up arrow: Navigate commands popup if active, else history
      if (isCommandMode && matching.length > 0) {
        this.selectedCommandIndex =
          (this.selectedCommandIndex - 1 + matching.length) % matching.length;
        return;
      }
      if (this.history.length > 0) {
        if (this.historyIndex === -1) {
          this.historyIndex = this.history.length - 1;
        } else if (this.historyIndex > 0) {
          this.historyIndex--;
        }
        const item = this.history[this.historyIndex];
        if (item !== undefined) this.setText(item);
      }
      return;
    }

    if (matchesKey(data, "down")) {
      // Down arrow: Navigate commands popup if active, else history
      if (isCommandMode && matching.length > 0) {
        this.selectedCommandIndex =
          (this.selectedCommandIndex + 1) % matching.length;
        return;
      }
      if (this.historyIndex !== -1) {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          const item = this.history[this.historyIndex];
          if (item !== undefined) this.setText(item);
        } else {
          this.historyIndex = -1;
          this.clear();
        }
      }
      return;
    }

    // Standard printable text (ignore other ESC control codes)
    if (!data.startsWith("\x1b")) {
      this.text = this.text.slice(0, this.cursor) + data + this.text.slice(this.cursor);
      this.cursor += data.length;
      this.selectedCommandIndex = 0;
    }
  }

  public render(width: number): string[] {
    const safeWidth = Math.max(20, width);
    const borderColor = this.focused ? this.activeAgentColor : colors.border;
    const lines: string[] = [];

    // --- Slash Commands Autocomplete Popup (renders floating above the input box) ---
    const matching = this.getMatchingCommands();
    if (matching.length > 0) {
      const popupTitle = " 󰘳 Commands ";
      const popupHint = " [Tab: complete | Enter: run] ";
      const pTitleLen = visibleWidth(popupTitle);
      const pHintLen = visibleWidth(popupHint);
      const remP = Math.max(0, safeWidth - 3 - pTitleLen - pHintLen);

      lines.push(
        `${style("╭─", colors.border)}${style(popupTitle, colors.bold, colors.accent)}${style(
          "─".repeat(remP),
          colors.border
        )}${style(popupHint, colors.muted)}${style("╮", colors.border)}`
      );

      for (let i = 0; i < matching.length; i++) {
        const isSel = i === this.selectedCommandIndex;
        const cmd = matching[i];
        if (!cmd) continue;

        const prefix = isSel ? style(" > ", colors.bold, colors.accent) : "   ";
        const nameStyled = isSel
          ? style("/" + cmd.name.padEnd(20), colors.bold, colors.accent)
          : style("/" + cmd.name.padEnd(20), colors.bold, colors.primary);
        const maxDesc = Math.max(10, safeWidth - 30);
        const descStyled = style(
          truncate(cmd.description || "", maxDesc),
          colors.muted
        );

        const rowContent = `${prefix}${nameStyled} ${descStyled}`;
        const rowVisualLen = visibleWidth(rowContent);
        const pad = Math.max(0, safeWidth - 2 - rowVisualLen);

        lines.push(
          `${style("│", colors.border)}${rowContent}${" ".repeat(pad)}${style(
            "│",
            colors.border
          )}`
        );
      }

      lines.push(`${style("╰" + "─".repeat(safeWidth - 2) + "╯", colors.border)}`);
    }

    // Header title with active agent visual indicator
    let title = "";
    if (this.hasMultipleAgents || this.activeAgentName !== "default") {
      title = this.focused
        ? ` 󰌌 Active Input [Agent: ${this.activeAgentName}] `
        : ` 󰌌 Input [Agent: ${this.activeAgentName}] `;
    } else {
      title = this.focused ? " 󰌌 Active Input " : " 󰌌 Input ";
    }

    // Precise visibleWidth calculation (handles 2-byte surrogate pairs like 󰌌)
    const titleVisualLen = visibleWidth(title);
    const remTop = Math.max(0, safeWidth - 3 - titleVisualLen);
    const top = `${style("╭─", borderColor)}${style(
      title,
      colors.bold,
      this.activeAgentColor
    )}${style("─".repeat(remTop) + "╮", borderColor)}`;

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

    // Clean rounded bottom border aligning with rounded top
    const bottom = `${style("╰" + "─".repeat(safeWidth - 2) + "╯", borderColor)}`;

    lines.push(top, middle, bottom);
    return lines;
  }
}
