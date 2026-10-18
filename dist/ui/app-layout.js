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
    inputBox;
    statusBar;
    sidebarVisible = true;
    sidebarWidth = 38;
    scrollFollow = true;
    chatScrollOffset = 0; // lines from bottom
    lastRenderHeight = 24;
    constructor(tui, agent, metrics, git, toolLogger) {
        this.tui = tui;
        this.agent = agent;
        this.header = new Header(agent, git);
        this.chatView = new ChatView(agent);
        this.sidebar = new Sidebar(agent, metrics, git, toolLogger);
        this.inputBox = new InputBox();
        this.statusBar = new StatusBar(agent, metrics);
        // Setup input submit
        this.inputBox.onSubmit((text) => {
            this.scrollFollow = true;
            this.chatScrollOffset = 0;
            this.agent.prompt(text).catch(() => { });
            this.tui.requestRender();
        });
        // Re-render whenever state changes
        agent.onChange(() => this.tui.requestRender());
        metrics.onChange(() => this.tui.requestRender());
        git.onChange(() => this.tui.requestRender());
        toolLogger.onChange(() => this.tui.requestRender());
    }
    invalidate() {
        this.header.invalidate();
        this.chatView.invalidate();
        this.sidebar.invalidate();
        this.inputBox.invalidate();
        this.statusBar.invalidate();
    }
    handleInput(data) {
        // Ctrl+C
        if (data === "\x03") {
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
        // Tab key -> Next Sidebar Tab
        if (data === "\t") {
            this.sidebar.nextTab();
            this.tui.requestRender();
            return;
        }
        // Shift+Tab -> Toggle Sidebar visibility
        if (data === "\x1b[Z") {
            this.sidebarVisible = !this.sidebarVisible;
            this.tui.requestRender();
            return;
        }
        // Alt+1, Alt+2, Alt+3 -> Direct Tab switch
        if (data === "\x1b1") {
            this.sidebar.setTab(0);
            this.tui.requestRender();
            return;
        }
        if (data === "\x1b2") {
            this.sidebar.setTab(1);
            this.tui.requestRender();
            return;
        }
        if (data === "\x1b3") {
            this.sidebar.setTab(2);
            this.tui.requestRender();
            return;
        }
        // PageUp & PageDown for ChatView
        if (data === "\x1b[5~") {
            // PageUp
            this.scrollFollow = false;
            this.chatScrollOffset += 5;
            this.tui.requestRender();
            return;
        }
        if (data === "\x1b[6~") {
            // PageDown
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
        // Approximate terminal rows from ProcessTerminal or fallback to stdout rows
        const termHeight = (process.stdout.rows && process.stdout.rows > 10) ? process.stdout.rows : 30;
        this.lastRenderHeight = termHeight;
        const headerLines = this.header.render(termWidth); // 2 lines
        const inputBoxLines = this.inputBox.render(termWidth); // 3 lines
        const statusLines = this.statusBar.render(termWidth); // 1 line
        const chromeHeight = headerLines.length + inputBoxLines.length + statusLines.length;
        const centerHeight = Math.max(5, termHeight - chromeHeight);
        // Compute split columns
        let centerLines = [];
        if (this.sidebarVisible && termWidth > 70) {
            const sbWidth = Math.min(this.sidebarWidth, Math.floor(termWidth * 0.4));
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
        return [...headerLines, ...centerLines, ...inputBoxLines, ...statusLines];
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