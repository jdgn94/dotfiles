import * as fs from "node:fs";
import * as path from "node:path";
import { matchesKey, visibleWidth } from "@earendil-works/pi-tui";
import { colors, style, truncate } from "../theme.js";
const CORE_COMMANDS = [
    { name: "new", description: "Start a fresh session with a completely clean context" },
    { name: "clear", description: "Clear conversation messages from view without resetting session" },
    { name: "compact", description: "Trigger context window compaction" },
    { name: "models", description: "Browse and switch active AI models with search" },
    { name: "agent", description: "Open interactive Agent & Subagent selector" },
    { name: "agents", description: "Open interactive Agent & Subagent selector" },
    { name: "skills", description: "List all installed global skills" },
    { name: "mcp", description: "Show MCP server status and active tools" },
    { name: "diff", description: "View git diff of current session changes" },
    { name: "session", description: "Browse and resume previous project sessions" },
    { name: "cost", description: "Show detailed token economics & cost breakdown" },
    { name: "status", description: "Show global metrics and session status" },
    { name: "todos", description: "View or toggle current plan tasks" },
    { name: "opsx-propose", description: "Propose a new OpenSpec change" },
    { name: "opsx-apply", description: "Apply tasks from an OpenSpec change" },
    { name: "opsx-explore", description: "Enter OpenSpec explore mode" },
    { name: "graphify", description: "Inspect AST code knowledge graph" },
    { name: "exit", description: "Quit Pi" },
];
export class InputBox {
    focused = true;
    text = "";
    cursor = 0;
    history = [];
    historyIndex = -1;
    placeholder = "Type a prompt... (Enter: send, Alt+Enter: newline, Ctrl+E: editor, /: commands)";
    onSubmitCallback;
    onOpenExternalEditorCallback;
    activeAgentName = "default";
    activeAgentColor = colors.activeBorder;
    hasMultipleAgents = false;
    // Slash commands autocomplete state
    availableCommands = [...CORE_COMMANDS];
    selectedCommandIndex = 0;
    // @ mentions autocomplete state (files & subagents)
    availableSubagents = [];
    workspaceFiles = [];
    selectedMentionIndex = 0;
    setAvailableSubagents(agents) {
        this.availableSubagents = agents;
    }
    setWorkspaceFiles(files) {
        this.workspaceFiles = files;
    }
    getActiveMention() {
        const textBeforeCursor = this.text.slice(0, this.cursor);
        const match = textBeforeCursor.match(/@([a-zA-Z0-9_\-./]*)$/);
        if (!match)
            return null;
        return {
            query: match[1] ?? "",
            atIndex: match.index ?? 0,
        };
    }
    getMatchingMentions() {
        const mention = this.getActiveMention();
        if (!mention)
            return [];
        const q = mention.query.toLowerCase().trim();
        const results = [];
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
    onSubmit(cb) {
        this.onSubmitCallback = cb;
    }
    onOpenExternalEditor(cb) {
        this.onOpenExternalEditorCallback = cb;
    }
    setActiveAgent(name, color, hasMultiple = true) {
        this.activeAgentName = name;
        if (color)
            this.activeAgentColor = color;
        this.hasMultipleAgents = hasMultiple;
    }
    setAvailableCommands(commands) {
        const map = new Map();
        for (const c of CORE_COMMANDS) {
            map.set(c.name, c);
        }
        for (const c of commands) {
            map.set(c.name, c);
        }
        this.availableCommands = Array.from(map.values());
    }
    invalidate() { }
    getText() {
        return this.text;
    }
    setText(val) {
        this.text = val;
        this.cursor = val.length;
    }
    clear() {
        this.text = "";
        this.cursor = 0;
        this.historyIndex = -1;
        this.selectedCommandIndex = 0;
    }
    getMatchingCommands() {
        if (!this.text.startsWith("/"))
            return [];
        const query = this.text.slice(1).toLowerCase().trim();
        if (!query) {
            // Return top commands when only "/" is typed
            return this.availableCommands.slice(0, 10);
        }
        return this.availableCommands
            .filter((c) => c.name.toLowerCase().startsWith(query) ||
            c.name.toLowerCase().includes(query))
            .slice(0, 10);
    }
    getAttachedImageAtCursor() {
        if (!this.text.trim())
            return null;
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
                if (resolved)
                    return resolved;
            }
        }
        return null;
    }
    resolveImagePath(candidate) {
        if (!candidate || candidate.length < 4)
            return null;
        const extMatch = candidate.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i);
        if (!extMatch)
            return null;
        try {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                return path.resolve(candidate);
            }
            const resolved = path.resolve(process.cwd(), candidate);
            if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
                return resolved;
            }
        }
        catch {
            return null;
        }
        return null;
    }
    handleInput(data) {
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
        if (data === "\x1b\r" ||
            data === "\x1b\n" ||
            matchesKey(data, "shift+enter") ||
            matchesKey(data, "alt+enter")) {
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
            if (isCommandMode &&
                matching.length > 0 &&
                !this.text.includes(" ")) {
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
                }
                else if (this.historyIndex > 0) {
                    this.historyIndex--;
                }
                const item = this.history[this.historyIndex];
                if (item !== undefined)
                    this.setText(item);
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
                    if (item !== undefined)
                        this.setText(item);
                }
                else {
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
    render(width) {
        const safeWidth = Math.max(20, width);
        const borderColor = this.focused ? this.activeAgentColor : colors.border;
        const lines = [];
        // --- @ Mentions Autocomplete Popup (@files / @agents) ---
        const activeMention = this.getActiveMention();
        const matchingMentions = activeMention ? this.getMatchingMentions() : [];
        if (activeMention && matchingMentions.length > 0) {
            const mTitle = " 󰋜 Mentions (@files / @agents) ";
            const mHint = " [Tab: complete | Enter: select] ";
            const mTitleLen = visibleWidth(mTitle);
            const mHintLen = visibleWidth(mHint);
            const remM = Math.max(0, safeWidth - 3 - mTitleLen - mHintLen);
            lines.push(`${style("╭─", colors.border)}${style(mTitle, colors.bold, colors.accent)}${style("─".repeat(remM), colors.border)}${style(mHint, colors.muted)}${style("╮", colors.border)}`);
            for (let i = 0; i < matchingMentions.length; i++) {
                const isSel = i === this.selectedMentionIndex;
                const item = matchingMentions[i];
                if (!item)
                    continue;
                const prefix = isSel ? style(" > ", colors.bold, colors.accent) : "   ";
                const icon = item.type === "agent" ? "🤖 " : "📄 ";
                const itemColor = item.color || (item.type === "agent" ? colors.secondary : colors.primary);
                const nameStyled = isSel
                    ? style(`@${item.name}`.padEnd(24), colors.bold, colors.accent)
                    : style(`@${item.name}`.padEnd(24), colors.bold, itemColor);
                const maxDetail = Math.max(10, safeWidth - 36);
                const detailStyled = style(truncate(item.detail || "", maxDetail), colors.muted);
                const rowContent = `${prefix}${icon}${nameStyled} ${detailStyled}`;
                const rowVisual = visibleWidth(rowContent);
                const pad = Math.max(0, safeWidth - 2 - rowVisual);
                lines.push(`${style("│", colors.border)}${rowContent}${" ".repeat(pad)}${style("│", colors.border)}`);
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
            lines.push(`${style("╭─", colors.border)}${style(popupTitle, colors.bold, colors.accent)}${style("─".repeat(remP), colors.border)}${style(popupHint, colors.muted)}${style("╮", colors.border)}`);
            for (let i = 0; i < matching.length; i++) {
                const isSel = i === this.selectedCommandIndex;
                const cmd = matching[i];
                if (!cmd)
                    continue;
                const prefix = isSel ? style(" > ", colors.bold, colors.accent) : "   ";
                const nameStyled = isSel
                    ? style("/" + cmd.name.padEnd(20), colors.bold, colors.accent)
                    : style("/" + cmd.name.padEnd(20), colors.bold, colors.primary);
                const maxDesc = Math.max(10, safeWidth - 30);
                const descStyled = style(truncate(cmd.description || "", maxDesc), colors.muted);
                const rowContent = `${prefix}${nameStyled} ${descStyled}`;
                const rowVisualLen = visibleWidth(rowContent);
                const pad = Math.max(0, safeWidth - 2 - rowVisualLen);
                lines.push(`${style("│", colors.border)}${rowContent}${" ".repeat(pad)}${style("│", colors.border)}`);
            }
            lines.push(`${style("╰" + "─".repeat(safeWidth - 2) + "╯", colors.border)}`);
        }
        // Header title with active agent visual indicator
        let title = "";
        if (this.hasMultipleAgents || this.activeAgentName !== "default") {
            title = this.focused
                ? ` 󰌌 Active Input [Agent: ${this.activeAgentName}] `
                : ` 󰌌 Input [Agent: ${this.activeAgentName}] `;
        }
        else {
            title = this.focused ? " 󰌌 Active Input " : " 󰌌 Input ";
        }
        // Precise visibleWidth calculation (handles 2-byte surrogate pairs like 󰌌)
        const titleVisualLen = visibleWidth(title);
        const remTop = Math.max(0, safeWidth - 3 - titleVisualLen);
        const top = `${style("╭─", borderColor)}${style(title, colors.bold, this.activeAgentColor)}${style("─".repeat(remTop) + "╮", borderColor)}`;
        const innerWidth = safeWidth - 4;
        let contentDisplay = "";
        const textLines = this.text.split("\n");
        const middleLines = [];
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
                }
                else {
                    lineDisplay = rawLine;
                }
                const numPrefix = style(`${i + 1} > `, colors.muted);
                const rowContent = `${numPrefix}${lineDisplay}`;
                const rowVisual = visibleWidth(`${i + 1} > `) + visibleWidth(rawLine);
                const padCount = Math.max(0, innerWidth - rowVisual);
                middleLines.push(`${style("│ ", borderColor)}${rowContent}${" ".repeat(padCount)}${style(" │", borderColor)}`);
            }
        }
        else {
            if (this.text.length === 0) {
                contentDisplay = style(this.placeholder.slice(0, innerWidth - 2), colors.muted);
            }
            else {
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
            const textLen = this.text.length === 0
                ? this.placeholder.slice(0, innerWidth - 2).length
                : Math.min(innerWidth - 2, this.text.length + 1);
            const padCount = Math.max(0, innerWidth - 2 - textLen);
            middleLines.push(`${style("│ ", borderColor)}> ${contentDisplay}${" ".repeat(padCount)}${style(" │", borderColor)}`);
        }
        // Clean rounded bottom border aligning with rounded top
        const bottom = `${style("╰" + "─".repeat(safeWidth - 2) + "╯", borderColor)}`;
        lines.push(top, ...middleLines, bottom);
        return lines;
    }
}
//# sourceMappingURL=input-box.js.map