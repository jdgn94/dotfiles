import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { matchesKey, type Component, type Focusable, type TUI } from "@earendil-works/pi-tui";
import { type AgentManager } from "../state/agent-manager.js";
import { type GitWatcher } from "../state/git-watcher.js";
import { type MetricsTracker } from "../state/metrics-tracker.js";
import { type SpecGraphWatcher } from "../state/spec-graph-watcher.js";
import { type TodoTracker } from "../state/todo-tracker.js";
import { type ToolLogger } from "../state/tool-logger.js";
import { AgentPopup } from "./components/agent-popup.js";
import { ChatView } from "./components/chat-view.js";
import { DiffViewer } from "./components/diff-viewer.js";
import { Header } from "./components/header.js";
import { InputBox } from "./components/input-box.js";
import { SessionModal } from "./components/session-modal.js";
import { Sidebar } from "./components/sidebar.js";
import { StatusBar } from "./components/status-bar.js";
import { colors, style } from "./theme.js";

export class AppLayout implements Component, Focusable {
  public focused = true;

  private tui: TUI;
  private agent: AgentManager;
  private header: Header;
  private chatView: ChatView;
  private sidebar: Sidebar;
  private agentPopup: AgentPopup;
  private diffViewer: DiffViewer = new DiffViewer();
  private sessionModal: SessionModal = new SessionModal();
  private inputBox: InputBox;
  private statusBar: StatusBar;

  private sidebarVisible = true;
  private sidebarWidth = 44;
  private scrollFollow = true;
  private chatScrollOffset = 0; // lines from bottom
  private animationTimer?: NodeJS.Timeout;

