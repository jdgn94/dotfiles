import { matchesKey } from "@earendil-works/pi-tui";
import { AgentPopup } from "./components/agent-popup.js";
import { ChatView } from "./components/chat-view.js";
import { Header } from "./components/header.js";
import { InputBox } from "./components/input-box.js";
import { Sidebar } from "./components/sidebar.js";
import { StatusBar } from "./components/status-bar.js";
import { colors, style } from "./theme.js";
export class AppLayout {
    focused = true;
    tui;
    agent;
    header;
    chatView;
    sidebar;
    agentPopup;
    inputBox;
    statusBar;
    sidebarVisible = true;
    sidebarWidth = 44;
    scrollFollow = true;
    chatScrollOffset = 0; // lines from bottom
    animationTimer;
    constructor(tui, agent, metrics, git, todoTracker, toolLogger, specGraph) {
        this.tui = tui;
        this.agent = agent;
        this.header = new Header(agent);
        this.inputBox = new InputBox();
        this.agentPopup = new AgentPopup(agent);
        this.sidebar = new Sidebar(agent, metrics, git, toolLogger, todoTracker, specGraph, this.inputBox);
        this.chatView = new ChatView(agent);
        this.statusBar = new StatusBar(agent, metrics);
        this.syncInputBoxState();
        // Setup input submit
        this.inputBox.onSubmit((text) => {
            this.scrollFollow = true;
            this.chatScrollOffset = 0;
            const trimmed = text.trim();
            if (trimmed === "/agent") {
                this.agentPopup.open();
                this.tui.requestRender();
                return;
            }
            if (trimmed === "/mcp") {
                this.sidebar.toggleMcp();
                this.tui.requestRender();
            }
            else if (trimmed === "/skills") {
                this.sidebar.toggleSkills();
                this.tui.requestRender();
            }
            else if (trimmed === "/todos") {
                this.sidebar.togglePlan();
                this.tui.requestRender();
                return;
            }
            this.agent.prompt(text).catch(() => { });
            this.tui.requestRender();
        });
        // Re-render whenever state changes
        agent.onChange(() => {
            this.syncInputBoxState();
            this.syncAnimationTimer();
            this.tui.requestRender();
        });
        metrics.onChange(() => this.tui.requestRender());
        git.onChange(() => {
            this.syncInputBoxState();
            this.tui.requestRender();
        });
        todoTracker.onChange(() => this.tui.requestRender());
        if (toolLogger) {
            toolLogger.onChange(() => this.tui.requestRender());
        }
        if (specGraph) {
            specGraph.onChange(() => this.tui.requestRender());
        }
        // Startup Tetris logo animation ticker
        if (!this.chatView.isLogoComplete()) {
            const startupTimer = setInterval(() => {
                const changed = this.chatView.updateLogo();
                if (changed) {
                    this.tui.requestRender();
                }
                if (this.chatView.isLogoComplete()) {
                    clearInterval(startupTimer);
                }
            }, 65);
        }
    }
    syncInputBoxState() {
        const agents = this.agent.getAgents();
        this.inputBox.setActiveAgent(this.agent.getActiveAgentName(), this.agent.getActiveAgentColor(), agents.length > 1);
        this.inputBox.setAvailableCommands(this.agent.getCommands());
    }
    syncAnimationTimer() {
        if (this.agent.getIsWorking()) {
            if (!this.animationTimer) {
                this.animationTimer = setInterval(() => {
                    this.tui.requestRender();
                }, 80);
            }
        }
        else {
            if (this.animationTimer) {
                clearInterval(this.animationTimer);
                this.animationTimer = undefined;
            }
        }
    }
    invalidate() {
        this.header.invalidate();
        this.chatView.invalidate();
        this.sidebar.invalidate();
        this.agentPopup.invalidate();
        this.inputBox.invalidate();
        this.statusBar.invalidate();
    }
    handleInput(data) {
        // Handle input when AgentPopup modal is open
        if (this.agentPopup.getIsOpen()) {
            if (matchesKey(data, "up")) {
                this.agentPopup.navigateUp();
                this.tui.requestRender();
                return;
            }
            if (matchesKey(data, "down")) {
                this.agentPopup.navigateDown();
                this.tui.requestRender();
                return;
            }
            if (matchesKey(data, "escape")) {
                this.agentPopup.close();
                this.tui.requestRender();
                return;
            }
            if (matchesKey(data, "enter") || data === "\r" || data === "\n") {
                const res = this.agentPopup.selectCurrent();
                if (res.action === "selected_primary") {
                    this.syncInputBoxState();
                }
                else if (res.action === "selected_subagent") {
                    this.inputBox.setText(`/agent ${res.agent.name} `);
                    this.inputBox.setActiveAgent(res.agent.name, res.agent.color, true);
                }
                this.tui.requestRender();
                return;
            }
            return;
        }
        // Ctrl+C -> Cancel current work or exit cleanly
        if (matchesKey(data, "ctrl+c") || data === "\x03") {
            if (this.agent.getIsWorking()) {
                this.agent.abort();
                this.tui.requestRender();
            }
            else {
                this.tui.stop();
                process.exit(0);
            }
            return;
        }
        // If typing a slash command, forward Up, Down, Tab directly to InputBox for autocomplete
        if (this.inputBox.getText().startsWith("/") &&
            (matchesKey(data, "up") || matchesKey(data, "down") || matchesKey(data, "tab"))) {
            this.inputBox.handleInput(data);
            this.tui.requestRender();
            return;
        }
        // Shift+Tab -> Cycle active agent (user requested shortcut)
        if (matchesKey(data, "shift+tab") || data === "\x1b[Z") {
            this.agent.nextAgent();
            this.syncInputBoxState();
            this.tui.requestRender();
            return;
        }
        // Ctrl+A, Alt+A -> Also cycle installed Agent
        if (matchesKey(data, "ctrl+a") || matchesKey(data, "alt+a") || data === "\x01" || data === "\x1ba") {
            this.agent.nextAgent();
            this.syncInputBoxState();
            this.tui.requestRender();
            return;
        }
        // Ctrl+T -> Cycle Thinking Effort / Reasoning level (user requested shortcut)
        if (matchesKey(data, "ctrl+t") || data === "\x14") {
            this.agent.cycleThinkingLevel();
            this.tui.requestRender();
            return;
        }
        // Ctrl+Y or Alt+T -> Toggle Plan & Tasks in Sidebar
        if (matchesKey(data, "ctrl+y") || data === "\x19") {
            this.sidebar.togglePlan();
            this.tui.requestRender();
            return;
        }
        // Toggle MCP Servers (F3, Ctrl+O, Alt+M, Alt+Shift+M, and terminal variants)
        if (matchesKey(data, "f3") ||
            matchesKey(data, "ctrl+o") ||
            matchesKey(data, "alt+m") ||
            data === "\x1bm" ||
            data === "\x1bM" ||
            data === "\x1b[109;3u" ||
            data === "\x1b[77;3u" ||
            data === "\x1bOR" ||
            data === "\x1b[13~" ||
            data === "\x0f") {
            this.sidebar.toggleMcp();
            this.tui.requestRender();
            return;
        }
        // Toggle Skills (F4, Ctrl+K, Alt+S, Alt+Shift+S, and terminal variants)
        if (matchesKey(data, "f4") ||
            matchesKey(data, "ctrl+k") ||
            matchesKey(data, "alt+s") ||
            data === "\x1bs" ||
            data === "\x1bS" ||
            data === "\x1b[115;3u" ||
            data === "\x1b[83;3u" ||
            data === "\x1bOS" ||
            data === "\x1b[14~" ||
            data === "\x0b") {
            this.sidebar.toggleSkills();
            this.tui.requestRender();
            return;
        }
        // SGR Mouse Click Handling (clicking on sidebar or headers)
        if (data.startsWith("\x1b[<") && (data.endsWith("M") || data.endsWith("m"))) {
            const match = data.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
            if (match && match[1] === "0" && match[4] === "M") {
                const col = parseInt(match[2] ?? "0", 10);
                const row = parseInt(match[3] ?? "0", 10);
                const termWidth = Math.max(40, this.tui?.terminal?.columns ??
                    process.stdout.columns ??
                    80);
                const sbWidth = Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45));
                const chatWidth = termWidth - sbWidth - 1;
                if (col > chatWidth) {
                    // Clicked on right sidebar
                    if (row >= 10 && row <= 16) {
                        this.sidebar.toggleMcp();
                        this.tui.requestRender();
                        return;
                    }
                    if (row > 16 && row <= 24) {
                        this.sidebar.toggleSkills();
                        this.tui.requestRender();
                        return;
                    }
                }
            }
        }
        // Alt+B -> Toggle Sidebar visibility
        if (matchesKey(data, "alt+b") || data === "\x1bb") {
            this.sidebarVisible = !this.sidebarVisible;
            this.tui.requestRender();
            return;
        }
        // PageUp & PageDown for ChatView
        if (matchesKey(data, "pageUp") || data === "\x1b[5~") {
            this.scrollFollow = false;
            this.chatScrollOffset += 5;
            this.tui.requestRender();
            return;
        }
        if (matchesKey(data, "pageDown") || data === "\x1b[6~") {
            this.chatScrollOffset = Math.max(0, this.chatScrollOffset - 5);
            if (this.chatScrollOffset === 0)
                this.scrollFollow = true;
            this.tui.requestRender();
            return;
        }
        // Forward everything else to InputBox
        this.inputBox.handleInput(data);
        this.tui.requestRender();
    }
    render(width) {
        const termWidth = Math.max(40, width);
        let termHeight = 24;
        const tuiAny = this.tui;
        if (tuiAny?.terminal?.rows && tuiAny.terminal.rows > 5) {
            termHeight = tuiAny.terminal.rows;
        }
        else if (process.stdout.rows && process.stdout.rows > 5) {
            termHeight = process.stdout.rows;
        }
        // Sync latest commands if available
        const cmds = this.agent.getCommands();
        if (cmds.length > 0) {
            this.inputBox.setAvailableCommands(cmds);
        }
        const headerLines = this.header.render(termWidth); // 2 lines
        const inputBoxLines = this.inputBox.render(termWidth); // 3+ lines (including command popup when typing /)
        const statusLines = this.statusBar.render(termWidth); // 1 line
        const chromeHeight = headerLines.length + inputBoxLines.length + statusLines.length;
        const centerHeight = Math.max(3, termHeight - chromeHeight);
        // Compute split columns
        let centerLines = [];
        // If AgentPopup is open, render it centered in the primary center area
        if (this.agentPopup.getIsOpen()) {
            const popupWidth = this.sidebarVisible && termWidth > 75
                ? termWidth - Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45)) - 1
                : termWidth;
            const popupLines = this.agentPopup.render(popupWidth);
            const topPad = Math.max(0, Math.floor((centerHeight - popupLines.length) / 2));
            while (centerLines.length < topPad) {
                centerLines.push(" ".repeat(popupWidth));
            }
            for (const pl of popupLines) {
                centerLines.push(pl);
            }
            while (centerLines.length < centerHeight) {
                centerLines.push(" ".repeat(popupWidth));
            }
            centerLines = centerLines.slice(0, centerHeight);
            if (this.sidebarVisible && termWidth > 75) {
                const sbWidth = Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45));
                const allSidebarLines = this.sidebar.render(sbWidth);
                const compLines = [];
                for (let i = 0; i < centerHeight; i++) {
                    const cLine = this.padTo(centerLines[i] ?? "", popupWidth);
                    const sLine = this.padTo(allSidebarLines[i] ?? "", sbWidth);
                    const sep = style("│", colors.border);
                    compLines.push(`${cLine}${sep}${sLine}`);
                }
                centerLines = compLines;
            }
        }
        else if (this.sidebarVisible && termWidth > 75) {
            const sbWidth = Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45));
            const chatWidth = termWidth - sbWidth - 1; // 1 for separator
            const allChatLines = this.chatView.render(chatWidth);
            const allSidebarLines = this.sidebar.render(sbWidth);
            // Windowing chat lines
            let visibleChatLines = [];
            if (allChatLines.length <= centerHeight) {
                visibleChatLines = [...allChatLines];
                while (visibleChatLines.length < centerHeight) {
                    visibleChatLines.push(" ".repeat(chatWidth));
                }
            }
            else {
                if (this.scrollFollow) {
                    visibleChatLines = allChatLines.slice(allChatLines.length - centerHeight);
                }
                else {
                    const endIdx = Math.max(centerHeight, allChatLines.length - this.chatScrollOffset);
                    const startIdx = Math.max(0, endIdx - centerHeight);
                    visibleChatLines = allChatLines.slice(startIdx, endIdx);
                    while (visibleChatLines.length < centerHeight) {
                        visibleChatLines.unshift(" ".repeat(chatWidth));
                    }
                }
            }
            // Windowing sidebar lines
            let visibleSidebarLines = [];
            for (let i = 0; i < centerHeight; i++) {
                const sLine = allSidebarLines[i];
                if (sLine !== undefined) {
                    visibleSidebarLines.push(this.padTo(sLine, sbWidth));
                }
                else {
                    visibleSidebarLines.push(" ".repeat(sbWidth));
                }
            }
            // Composite side by side with vertical border
            for (let i = 0; i < centerHeight; i++) {
                const cLine = this.padTo(visibleChatLines[i] || "", chatWidth);
                const sLine = visibleSidebarLines[i] || " ".repeat(sbWidth);
                const sep = style("│", colors.border);
                centerLines.push(`${cLine}${sep}${sLine}`);
            }
        }
        else {
            // Full width chat view
            const allChatLines = this.chatView.render(termWidth);
            if (allChatLines.length <= centerHeight) {
                centerLines = [...allChatLines];
                while (centerLines.length < centerHeight) {
                    centerLines.push(" ".repeat(termWidth));
                }
            }
            else {
                if (this.scrollFollow) {
                    centerLines = allChatLines.slice(allChatLines.length - centerHeight);
                }
                else {
                    const endIdx = Math.max(centerHeight, allChatLines.length - this.chatScrollOffset);
                    const startIdx = Math.max(0, endIdx - centerHeight);
                    centerLines = allChatLines.slice(startIdx, endIdx);
                    while (centerLines.length < centerHeight) {
                        centerLines.unshift(" ".repeat(termWidth));
                    }
                }
            }
        }
        const finalLines = [
            ...headerLines,
            ...centerLines,
            ...inputBoxLines,
            ...statusLines,
        ];
        if (finalLines.length > termHeight) {
            return finalLines.slice(0, termHeight);
        }
        while (finalLines.length < termHeight) {
            finalLines.push(" ".repeat(termWidth));
        }
        return finalLines;
    }
    padTo(text, targetWidth) {
        const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");
        const diff = targetWidth - stripped.length;
        if (diff <= 0)
            return text;
        return text + " ".repeat(diff);
    }
}
//# sourceMappingURL=app-layout.js.map