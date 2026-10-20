import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { visibleWidth, type Component } from "@earendil-works/pi-tui";
import { colors, style } from "../theme.js";

export interface SavedSessionItem {
  id: string;
  filename: string;
  filePath: string;
  mtime: Date;
  sizeKb: string;
}

export class SessionModal implements Component {
  private isOpen = false;
  private sessions: SavedSessionItem[] = [];
  private selectedIndex = 0;
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  public open(): void {
    this.loadSessions();
    this.selectedIndex = 0;
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public invalidate(): void {}

  public navigateUp(): void {
    if (this.sessions.length > 0) {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.sessions.length) % this.sessions.length;
    }
  }

  public navigateDown(): void {
    if (this.sessions.length > 0) {
      this.selectedIndex =
        (this.selectedIndex + 1) % this.sessions.length;
    }
  }

  public getSelectedSession(): SavedSessionItem | null {
    return this.sessions[this.selectedIndex] ?? null;
  }

  private loadSessions(): void {
    try {
      const sanitizedCwd = this.cwd.replace(/[/\\:]/g, "-");
      const sessionsDir = path.join(
        os.homedir(),
        ".pi",
        "agent",
        "sessions",
        `--${sanitizedCwd.replace(/^-+|-+$/g, "")}--`
      );

      if (!fs.existsSync(sessionsDir)) {
        this.sessions = [];
        return;
      }

      const files = fs
        .readdirSync(sessionsDir)
        .filter((f) => f.endsWith(".jsonl"));

      const items: SavedSessionItem[] = [];
      for (const f of files) {
        const full = path.join(sessionsDir, f);
        const stat = fs.statSync(full);
        const idMatch = f.match(/_([0-9a-fA-F-]+)\.jsonl$/);
        const shortId = idMatch && idMatch[1] ? idMatch[1].slice(0, 8) : f.slice(0, 8);
        items.push({
          id: shortId,
          filename: f,
          filePath: full,
          mtime: stat.mtime,
          sizeKb: `${(stat.size / 1024).toFixed(0)} KB`,
        });
      }

      items.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      this.sessions = items;
    } catch {
      this.sessions = [];
    }
  }

  public render(width: number): string[] {
    if (!this.isOpen) return [];

    const safeWidth = Math.max(30, width);
    const lines: string[] = [];

    const titleStr = " 🕒 SAVED SESSIONS ";
    const hintStr = " [Esc: close | Up/Down: browse] ";
    const tLen = visibleWidth(titleStr);
    const hLen = visibleWidth(hintStr);
    const rem = Math.max(0, safeWidth - 3 - tLen - hLen);

    lines.push(
      `${style("╭─", colors.activeBorder)}${style(
        titleStr,
        colors.bold,
        colors.peach
      )}${style("─".repeat(rem), colors.activeBorder)}${style(
        hintStr,
        colors.muted
      )}${style("╮", colors.activeBorder)}`
    );

    if (this.sessions.length === 0) {
      const emptyMsg = style("  No saved sessions found for this project", colors.muted);
      const pad = Math.max(0, safeWidth - 2 - visibleWidth(emptyMsg));
      lines.push(`${style("│", colors.activeBorder)}${emptyMsg}${" ".repeat(pad)}${style("│", colors.activeBorder)}`);
    } else {
      const display = this.sessions.slice(0, 8);
      for (let i = 0; i < display.length; i++) {
        const s = display[i];
        if (!s) continue;
        const isSel = i === this.selectedIndex;
        const pointer = isSel ? style(" > ", colors.bold, colors.accent) : "   ";
        const idStr = isSel
          ? style(s.id, colors.bold, colors.accent)
          : style(s.id, colors.bold, colors.secondary);
        const dateStr = s.mtime.toLocaleString();
        const sizeStr = style(s.sizeKb, colors.muted);

        const row = `${pointer}${idStr}  ${style(dateStr, colors.text)}  (${sizeStr})`;
        const rowLen = visibleWidth(row);
        const pad = Math.max(0, safeWidth - 2 - rowLen);
        lines.push(
          `${style("│", colors.activeBorder)}${row}${" ".repeat(pad)}${style(
            "│",
            colors.activeBorder
          )}`
        );
      }
    }

    lines.push(`${style("╰" + "─".repeat(safeWidth - 2) + "╯", colors.activeBorder)}`);
    return lines;
  }
}
