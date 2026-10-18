import type { Component, Focusable, TUI } from "@earendil-works/pi-tui";
import { type AgentManager } from "../state/agent-manager.js";
import { type GitWatcher } from "../state/git-watcher.js";
import { type MetricsTracker } from "../state/metrics-tracker.js";
import { type SpecGraphWatcher } from "../state/spec-graph-watcher.js";
import { type TodoTracker } from "../state/todo-tracker.js";
import { type ToolLogger } from "../state/tool-logger.js";
import { ChatView } from "./components/chat-view.js";
import { Header } from "./components/header.js";
import { InputBox } from "./components/input-box.js";
import { Sidebar } from "./components/sidebar.js";
import { StatusBar } from "./components/status-bar.js";
import { TodoPanel } from "./components/todo-panel.js";
import { colors, style } from "./theme.js";

export class AppLayout implements Component, Focusable {
  public focused = true;

  private tui: TUI;
  private agent: AgentManager;
  private todoTracker: TodoTracker;
  private header: Header;
  private chatView: ChatView;
  private sidebar: Sidebar;
  private todoPanel: TodoPanel;
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
    this.todoTracker = todoTracker;

    this.header = new Header(agent);
    this.inputBox = new InputBox();
    this.sidebar = new Sidebar(
      agent,
      metrics,
      git,
      toolLogger,
      specGraph,
      this.inputBox
    );
    this.chatView = new ChatView(agent);
    this.todoPanel = new TodoPanel(todoTracker);
    this.statusBar = new StatusBar(agent, metrics);

    this.syncInputBoxState();

    // Setup input submit
    this.inputBox.onSubmit((text) => {
      this.scrollFollow = true;
      this.chatScrollOffset = 0;
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
  }

  private syncInputBoxState(): void {
    const agents = this.agent.getAgents();
    this.inputBox.setActiveAgent(this.agent.getActiveAgentName(), agents.length > 1);
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
    this.todoPanel.invalidate();
    this.inputBox.invalidate();
    this.statusBar.invalidate();
  }

  public handleInput(data: string): void {
    // Ctrl+C -> Cancel current work or exit cleanly
    if (data === "\x03") {
      if (this.agent.getIsWorking()) {
        this.agent.abort();
        this.tui.requestRender();
      } else {
        this.tui.stop();
        process.exit(0);
      }
      return;
    }

    // Tab key -> Cycle to next installed Agent
    if (data === "\t") {
      this.agent.nextAgent();
      this.syncInputBoxState();
      this.tui.requestRender();
      return;
    }

    // Shift+Tab -> Cycle to previous installed Agent
    if (data === "\x1b[Z") {
      this.agent.prevAgent();
      this.syncInputBoxState();
      this.tui.requestRender();
      return;
    }

    // Ctrl+A, Alt+A, F2 -> Also cycle installed Agent
    if (data === "\x01" || data === "\x1ba" || data === "\x1bOQ" || data === "\x1b[12~") {
      this.agent.nextAgent();
      this.syncInputBoxState();
      this.tui.requestRender();
      return;
    }

    // Ctrl+T -> Toggle Todo Panel expand / collapse
    if (data === "\x14") {
      this.todoTracker.toggleCollapsed();
      this.tui.requestRender();
      return;
    }

    // Alt+M -> Toggle MCP Servers section in sidebar
    if (data === "\x1bm") {
      this.sidebar.toggleMcp();
      this.tui.requestRender();
      return;
    }

    // Alt+S -> Toggle Skills section in sidebar
    if (data === "\x1bs") {
      this.sidebar.toggleSkills();
      this.tui.requestRender();
      return;
    }

    // Alt+B -> Toggle Sidebar visibility
    if (data === "\x1bb") {
      this.sidebarVisible = !this.sidebarVisible;
      this.tui.requestRender();
      return;
    }

    // PageUp & PageDown for ChatView
    if (data === "\x1b[5~") {
      this.scrollFollow = false;
      this.chatScrollOffset += 5;
      this.tui.requestRender();
      return;
    }
    if (data === "\x1b[6~") {
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

    const headerLines = this.header.render(termWidth); // 2 lines
    const todoLines = this.todoPanel.render(termWidth); // 0 lines if empty, or collapsible box
    const inputBoxLines = this.inputBox.render(termWidth); // 3 lines
    const statusLines = this.statusBar.render(termWidth); // 1 line

    const chromeHeight =
      headerLines.length + todoLines.length + inputBoxLines.length + statusLines.length;
    const centerHeight = Math.max(3, termHeight - chromeHeight);

    // Compute split columns
    let centerLines: string[] = [];
    if (this.sidebarVisible && termWidth > 75) {
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
      ...todoLines,
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
