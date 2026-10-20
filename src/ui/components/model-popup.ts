import { visibleWidth, type Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { colors, style } from "../theme.js";

export interface AvailableModelItem {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  reasoning?: boolean;
}

export class ModelPopup implements Component {
  private agentManager: AgentManager;
  private isOpen = false;
  private models: AvailableModelItem[] = [];
  private selectedIndex = 0;
  private searchQuery = "";
  private onSelectModelCallback?: (model: AvailableModelItem) => void;

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
  }

  public async open(): Promise<void> {
    this.isOpen = true;
    this.selectedIndex = 0;
    this.searchQuery = "";
    this.models = await this.agentManager.getAvailableModels();
  }

  public close(): void {
    this.isOpen = false;
    this.searchQuery = "";
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public onSelectModel(cb: (model: AvailableModelItem) => void): void {
    this.onSelectModelCallback = cb;
  }

  public invalidate(): void {}

  public handleSearchInput(data: string): void {
    if (data === "\x7f" || data === "\b") {
      if (this.searchQuery.length > 0) {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this.selectedIndex = 0;
      }
      return;
    }
    if (!data.startsWith("\x1b") && data.length === 1) {
      this.searchQuery += data;
      this.selectedIndex = 0;
    }
  }

  private getFilteredModels(): AvailableModelItem[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.models;
    return this.models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q)
    );
  }

  public navigateUp(): void {
    const list = this.getFilteredModels();
    if (list.length > 0) {
      this.selectedIndex = (this.selectedIndex - 1 + list.length) % list.length;
    }
  }

  public navigateDown(): void {
    const list = this.getFilteredModels();
    if (list.length > 0) {
      this.selectedIndex = (this.selectedIndex + 1) % list.length;
    }
  }

  public selectCurrent(): AvailableModelItem | null {
    const list = this.getFilteredModels();
    const chosen = list[this.selectedIndex] ?? list[0];
    this.close();

    if (chosen) {
      if (this.onSelectModelCallback) {
        this.onSelectModelCallback(chosen);
      }
      return chosen;
    }
    return null;
  }

  public handleClick(rowOffset: number): AvailableModelItem | null {
    if (!this.isOpen) return null;
    const list = this.getFilteredModels();
    // Row 0: header, Row 1: search, Row 2: separator, Row 3: list starts
    const listIdx = rowOffset - 3;
    if (listIdx >= 0 && listIdx < list.length) {
      this.selectedIndex = listIdx;
      return this.selectCurrent();
    }
    return null;
  }

  public render(width: number): string[] {
    if (!this.isOpen) return [];

    const safeWidth = Math.max(30, width);
    const lines: string[] = [];
    const filtered = this.getFilteredModels();
    const currentModelId = this.agentManager.getModelId().toLowerCase();

    // Header
    const title = " 🧠 SELECT AI MODEL ";
    const hint = " [Esc: close | Enter: select] ";
    const tLen = visibleWidth(title);
    const hLen = visibleWidth(hint);
    const rem = Math.max(0, safeWidth - 3 - tLen - hLen);

    lines.push(
      `${style("╭─", colors.activeBorder)}${style(title, colors.bold, colors.secondary)}${style(
        "─".repeat(rem),
        colors.activeBorder
      )}${style(hint, colors.muted)}${style("╮", colors.activeBorder)}`
    );

    // Search Bar
    const searchDisplay = this.searchQuery
      ? `${style("   Search: ", colors.secondary)}${style(this.searchQuery, colors.bold)}${style(
          "█",
          colors.accent
        )}`
      : `${style("   Search: ", colors.muted)}${style(
          "type to filter models (anthropic, gemini, gpt...)",
          colors.muted
        )}`;
    lines.push(this.formatBoxLine(searchDisplay, safeWidth));
    lines.push(
      this.formatBoxLine(style("  " + "─".repeat(safeWidth - 6), colors.border), safeWidth)
    );

    if (filtered.length === 0) {
      lines.push(this.formatBoxLine("", safeWidth));
      lines.push(
        this.formatBoxLine(
          style("   No models match your search query", colors.muted),
          safeWidth
        )
      );
      lines.push(this.formatBoxLine("", safeWidth));
    } else {
      // Display up to 10 models with scrolling
      const maxDisplay = 10;
      const startIndex = Math.max(
        0,
        Math.min(
          this.selectedIndex - Math.floor(maxDisplay / 2),
          filtered.length - maxDisplay
        )
      );
      const endIndex = Math.min(startIndex + maxDisplay, filtered.length);

      for (let i = startIndex; i < endIndex; i++) {
        const item = filtered[i];
        if (!item) continue;
        const isSel = i === this.selectedIndex;
        const isActive = item.id.toLowerCase() === currentModelId;

        const pointer = isSel ? style(" > ", colors.bold, colors.accent) : "   ";
        const activeBadge = isActive
          ? style("● Active", colors.bold, colors.success)
          : style("○", colors.muted);

        const providerBadge = style(
          `[${item.provider}]`.padEnd(14),
          colors.bold,
          colors.secondary
        );
        const nameStyled = isSel
          ? style(item.id.padEnd(24), colors.bold, colors.accent)
          : style(item.id.padEnd(24), colors.bold, colors.text);

        const ctxWindow =
          item.contextWindow >= 1000000
            ? `${(item.contextWindow / 1000000).toFixed(0)}M`
            : `${Math.round(item.contextWindow / 1000)}k`;
        const capBadge = style(`(${ctxWindow})`, colors.muted);
        const reasoningBadge = item.reasoning ? style(" [think]", colors.peach) : "";

        const rowContent = `${pointer}${activeBadge} ${providerBadge} ${nameStyled} ${capBadge}${reasoningBadge}`;
        lines.push(this.formatBoxLine(rowContent, safeWidth));
      }

      if (filtered.length > maxDisplay) {
        const scrollInfo = style(
          `  (showing ${startIndex + 1}-${endIndex} of ${filtered.length} models)`,
          colors.muted
        );
        lines.push(this.formatBoxLine(scrollInfo, safeWidth));
      }
    }

    lines.push(`${style("╰" + "─".repeat(safeWidth - 2) + "╯", colors.activeBorder)}`);
    return lines;
  }

  private formatBoxLine(content: string, width: number): string {
    const visualLen = visibleWidth(content);
    const padCount = Math.max(0, width - 2 - visualLen);
    return `${style("│", colors.activeBorder)}${content}${" ".repeat(padCount)}${style(
      "│",
      colors.activeBorder
    )}`;
  }
}
