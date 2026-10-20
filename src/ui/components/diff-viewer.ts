import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { visibleWidth, type Component } from "@earendil-works/pi-tui";
import { colors, style, truncate } from "../theme.js";

export class DiffViewer implements Component {
  private isOpen = false;
  private targetFile?: string;
  private diffLines: string[] = [];
  private scrollOffset = 0;

  public open(file?: string): void {
    this.targetFile = file;
    this.scrollOffset = 0;
    this.loadDiff();
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
    this.diffLines = [];
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public scrollUp(lines = 3): void {
    this.scrollOffset = Math.max(0, this.scrollOffset - lines);
  }

  public scrollDown(lines = 3): void {
    const maxScroll = Math.max(0, this.diffLines.length - 5);
    this.scrollOffset = Math.min(maxScroll, this.scrollOffset + lines);
  }

  public invalidate(): void {}

  public handleClick(): void {
    this.close();
  }

  private loadDiff(): void {
    try {
      let raw = "";
      const fileArg = this.targetFile ? `"${this.targetFile}"` : "";

      // 1. Unstaged diff
      try {
        raw += execSync(`git diff ${fileArg}`, {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        // ignore
      }

      // 2. Staged diff
      try {
        const staged = execSync(`git diff --cached ${fileArg}`, {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        });
        if (staged) raw += `\n${staged}`;
      } catch {
        // ignore
      }

      // 3. If targetFile is an untracked new file
      if (!raw.trim() && this.targetFile && fs.existsSync(this.targetFile)) {
        try {
          const content = fs.readFileSync(this.targetFile, "utf8");
          raw = `--- /dev/null\n+++ b/${this.targetFile}\n@@ -0,0 +1,${content.split("\n").length} @@\n`;
          raw += content
            .split("\n")
            .map((l) => `+${l}`)
            .join("\n");
        } catch {
          // ignore
        }
      }

      if (!raw.trim()) {
        this.diffLines = [style("✓ Working tree clean (no changes to display)", colors.success)];
        return;
      }

      // Format and syntax-highlight diff lines
      const lines = raw.split("\n");
      const colored: string[] = [];

      for (const line of lines) {
        if (line.startsWith("diff --git") || line.startsWith("index ")) {
          colored.push(style(line, colors.bold, colors.secondary));
        } else if (line.startsWith("---") || line.startsWith("+++")) {
          colored.push(style(line, colors.bold, colors.warning));
        } else if (line.startsWith("@@")) {
          colored.push(style(line, colors.bold, colors.accent));
        } else if (line.startsWith("+")) {
          colored.push(style(line, colors.success));
        } else if (line.startsWith("-")) {
          colored.push(style(line, colors.error));
        } else {
          colored.push(style(line, colors.subtext));
        }
      }

      this.diffLines = colored;
    } catch {
      this.diffLines = [style("Error loading git diff", colors.error)];
    }
  }

  public render(width: number, height = 20): string[] {
    if (!this.isOpen) return [];

    const safeWidth = Math.max(30, width);
    const safeHeight = Math.max(6, height);
    const lines: string[] = [];

    const titleStr = this.targetFile
      ? `  Diff: ${path.basename(this.targetFile)} `
      : "  Git Diff (Working Tree) ";
    const hintStr = " [Esc: close | Up/Down: scroll] ";
    const tLen = visibleWidth(titleStr);
    const hLen = visibleWidth(hintStr);
    const remTop = Math.max(0, safeWidth - 3 - tLen - hLen);

    const top = `${style("╭─", colors.activeBorder)}${style(
      titleStr,
      colors.bold,
      colors.peach
    )}${style("─".repeat(remTop), colors.activeBorder)}${style(
      hintStr,
      colors.muted
    )}${style("╮", colors.activeBorder)}`;
    lines.push(top);

    const innerHeight = Math.max(3, safeHeight - 2);
    const visibleLines = this.diffLines.slice(
      this.scrollOffset,
      this.scrollOffset + innerHeight
    );

    for (let i = 0; i < innerHeight; i++) {
      const line = visibleLines[i];
      if (line !== undefined) {
        const visualLen = visibleWidth(line);
        const maxContentWidth = safeWidth - 4;
        const truncatedLine =
          visualLen > maxContentWidth ? truncate(line, maxContentWidth) : line;
        const finalVisualLen = visibleWidth(truncatedLine);
        const padCount = Math.max(0, safeWidth - 2 - finalVisualLen);
        lines.push(
          `${style("│", colors.activeBorder)}${truncatedLine}${" ".repeat(padCount)}${style(
            "│",
            colors.activeBorder
          )}`
        );
      } else {
        lines.push(
          `${style("│", colors.activeBorder)}${" ".repeat(safeWidth - 2)}${style(
            "│",
            colors.activeBorder
          )}`
        );
      }
    }

    const bottom = `${style("╰" + "─".repeat(safeWidth - 2) + "╯", colors.activeBorder)}`;
    lines.push(bottom);

    return lines;
  }
}
