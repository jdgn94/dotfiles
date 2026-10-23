import { visibleWidth, type Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { colors, highlightCodeLine, renderWavePulse, style } from "../theme.js";
import { TetrisLogo } from "./tetris-logo.js";

export class ChatView implements Component {
  private agent: AgentManager;
  private tetrisLogo = new TetrisLogo();
  private scrollOffset = 0;
  private autoScroll = true;
  private cachedHeight = 20;

  constructor(agent: AgentManager) {
    this.agent = agent;
  }

  public invalidate(): void {}

  public scrollUp(lines = 3): void {
    this.scrollOffset = Math.max(0, this.scrollOffset - lines);
    this.autoScroll = false;
  }

  public scrollDown(lines = 3): void {
    this.scrollOffset += lines;
  }

  public updateLogo(): boolean {
    return this.tetrisLogo.update();
  }

  public isLogoComplete(): boolean {
    return this.tetrisLogo.isComplete();
  }

  public isAutoScroll(): boolean {
    return this.autoScroll;
  }

  public getCachedHeight(): number {
    return this.cachedHeight;
  }

  public render(width: number): string[] {
    const safeWidth = Math.max(20, width);
    const messages = this.agent.getMessages();
    const streamingText = this.agent.getStreamingText();
    const streamingThinking = this.agent.getStreamingThinking();
    const isWorking = this.agent.getIsWorking();

    const allLines: string[] = [];

    // Welcome banner with animated Tetris Logo if empty
    if (messages.length === 0 && !streamingText && !streamingThinking) {
      allLines.push("");
      const logoLines = this.tetrisLogo.render(safeWidth);
      for (const line of logoLines) {
        allLines.push(line);
      }
      allLines.push("");

      const centerText = (txt: string) => {
        const visualLen = visibleWidth(txt);
        const padCount = Math.max(0, Math.floor((safeWidth - visualLen) / 2));
        return " ".repeat(padCount) + txt;
      };

      allLines.push(
        centerText(style("π+ Pi-TUI-Plus Coding Agent", colors.bold, colors.primary))
      );
      allLines.push(
        centerText(
          style(
            "Advanced Split-View Terminal Interface with Real-Time Observability",
            colors.subtext
          )
        )
      );
      allLines.push("");
      allLines.push(
        style("  • Type a prompt below or '/' for commands, then press Enter.", colors.muted)
      );
      allLines.push(
        style("  • Press [Shift+Tab] to switch active agent at any time.", colors.muted)
      );
      allLines.push(
        style("  • Press [Ctrl+T] to cycle thinking effort / reasoning.", colors.muted)
      );
      allLines.push(
        style("  • Press [F3 / Alt+M] for MCPs, [F4 / Alt+S] for Skills.", colors.muted)
      );
      allLines.push(
        style("  • Use [PageUp / PageDown] or the mouse wheel to scroll; click [↓ Jump to end] to return.", colors.muted)
      );
      allLines.push("");
    }

    // Render historical messages
    for (const msg of messages) {
      if (msg.role === "user") {
        this.renderBox(allLines, "You", msg.text, colors.accent, safeWidth);
      } else if (msg.role === "assistant") {
        if (msg.thinking) {
          this.renderBox(
            allLines,
            "Reasoning / Thinking",
            msg.thinking,
            colors.muted,
            safeWidth,
            true
          );
        }
        if (msg.text) {
          this.renderBox(allLines, "Assistant", msg.text, colors.secondary, safeWidth);
        }
      } else if (msg.role === "system") {
        if (msg.text.startsWith("📝 ")) {
          this.renderBox(allLines, "Git File Change", msg.text, colors.peach, safeWidth);
        } else {
          this.renderBox(allLines, "System", msg.text, colors.warning, safeWidth);
        }
      }
      allLines.push("");
    }

    // Render streaming content
    if (streamingThinking) {
      this.renderBox(allLines, "Thinking...", streamingThinking, colors.muted, safeWidth, true);
    }
    if (streamingText) {
      this.renderBox(
        allLines,
        "Assistant (typing...)",
        streamingText + " █",
        colors.secondary,
        safeWidth
      );
    } else if (isWorking && !streamingThinking) {
      const elapsedSec = this.agent.getElapsedSec();
      allLines.push(
        `  ${renderWavePulse(14, elapsedSec)}  ${style(
          this.agent.getStatusText(),
          colors.accent
        )} █`
      );
      allLines.push("");
    }

    this.cachedHeight = allLines.length;
    return allLines;
  }

  private renderBox(
    target: string[],
    title: string,
    content: string,
    borderColor: string,
    width: number,
    isDashed = false
  ): void {
    const horizontalChar = isDashed ? "┈" : "─";
    const verticalChar = isDashed ? "┊" : "│";
    const topLeft = isDashed ? "╭" : "┌";
    const topRight = isDashed ? "╮" : "┐";
    const bottomLeft = isDashed ? "╰" : "└";
    const bottomRight = isDashed ? "╯" : "┘";

    const titleStr = ` ${title} `;
    const topBarLength = Math.max(0, width - 3 - titleStr.length);
    const top = `${style(topLeft + horizontalChar, borderColor)}${style(
      titleStr,
      colors.bold,
      borderColor
    )}${style(horizontalChar.repeat(topBarLength) + topRight, borderColor)}`;
    target.push(top);

    const innerWidth = Math.max(10, width - 4);
    const rawLines = content.split("\n");
    let inCodeBlock = false;

    for (const rawLine of rawLines) {
      if (rawLine.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        const lang = rawLine.slice(3).trim();
        const tag = inCodeBlock
          ? style(`  ${lang || "code"} `, colors.bold, colors.accent)
          : style("  end ", colors.muted);
        const tagVisual = visibleWidth(tag);
        const pad = Math.max(0, innerWidth - tagVisual);
        target.push(
          `${style(verticalChar + " ", borderColor)}${tag}${" ".repeat(pad)}${style(
            " " + verticalChar,
            borderColor
          )}`
        );
        continue;
      }

      if (rawLine.includes("(+") && rawLine.includes("/ -")) {
        const coloredLine = rawLine
          .replace(/(\+\d+)/g, style("$1", colors.bold, colors.success))
          .replace(/(-\d+)/g, style("$1", colors.bold, colors.error));
        const wrapped = this.wrapText(coloredLine, innerWidth);
        for (const w of wrapped) {
          const paddingDiff = innerWidth - this.visualLength(w);
          const pad = paddingDiff > 0 ? " ".repeat(paddingDiff) : "";
          target.push(
            `${style(verticalChar + " ", borderColor)}${w}${pad}${style(
              " " + verticalChar,
              borderColor
            )}`
          );
        }
        continue;
      }

      if (rawLine.trim() === "") {
        target.push(
          `${style(verticalChar + " ", borderColor)}${" ".repeat(innerWidth)}${style(
            " " + verticalChar,
            borderColor
          )}`
        );
      } else {
        const lineToRender = inCodeBlock ? highlightCodeLine(rawLine) : rawLine;
        const wrapped = this.wrapText(lineToRender, innerWidth);
        for (const w of wrapped) {
          const paddingDiff = innerWidth - this.visualLength(w);
          const pad = paddingDiff > 0 ? " ".repeat(paddingDiff) : "";
          target.push(
            `${style(verticalChar + " ", borderColor)}${w}${pad}${style(
              " " + verticalChar,
              borderColor
            )}`
          );
        }
      }
    }

    const bottom = `${style(
      bottomLeft + horizontalChar.repeat(width - 2) + bottomRight,
      borderColor
    )}`;
    target.push(bottom);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine.length === 0 ? word : currentLine + " " + word;
      if (this.visualLength(testLine) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word itself is longer than maxWidth
          lines.push(word.slice(0, maxWidth));
          currentLine = word.slice(maxWidth);
        }
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  private visualLength(str: string): number {
    return str.replace(/\x1b\[[0-9;]*m/g, "").length;
  }
}
