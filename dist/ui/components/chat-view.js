import { colors, style } from "../theme.js";
export class ChatView {
    agent;
    scrollOffset = 0;
    autoScroll = true;
    cachedHeight = 20;
    constructor(agent) {
        this.agent = agent;
    }
    invalidate() { }
    scrollUp(lines = 3) {
        this.scrollOffset = Math.max(0, this.scrollOffset - lines);
        this.autoScroll = false;
    }
    scrollDown(lines = 3) {
        this.scrollOffset += lines;
    }
    scrollToBottom() {
        this.autoScroll = true;
        this.scrollOffset = 999999;
    }
    render(width) {
        const safeWidth = Math.max(20, width);
        const messages = this.agent.getMessages();
        const streamingText = this.agent.getStreamingText();
        const streamingThinking = this.agent.getStreamingThinking();
        const isWorking = this.agent.getIsWorking();
        const allLines = [];
        // Welcome banner if empty
        if (messages.length === 0 && !streamingText && !streamingThinking) {
            allLines.push("");
            allLines.push(style("  Bienvenido a Pi-TUI-Plus!", colors.bold, colors.primary));
            allLines.push(style("  Interfaz terminal mejorada con Split-View, métricas en vivo y logs.", colors.subtext));
            allLines.push("");
            allLines.push(style("  • Escribe un prompt abajo y presiona Enter para comenzar.", colors.muted));
            allLines.push(style("  • Presiona [Tab] para alternar las pestañas del panel lateral.", colors.muted));
            allLines.push(style("  • [PageUp / PageDown] para navegar el historial.", colors.muted));
            allLines.push("");
        }
        // Render historical messages
        for (const msg of messages) {
            if (msg.role === "user") {
                this.renderBox(allLines, "Tú", msg.text, colors.accent, safeWidth);
            }
            else if (msg.role === "assistant") {
                if (msg.thinking) {
                    this.renderBox(allLines, "Razonamiento / Thinking", msg.thinking, colors.muted, safeWidth, true);
                }
                if (msg.text) {
                    this.renderBox(allLines, "Asistente", msg.text, colors.secondary, safeWidth);
                }
            }
            else if (msg.role === "system") {
                this.renderBox(allLines, "Sistema", msg.text, colors.warning, safeWidth);
            }
            allLines.push("");
        }
        // Render streaming content
        if (streamingThinking) {
            this.renderBox(allLines, "Pensando...", streamingThinking, colors.muted, safeWidth, true);
        }
        if (streamingText) {
            this.renderBox(allLines, "Asistente (escribiendo...)", streamingText + " █", colors.secondary, safeWidth);
        }
        else if (isWorking && !streamingThinking) {
            allLines.push(style(`  ⟳ ${this.agent.getStatusText()} █`, colors.accent));
            allLines.push("");
        }
        this.cachedHeight = allLines.length;
        // Viewport slicing (auto-scroll behavior)
        // Note: the caller layout will slice to the visible height, but we return all lines
        return allLines;
    }
    renderBox(target, title, content, borderColor, width, isDashed = false) {
        const horizontalChar = isDashed ? "┈" : "─";
        const verticalChar = isDashed ? "┊" : "│";
        const topLeft = isDashed ? "╭" : "┌";
        const topRight = isDashed ? "╮" : "┐";
        const bottomLeft = isDashed ? "╰" : "└";
        const bottomRight = isDashed ? "╯" : "┘";
        const titleStr = ` ${title} `;
        const topBarLength = Math.max(0, width - 2 - titleStr.length);
        const top = `${style(topLeft + horizontalChar, borderColor)}${style(titleStr, colors.bold, borderColor)}${style(horizontalChar.repeat(topBarLength) + topRight, borderColor)}`;
        target.push(top);
        const innerWidth = Math.max(10, width - 4);
        const rawLines = content.split("\n");
        for (const rawLine of rawLines) {
            if (rawLine.trim() === "") {
                target.push(`${style(verticalChar + " ", borderColor)}${" ".repeat(innerWidth)}${style(" " + verticalChar, borderColor)}`);
            }
            else {
                const wrapped = this.wrapText(rawLine, innerWidth);
                for (const w of wrapped) {
                    const paddingDiff = innerWidth - this.visualLength(w);
                    const pad = paddingDiff > 0 ? " ".repeat(paddingDiff) : "";
                    target.push(`${style(verticalChar + " ", borderColor)}${w}${pad}${style(" " + verticalChar, borderColor)}`);
                }
            }
        }
        const bottom = `${style(bottomLeft + horizontalChar.repeat(width - 2) + bottomRight, borderColor)}`;
        target.push(bottom);
    }
    wrapText(text, maxWidth) {
        const words = text.split(" ");
        const lines = [];
        let currentLine = "";
        for (const word of words) {
            const testLine = currentLine.length === 0 ? word : currentLine + " " + word;
            if (this.visualLength(testLine) <= maxWidth) {
                currentLine = testLine;
            }
            else {
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = word;
                }
                else {
                    // Word itself is longer than maxWidth
                    lines.push(word.slice(0, maxWidth));
                    currentLine = word.slice(maxWidth);
                }
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        return lines.length > 0 ? lines : [""];
    }
    visualLength(text) {
        return text.replace(/\x1b\[[0-9;]*m/g, "").length;
    }
}
//# sourceMappingURL=chat-view.js.map