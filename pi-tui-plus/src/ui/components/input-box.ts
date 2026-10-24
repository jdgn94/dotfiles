import * as path from "node:path";
import { matchesKey, visibleWidth, type Component, type Focusable } from "@earendil-works/pi-tui";
import { colors, style, truncate } from "../theme.js";
import {
  type ChatImage,
  loadImageAttachment,
  normalizeImagePath,
  readClipboardImage,
  readClipboardText,
} from "../../state/image-attachment.js";

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

const CORE_COMMANDS: SlashCommand[] = [
  { name: "new", description: "Start a fresh session with a completely clean context" },
  { name: "clear", description: "Clear conversation messages from view without resetting session" },
  { name: "help", description: "Display command reference and keyboard shortcuts" },
  { name: "models", description: "Browse and switch active AI models with search" },
  { name: "agent", description: "Open interactive Agent & Subagent selector" },
  { name: "agents", description: "Open interactive Agent & Subagent selector" },
  { name: "skills", description: "List all installed global skills" },
  { name: "learn", description: "Analyze recent task and synthesize a continuous improvement skill" },
  { name: "plan", description: "Toggle live execution plan and task checklist" },
  { name: "todos", description: "View or toggle current plan tasks" },
  { name: "diff", description: "View git diff of current session changes" },
  { name: "rollback", description: "Revert uncommitted working tree changes back to clean state" },
  { name: "compact", description: "Trigger context window compaction" },
  { name: "cost", description: "Show detailed token economics & cost breakdown" },
  { name: "status", description: "Show global metrics and session status" },
  { name: "stats", description: "Show cumulative token metrics and global Pi statistics" },
  { name: "mcp", description: "Show MCP server status and active tools" },
  { name: "session", description: "Browse and resume previous project sessions" },
  { name: "memory", description: "View, search, or clear persistent memory" },
  { name: "remember", description: "Save a durable user preference or project memory" },
  { name: "permissions", description: "View or revoke external directory authorizations for this session" },
  { name: "notify", description: "Configure or test desktop system notifications" },
  { name: "subagents", description: "Administer and inspect discovered subagents" },
  { name: "run", description: "Run a task with an isolated specialized subagent" },
  { name: "btw", description: "Ask a side question without polluting main conversation" },
  { name: "council", description: "Convene a multi-agent advisor council and write a decision memo" },
  { name: "search", description: "Browse stored web search and knowledge base results" },
  { name: "curator", description: "Configure web search curator workflow" },
  { name: "lens-toggle", description: "Toggle real-time LSP diagnostics on/off" },
  { name: "lens-map", description: "Render interactive HTML project architecture map" },
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
  private placeholder = "Type a prompt... (Enter: send, Alt+Enter: newline, Ctrl+V: image, Ctrl+E: editor, /: commands)";
  private onSubmitCallback?: (text: string, images: ChatImage[]) => void;
  private onOpenExternalEditorCallback?: () => void;
  private attachedImages: ChatImage[] = [];

  private activeAgentName = "default";
  private activeAgentColor = colors.activeBorder;
  private hasMultipleAgents = false;

  // Slash commands autocomplete state
  private availableCommands: SlashCommand[] = [...CORE_COMMANDS];
  private selectedCommandIndex = 0;

  // @ mentions autocomplete state (files & subagents)
  private availableSubagents: Array<{ name: string; description: string; color?: string }> = [];
  private workspaceFiles: string[] = [];
  private selectedMentionIndex = 0;

  public setAvailableSubagents(
    agents: Array<{ name: string; description: string; color?: string }>
  ): void {
    this.availableSubagents = agents;
  }

  public setWorkspaceFiles(files: string[]): void {
    this.workspaceFiles = files;
  }

  public getActiveMention(): { query: string; atIndex: number } | null {
    const textBeforeCursor = this.text.slice(0, this.cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\-./]*)$/);
    if (!match) return null;
    return {
      query: match[1] ?? "",
      atIndex: match.index ?? 0,
    };
  }

  private getMatchingMentions(): MentionOption[] {
    const mention = this.getActiveMention();
    if (!mention) return [];
    const q = mention.query.toLowerCase().trim();
    const results: MentionOption[] = [];

    // 1. Subagents first
    for (const a of this.availableSubagents) {
      if (!q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
        results.push({
          type: "agent",
          name: a.name,
          detail: a.description,
          color: a.color,
        });
      }
    }

    // 2. Workspace Files
    for (const f of this.workspaceFiles) {
      if (!q || f.toLowerCase().includes(q)) {
        results.push({
          type: "file",
          name: f,
        });
      }
    }

    return results.slice(0, 6);
  }

  public onSubmit(cb: (text: string, images: ChatImage[]) => void): void {
    this.onSubmitCallback = cb;
  }

  public onOpenExternalEditor(cb: () => void): void {
    this.onOpenExternalEditorCallback = cb;
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
    this.attachedImages = [];
  }

  public getAttachedImages(): ChatImage[] {
    return [...this.attachedImages];
  }

  public addImagePath(candidate: string): boolean {
    const image = loadImageAttachment(candidate);
    if (!image) return false;
    if (!this.attachedImages.some((existing) => existing.path === image.path)) {
      this.attachedImages.push(image);
    }
    return true;
  }

  public addImageFromClipboard(): boolean {
    const image = readClipboardImage();
    if (image) {
      if (!this.attachedImages.some((existing) => existing.path === image.path)) {
        this.attachedImages.push(image);
      }
      return true;
    }

    const text = readClipboardText();
    if (!text) return false;
    let added = false;
    const remaining: string[] = [];
    for (const line of text.split(/\r?\n/)) {
      if (this.addImagePath(line)) added = true;
      else remaining.push(line);
    }
    if (added) {
      const rest = remaining.join("\n").trim();
      if (rest) this.insertTextAtCursor(rest);
    }
    return added;
  }

  private getMatchingCommands(): SlashCommand[] {
    if (!this.text.startsWith("/")) return [];
    const query = this.text.slice(1).toLowerCase().trim();
    if (!query) {
      // Return top commands when only "/" is typed
      return this.availableCommands.slice(0, 10);
    }
    return this.availableCommands
      .filter(
        (c) =>
          c.name.toLowerCase().startsWith(query) ||
          c.name.toLowerCase().includes(query)
      )
      .slice(0, 10);
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
    return normalizeImagePath(candidate);
  }

  private insertTextAtCursor(value: string): void {
    const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    this.text = this.text.slice(0, this.cursor) + normalized + this.text.slice(this.cursor);
    this.cursor += normalized.length;
  }

  private handleBracketedPaste(content: string): void {
    const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const remaining: string[] = [];
    let attached = 0;

    for (const line of normalized.split("\n")) {
      if (this.addImagePath(line)) {
        attached++;
      } else {
        remaining.push(line);
      }
    }

    if (attached > 0) {
      const rest = remaining.join("\n").trim();
      if (rest) this.insertTextAtCursor(rest);
      return;
    }
    this.insertTextAtCursor(normalized);
  }

  public handleInput(data: string): void {
    // Bracketed paste: terminal file drag/drop and text paste.
    if (data.startsWith("\x1b[200~") && data.endsWith("\x1b[201~")) {
      const pasted = data.slice(6, -6);
      if (!pasted) {
        if (!this.addImageFromClipboard()) {
          const text = readClipboardText();
          if (text) this.insertTextAtCursor(text);
        }
      } else {
        this.handleBracketedPaste(pasted);
      }
      return;
    }

    // Ctrl+V: attach an image from the system clipboard, or paste text.
    if (data === "\x16" || matchesKey(data, "ctrl+v")) {
      if (this.addImageFromClipboard()) return;
      const text = readClipboardText();
      if (text) this.insertTextAtCursor(text);
      return;
    }

    const isCommandMode = this.text.startsWith("/");
    const matching = isCommandMode ? this.getMatchingCommands() : [];

    const activeMention = this.getActiveMention();
    const matchingMentions = activeMention ? this.getMatchingMentions() : [];
    const isMentionMode = activeMention !== null && matchingMentions.length > 0;

    // Ctrl+E -> Open prompt in external editor ($EDITOR)
    if (matchesKey(data, "ctrl+e") || data === "\x05") {
      this.onOpenExternalEditorCallback?.();
      return;
    }

    // Alt+Enter, Shift+Enter, \x1b\r, \x1b\n -> Insert newline for multiline prompt!
    if (
      data === "\x1b\r" ||
      data === "\x1b\n" ||
      matchesKey(data, "shift+enter") ||
      matchesKey(data, "alt+enter")
    ) {
      this.text = this.text.slice(0, this.cursor) + "\n" + this.text.slice(this.cursor);
      this.cursor += 1;
      return;
    }

    // Tab key in mention mode -> Autocomplete selected mention (@file or @agent)
    if (data === "\t" && isMentionMode) {
      const chosen = matchingMentions[this.selectedMentionIndex] ?? matchingMentions[0];
      if (chosen && activeMention) {
        const beforeAt = this.text.slice(0, activeMention.atIndex);
        const afterCursor = this.text.slice(this.cursor);
        const insertText = `@${chosen.name} `;
        this.text = `${beforeAt}${insertText}${afterCursor}`;
        this.cursor = beforeAt.length + insertText.length;
        this.selectedMentionIndex = 0;
      }
      return;
    }

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
      // If mention mode was active and cursor is directly after @query with no prompt yet: complete mention
      if (isMentionMode && activeMention && !this.text.includes(" ")) {
        const chosen = matchingMentions[this.selectedMentionIndex] ?? matchingMentions[0];
        if (chosen) {
          const beforeAt = this.text.slice(0, activeMention.atIndex);
          const afterCursor = this.text.slice(this.cursor);
          const insertText = `@${chosen.name} `;
          this.text = `${beforeAt}${insertText}${afterCursor}`;
          this.cursor = beforeAt.length + insertText.length;
          this.selectedMentionIndex = 0;
          return;
        }
      }

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
      }
      if (finalSubmission || this.attachedImages.length > 0) {
        if (this.onSubmitCallback) {
          this.onSubmitCallback(finalSubmission, this.getAttachedImages());
        }
        this.clear();
      }
      return;
    }

    // Backspace
    if (data === "\x7f" || data === "\b") {
      if (this.text.length === 0 && this.cursor === 0 && this.attachedImages.length > 0) {
        this.attachedImages.pop();
        return;
      }
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
      // Up arrow: Navigate mentions popup if active
      if (isMentionMode) {
        this.selectedMentionIndex =
          (this.selectedMentionIndex - 1 + matchingMentions.length) % matchingMentions.length;
        return;
      }
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
      // Down arrow: Navigate mentions popup if active
      if (isMentionMode) {
        this.selectedMentionIndex =
          (this.selectedMentionIndex + 1) % matchingMentions.length;
        return;
      }
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

    if (this.attachedImages.length > 0) {
      const names = this.attachedImages.map((image) => path.basename(image.path)).join(", ");
      const count = this.attachedImages.length;
      lines.push(
        style(
          ` 📎 ${count} image${count === 1 ? "" : "s"}: ${truncate(names, Math.max(8, safeWidth - 14))}`,
          colors.accent
        )
      );
    }

    // --- @ Mentions Autocomplete Popup (@files / @agents) ---
    const activeMention = this.getActiveMention();
    const matchingMentions = activeMention ? this.getMatchingMentions() : [];
    if (activeMention && matchingMentions.length > 0) {
      const mTitle = " 󰋜 Mentions (@files / @agents) ";
      const mHint = " [Tab: complete | Enter: select] ";
      const mTitleLen = visibleWidth(mTitle);
      const mHintLen = visibleWidth(mHint);
      const remM = Math.max(0, safeWidth - 3 - mTitleLen - mHintLen);

      lines.push(
        `${style("╭─", colors.border)}${style(mTitle, colors.bold, colors.accent)}${style(
          "─".repeat(remM),
          colors.border
        )}${style(mHint, colors.muted)}${style("╮", colors.border)}`
      );

      for (let i = 0; i < matchingMentions.length; i++) {
        const isSel = i === this.selectedMentionIndex;
        const item = matchingMentions[i];
        if (!item) continue;

        const prefix = isSel ? style(" > ", colors.bold, colors.accent) : "   ";
        const icon = item.type === "agent" ? "🤖 " : "📄 ";
        const itemColor =
          item.color || (item.type === "agent" ? colors.secondary : colors.primary);
        const nameStyled = isSel
          ? style(`@${item.name}`.padEnd(24), colors.bold, colors.accent)
          : style(`@${item.name}`.padEnd(24), colors.bold, itemColor);
        const maxDetail = Math.max(10, safeWidth - 36);
        const detailStyled = style(truncate(item.detail || "", maxDetail), colors.muted);

        const rowContent = `${prefix}${icon}${nameStyled} ${detailStyled}`;
        const rowVisual = visibleWidth(rowContent);
        const pad = Math.max(0, safeWidth - 2 - rowVisual);
        lines.push(
          `${style("│", colors.border)}${rowContent}${" ".repeat(pad)}${style(
            "│",
            colors.border
          )}`
        );
      }

      lines.push(`${style("╰" + "─".repeat(safeWidth - 2) + "╯", colors.border)}`);
    }

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

    const textLines = this.text.split("\n");
    const middleLines: string[] = [];

    if (textLines.length > 1) {
      // Calculate which line and column the cursor is currently at
      let curRemaining = this.cursor;
      let curLineIdx = 0;
      let curColIdx = 0;
      for (let i = 0; i < textLines.length; i++) {
        const lineLen = textLines[i]?.length ?? 0;
        if (curRemaining <= lineLen) {
          curLineIdx = i;
          curColIdx = curRemaining;
          break;
        }
        curRemaining -= lineLen + 1;
      }

      // Render up to 6 lines expanded
      const maxRows = Math.min(6, textLines.length);
      for (let i = 0; i < maxRows; i++) {
        const rawLine = textLines[i] ?? "";
        let lineDisplay = "";

        if (i === curLineIdx) {
          const before = rawLine.slice(0, curColIdx);
          const at = rawLine[curColIdx] || " ";
          const after = rawLine.slice(curColIdx + 1);
          lineDisplay = `${before}\x1b[7m${at}\x1b[27m${after}`;
        } else {
          lineDisplay = rawLine;
        }

        const numPrefix = style(`${i + 1} > `, colors.muted);
        const rowContent = `${numPrefix}${lineDisplay}`;
        const rowVisual = visibleWidth(`${i + 1} > `) + visibleWidth(rawLine);
        const padCount = Math.max(0, innerWidth - rowVisual);
        middleLines.push(
          `${style("│ ", borderColor)}${rowContent}${" ".repeat(padCount)}${style(
            " │",
            borderColor
          )}`
        );
      }
    } else {
      const emptyDisplay =
        this.attachedImages.length > 0
          ? "Image attached — type a prompt or press Enter"
          : this.placeholder;
      if (this.text.length === 0) {
        contentDisplay = style(emptyDisplay.slice(0, innerWidth - 2), colors.muted);
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
          ? emptyDisplay.slice(0, innerWidth - 2).length
          : Math.min(innerWidth - 2, this.text.length + 1);
      const padCount = Math.max(0, innerWidth - 2 - textLen);
      middleLines.push(
        `${style("│ ", borderColor)}> ${contentDisplay}${" ".repeat(padCount)}${style(
          " │",
          borderColor
        )}`
      );
    }

    // Clean rounded bottom border aligning with rounded top
    const bottom = `${style("╰" + "─".repeat(safeWidth - 2) + "╯", borderColor)}`;

    lines.push(top, ...middleLines, bottom);
    return lines;
  }
}