  constructor(
    tui: TUI,
    agent: AgentManager,
    metrics: MetricsTracker,
    git: GitWatcher,
    todoTracker: TodoTracker,
    toolLogger?: ToolLogger,
    specGraph?: SpecGraphWatcher
  ) {
    this.tui = tui;
    this.agent = agent;

    this.header = new Header(agent);
    this.inputBox = new InputBox();
    this.agentPopup = new AgentPopup(agent);

    this.inputBox.onOpenExternalEditor(() => {
      this.openExternalEditor();
    });
    this.sidebar = new Sidebar(
      agent,
      metrics,
      git,
      toolLogger,
      todoTracker,
      specGraph,
      this.inputBox
    );
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
      if (trimmed === "/diff") {
        this.diffViewer.open();
        this.tui.requestRender();
        return;
      }
      if (trimmed === "/session" || trimmed === "/sessions") {
        this.sessionModal.open();
        this.tui.requestRender();
        return;
      }
      if (trimmed === "/mcp") {
        this.sidebar.toggleMcp();
        this.tui.requestRender();
      } else if (trimmed === "/skills") {
        this.sidebar.toggleSkills();
        this.tui.requestRender();
      } else if (trimmed === "/todos") {
        this.sidebar.togglePlan();
        this.tui.requestRender();
        return;
      }
      this.agent.prompt(text).catch(() => {});
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
      }, 25);
    }
  }

  private syncInputBoxState(): void {
    const agents = this.agent.getAgents();
    this.inputBox.setActiveAgent(
      this.agent.getActiveAgentName(),
      this.agent.getActiveAgentColor(),
      agents.length > 1
    );
    this.inputBox.setAvailableCommands(this.agent.getCommands());
  }

  private syncAnimationTimer(): void {
    if (this.agent.getIsWorking()) {
      if (!this.animationTimer) {
        this.animationTimer = setInterval(() => {
          this.tui.requestRender();
        }, 80);
      }
    } else {
      if (this.animationTimer) {
        clearInterval(this.animationTimer);
        this.animationTimer = undefined;
      }
    }
  }

  public invalidate(): void {
    this.header.invalidate();
    this.chatView.invalidate();
    this.sidebar.invalidate();
    this.agentPopup.invalidate();
    this.diffViewer.invalidate();
    this.sessionModal.invalidate();
    this.inputBox.invalidate();
    this.statusBar.invalidate();
  }

  private openExternalEditor(): void {
    const tempFile = path.join(os.tmpdir(), `pi-prompt-${Date.now()}.txt`);
    try {
      fs.writeFileSync(tempFile, this.inputBox.getText(), "utf8");
      this.tui.stop();
      const editor = process.env.EDITOR || "nano";
      execSync(`${editor} "${tempFile}"`, { stdio: "inherit" });
      const newText = fs.readFileSync(tempFile, "utf8");
      this.inputBox.setText(newText);
    } catch {
      // ignore
    } finally {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {
        // ignore
      }
      this.tui.start();
      this.tui.requestRender();
    }
  }

  public handleInput(data: string): void {
    // Handle input when DiffViewer modal is open
    if (this.diffViewer.getIsOpen()) {
      if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
        this.diffViewer.close();
        this.tui.requestRender();
        return;
      }
      if (matchesKey(data, "up") || matchesKey(data, "k")) {
        this.diffViewer.scrollUp(2);
        this.tui.requestRender();
        return;
      }
      if (matchesKey(data, "down") || matchesKey(data, "j")) {
        this.diffViewer.scrollDown(2);
        this.tui.requestRender();
        return;
      }
      if (matchesKey(data, "pageUp")) {
        this.diffViewer.scrollUp(8);
        this.tui.requestRender();
        return;
      }
      if (matchesKey(data, "pageDown")) {
        this.diffViewer.scrollDown(8);
        this.tui.requestRender();
        return;
      }
      return;
    }

    // Handle input when SessionModal is open
    if (this.sessionModal.getIsOpen()) {
      if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
        this.sessionModal.close();
        this.tui.requestRender();
        return;
      }
      if (matchesKey(data, "up")) {
        this.sessionModal.navigateUp();
        this.tui.requestRender();
        return;
      }
      if (matchesKey(data, "down")) {
        this.sessionModal.navigateDown();
        this.tui.requestRender();
        return;
      }
      return;
    }

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
        } else if (res.action === "selected_subagent") {
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
      } else {
        this.tui.stop();
        process.exit(0);
      }
      return;
    }

    // If typing a slash command, forward Up, Down, Tab directly to InputBox for autocomplete
    if (
      this.inputBox.getText().startsWith("/") &&
      (matchesKey(data, "up") || matchesKey(data, "down") || matchesKey(data, "tab"))
    ) {
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

    // Ctrl+D -> Open Git Diff Viewer
    if (matchesKey(data, "ctrl+d") || data === "\x04") {
      this.diffViewer.open();
      this.tui.requestRender();
      return;
    }

    // Ctrl+S -> Open Saved Sessions Browser
    if (matchesKey(data, "ctrl+s") || data === "\x13") {
      this.sessionModal.open();
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
    if (
      matchesKey(data, "f3") ||
      matchesKey(data, "ctrl+o") ||
      matchesKey(data, "alt+m") ||
      data === "\x1bm" ||
      data === "\x1bM" ||
      data === "\x1b[109;3u" ||
      data === "\x1b[77;3u" ||
      data === "\x1bOR" ||
      data === "\x1b[13~" ||
      data === "\x0f"
    ) {
      this.sidebar.toggleMcp();
      this.tui.requestRender();
      return;
    }

    // Toggle Skills (F4, Ctrl+K, Alt+S, Alt+Shift+S, and terminal variants)
    if (
      matchesKey(data, "f4") ||
      matchesKey(data, "ctrl+k") ||
      matchesKey(data, "alt+s") ||
      data === "\x1bs" ||
      data === "\x1bS" ||
      data === "\x1b[115;3u" ||
      data === "\x1b[83;3u" ||
      data === "\x1bOS" ||
      data === "\x1b[14~" ||
      data === "\x0b"
    ) {
      this.sidebar.toggleSkills();
      this.tui.requestRender();
      return;
    }

    // SGR Mouse Click Handling (clicking on sidebar, headers, or buttons)
    if (data.startsWith("\x1b[<") && (data.endsWith("M") || data.endsWith("m"))) {
      const match = data.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
      if (match && match[1] === "0" && match[4] === "M") {
        const col = parseInt(match[2] ?? "0", 10);
        const row = parseInt(match[3] ?? "0", 10);
        const termWidth = Math.max(
          40,
          (this.tui as { terminal?: { columns?: number } })?.terminal?.columns ??
            process.stdout.columns ??
            80
        );
        const termHeight =
          (this.tui as { terminal?: { rows?: number } })?.terminal?.rows ??
          process.stdout.rows ??
          24;

        // 1. Click on Header area -> open Agent selector
        if (row <= 2 && col >= termWidth - 32) {
          this.agentPopup.open();
          this.tui.requestRender();
          return;
        }

        // 2. Click on Status bar row (bottom row)
        if (row >= termHeight) {
          if (col >= 30 && col < 46) {
            this.agent.nextAgent();
            this.syncInputBoxState();
            this.tui.requestRender();
            return;
          }
          if (col >= 46 && col < 58) {
            this.agent.cycleThinkingLevel();
            this.tui.requestRender();
            return;
          }
          if (col >= 58 && col < 70) {
            this.sidebar.toggleMcp();
            this.tui.requestRender();
            return;
          }
          if (col >= 70 && col < 82) {
            this.sidebar.toggleSkills();
            this.tui.requestRender();
            return;
          }
          if (col >= 82) {
            process.exit(0);
          }
        }

        // 3. Click when modals are open -> close or select
        if (this.diffViewer.getIsOpen()) {
          this.diffViewer.close();
          this.tui.requestRender();
          return;
        }
        if (this.sessionModal.getIsOpen()) {
          this.sessionModal.close();
          this.tui.requestRender();
          return;
        }
        if (this.agentPopup.getIsOpen()) {
          const popupStartRow = 3;
          const rowOffset = row - popupStartRow;
          const res = this.agentPopup.handleClick(rowOffset);
          if (res) {
            if (res.action === "selected_primary") {
              this.syncInputBoxState();
            } else if (res.action === "selected_subagent") {
              this.inputBox.setText(`/agent ${res.agent.name} `);
              this.inputBox.setActiveAgent(res.agent.name, res.agent.color, true);
            }
            this.tui.requestRender();
            return;
          }
        }

        // 4. Click on Right Sidebar (dynamic clickMap)
        const sbWidth = Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45));
        const chatWidth = termWidth - sbWidth - 1;
        if (col > chatWidth) {
          const sidebarRowIndex = row - 3;
          const action = this.sidebar.handleClick(sidebarRowIndex);
          if (action) {
            if (action.type === "toggle_plan") {
              this.sidebar.togglePlan();
              this.tui.requestRender();
              return;
            }
            if (action.type === "toggle_mcp") {
              this.sidebar.toggleMcp();
              this.tui.requestRender();
              return;
            }
            if (action.type === "toggle_skills") {
              this.sidebar.toggleSkills();
              this.tui.requestRender();
              return;
            }
            if (action.type === "open_diff") {
              this.diffViewer.open(action.file);
              this.tui.requestRender();
              return;
            }
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
      if (this.chatScrollOffset === 0) this.scrollFollow = true;
      this.tui.requestRender();
      return;
    }

    // Forward everything else to InputBox
    this.inputBox.handleInput(data);
    this.tui.requestRender();
  }

  public render(width: number): string[] {
    const termWidth = Math.max(40, width);
    let termHeight = 24;

    const tuiAny = this.tui as { terminal?: { rows?: number } };
    if (tuiAny?.terminal?.rows && tuiAny.terminal.rows > 5) {
      termHeight = tuiAny.terminal.rows;
    } else if (process.stdout.rows && process.stdout.rows > 5) {
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

    const chromeHeight =
      headerLines.length + inputBoxLines.length + statusLines.length;
    const centerHeight = Math.max(3, termHeight - chromeHeight);

    // Compute split columns
    let centerLines: string[] = [];

    // If AgentPopup is open, render it centered in the primary center area
    if (this.agentPopup.getIsOpen()) {
      const popupWidth =
        this.sidebarVisible && termWidth > 75
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
        const compLines: string[] = [];
        for (let i = 0; i < centerHeight; i++) {
          const cLine = this.padTo(centerLines[i] ?? "", popupWidth);
          const sLine = this.padTo(allSidebarLines[i] ?? "", sbWidth);
          const sep = style("│", colors.border);
          compLines.push(`${cLine}${sep}${sLine}`);
        }
        centerLines = compLines;
      }
    } else if (this.diffViewer.getIsOpen()) {
      const popupWidth =
        this.sidebarVisible && termWidth > 75
          ? termWidth - Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45)) - 1
          : termWidth;
      const diffRendered = this.diffViewer.render(popupWidth, centerHeight);
      centerLines = [];
      for (const dl of diffRendered) {
        centerLines.push(dl);
      }
      while (centerLines.length < centerHeight) {
        centerLines.push(" ".repeat(popupWidth));
      }
      centerLines = centerLines.slice(0, centerHeight);

      if (this.sidebarVisible && termWidth > 75) {
        const sbWidth = Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45));
        const allSidebarLines = this.sidebar.render(sbWidth);
        const compLines: string[] = [];
        for (let i = 0; i < centerHeight; i++) {
          const cLine = this.padTo(centerLines[i] ?? "", popupWidth);
          const sLine = this.padTo(allSidebarLines[i] ?? "", sbWidth);
          const sep = style("│", colors.border);
          compLines.push(`${cLine}${sep}${sLine}`);
        }
        centerLines = compLines;
      }
    } else if (this.sessionModal.getIsOpen()) {
      const popupWidth =
        this.sidebarVisible && termWidth > 75
          ? termWidth - Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45)) - 1
          : termWidth;
      const modalRendered = this.sessionModal.render(popupWidth);
      centerLines = [];
      const topPad = Math.max(0, Math.floor((centerHeight - modalRendered.length) / 2));
      while (centerLines.length < topPad) {
        centerLines.push(" ".repeat(popupWidth));
      }
      for (const ml of modalRendered) {
        centerLines.push(ml);
      }
      while (centerLines.length < centerHeight) {
        centerLines.push(" ".repeat(popupWidth));
      }
      centerLines = centerLines.slice(0, centerHeight);

      if (this.sidebarVisible && termWidth > 75) {
        const sbWidth = Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45));
        const allSidebarLines = this.sidebar.render(sbWidth);
        const compLines: string[] = [];
        for (let i = 0; i < centerHeight; i++) {
          const cLine = this.padTo(centerLines[i] ?? "", popupWidth);
          const sLine = this.padTo(allSidebarLines[i] ?? "", sbWidth);
          const sep = style("│", colors.border);
          compLines.push(`${cLine}${sep}${sLine}`);
        }
        centerLines = compLines;
      }
    } else if (this.sidebarVisible && termWidth > 75) {
      const sbWidth = Math.min(this.sidebarWidth, Math.floor(termWidth * 0.45));
      const chatWidth = termWidth - sbWidth - 1; // 1 for separator

      const allChatLines = this.chatView.render(chatWidth);
      const allSidebarLines = this.sidebar.render(sbWidth);

      // Windowing chat lines
      let visibleChatLines: string[] = [];
      if (allChatLines.length <= centerHeight) {
        visibleChatLines = [...allChatLines];
        while (visibleChatLines.length < centerHeight) {
          visibleChatLines.push(" ".repeat(chatWidth));
        }
      } else {
        if (this.scrollFollow) {
          visibleChatLines = allChatLines.slice(allChatLines.length - centerHeight);
        } else {
          const endIdx = Math.max(centerHeight, allChatLines.length - this.chatScrollOffset);
          const startIdx = Math.max(0, endIdx - centerHeight);
          visibleChatLines = allChatLines.slice(startIdx, endIdx);
          while (visibleChatLines.length < centerHeight) {
            visibleChatLines.unshift(" ".repeat(chatWidth));
          }
        }
      }

      // Windowing sidebar lines
      let visibleSidebarLines: string[] = [];
      for (let i = 0; i < centerHeight; i++) {
        const sLine = allSidebarLines[i];
        if (sLine !== undefined) {
          visibleSidebarLines.push(this.padTo(sLine, sbWidth));
        } else {
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
    } else {
      // Full width chat view
      const allChatLines = this.chatView.render(termWidth);
      if (allChatLines.length <= centerHeight) {
        centerLines = [...allChatLines];
        while (centerLines.length < centerHeight) {
          centerLines.push(" ".repeat(termWidth));
        }
      } else {
        if (this.scrollFollow) {
          centerLines = allChatLines.slice(allChatLines.length - centerHeight);
        } else {
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

  private padTo(text: string, targetWidth: number): string {
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");
    const diff = targetWidth - stripped.length;
    if (diff <= 0) return text;
    return text + " ".repeat(diff);
  }
}
