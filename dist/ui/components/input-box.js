import * as fs from "node:fs";
import * as path from "node:path";
import { visibleWidth } from "@earendil-works/pi-tui";
import { colors, style, truncate } from "../theme.js";
export class InputBox {
    focused = true;
    text = "";
    cursor = 0;
    history = [];
    historyIndex = -1;
    placeholder = "Type a prompt... (Enter to send, Ctrl+A to switch agent, / for commands)";
    onSubmitCallback;
    activeAgentName = "default";
    hasMultipleAgents = false;
    // Slash commands autocomplete state
    availableCommands = [];
    selectedCommandIndex = 0;
    onSubmit(cb) {
        this.onSubmitCallback = cb;
    }
    setActiveAgent(name, hasMultiple = true) {
        this.activeAgentName = name;
        this.hasMultipleAgents = hasMultiple;
    }
    setAvailableCommands(commands) {
        this.availableCommands = commands;
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
            return this.availableCommands.slice(0, 6);
        }
        return this.availableCommands
            .filter((c) => c.name.toLowerCase().startsWith(query) ||
            c.name.toLowerCase().includes(query))
            .slice(0, 6);
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
            if (code === "B") {
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
        const borderColor = this.focused ? colors.activeBorder : colors.border;
        const lines = [];
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
        const top = `${style("╭─", borderColor)}${style(title, colors.bold, borderColor)}${style("─".repeat(remTop) + "╮", borderColor)}`;
        const innerWidth = safeWidth - 4;
        let contentDisplay = "";
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
        const middle = `${style("│ ", borderColor)}> ${contentDisplay}${" ".repeat(padCount)}${style(" │", borderColor)}`;
        // Clean rounded bottom border aligning with rounded top
        const bottom = `${style("╰" + "─".repeat(safeWidth - 2) + "╯", borderColor)}`;
        lines.push(top, middle, bottom);
        return lines;
    }
}
//# sourceMappingURL=input-box.js.map