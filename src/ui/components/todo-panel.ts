import type { Component } from "@earendil-works/pi-tui";
import { type TodoItem, type TodoTracker } from "../../state/todo-tracker.js";
import { colors, style, truncate } from "../theme.js";

export class TodoPanel implements Component {
  private todoTracker: TodoTracker;

  constructor(todoTracker: TodoTracker) {
    this.todoTracker = todoTracker;
  }

  public invalidate(): void {}

  public render(width: number): string[] {
    if (!this.todoTracker.hasTasks()) {
      return [];
    }

    const safeWidth = Math.max(20, width);
    const tasks = this.todoTracker.getTasks();
    const summary = this.todoTracker.getSummary();
    const isCollapsed = this.todoTracker.isCollapsed();
    const borderColor = colors.activeBorder;

    const title = ` 󰄲 Tasks (${summary.completed}/${summary.total}) `;
    const hint = isCollapsed ? " [Ctrl+T to expand] " : " [Ctrl+T to collapse] ";

    const titleVisualLen = title.length;
    const hintVisualLen = hint.length;
    const rem = Math.max(0, safeWidth - 3 - titleVisualLen - hintVisualLen);

    const top = `${style("┌─", borderColor)}${style(
      title,
      colors.bold,
      colors.warning
    )}${style("─".repeat(rem), borderColor)}${style(
      hint,
      colors.muted
    )}${style("┐", borderColor)}`;

    const lines: string[] = [top];

    if (isCollapsed) {
      // Show only active task or next pending task
      const activeTask =
        tasks.find((t) => t.status === "in_progress") ||
        tasks.find((t) => t.status === "pending") ||
        tasks[0];

      if (activeTask) {
        const statusIcon = this.getStatusIcon(activeTask.status);
        const text = ` ${statusIcon} #${activeTask.id}: ${activeTask.text} (${activeTask.status})`;
        lines.push(this.renderBoxLine(text, safeWidth, borderColor));
      }
    } else {
      // Show all tasks (bounded to last 8 if list is large)
      const displayTasks = tasks.slice(0, 8);
      for (const t of displayTasks) {
        const icon = this.getStatusIcon(t.status);
        const text = ` ${icon} #${t.id}: ${t.text}`;
        lines.push(this.renderBoxLine(text, safeWidth, borderColor));
      }
      if (tasks.length > 8) {
        const moreText = `   ... and ${tasks.length - 8} more tasks`;
        lines.push(this.renderBoxLine(moreText, safeWidth, borderColor));
      }
    }

    const bottom = `${style("└" + "─".repeat(safeWidth - 2) + "┘", borderColor)}`;
    lines.push(bottom);

    return lines;
  }

  private getStatusIcon(status: TodoItem["status"]): string {
    switch (status) {
      case "completed":
        return style("[✓]", colors.success);
      case "in_progress":
        return style("[⟳]", colors.warning);
      case "failed":
        return style("[✗]", colors.error);
      case "pending":
      default:
        return style("[ ]", colors.muted);
    }
  }

  private renderBoxLine(content: string, width: number, borderColor: string): string {
    const visual = content.replace(/\x1b\[[0-9;]*m/g, "");
    const maxInner = width - 4;
    const truncatedContent = visual.length > maxInner ? truncate(content, maxInner) : content;
    const truncatedVisual = truncatedContent.replace(/\x1b\[[0-9;]*m/g, "");
    const padCount = Math.max(0, width - 2 - truncatedVisual.length);

    return `${style("│", borderColor)}${truncatedContent}${" ".repeat(padCount)}${style(
      "│",
      borderColor
    )}`;
  }
}
