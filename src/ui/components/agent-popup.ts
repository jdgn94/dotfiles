import { visibleWidth, type Component } from "@earendil-works/pi-tui";
import { type AgentDefinition, type AgentManager } from "../../state/agent-manager.js";
import { colors, style, truncate } from "../theme.js";

export type AgentPopupResult =
  | { action: "selected_primary"; agent: AgentDefinition }
  | { action: "selected_subagent"; agent: AgentDefinition }
  | { action: "close" };

export class AgentPopup implements Component {
  private agentManager: AgentManager;
  private selectedIndex = 0;
  private isOpen = false;
  private searchQuery = "";

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
  }

  public open(): void {
    this.isOpen = true;
    this.selectedIndex = 0;
    this.searchQuery = "";
  }

  public close(): void {
    this.isOpen = false;
    this.searchQuery = "";
  }

  public getIsOpen(): boolean {
    return this.isOpen;
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
    // Append printable character
    if (!data.startsWith("\x1b") && data.length === 1) {
      this.searchQuery += data;
      this.selectedIndex = 0;
    }
  }

  private filterAgents(agents: AgentDefinition[]): AgentDefinition[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }

  private getAllItems(): AgentDefinition[] {
    const primaries = this.filterAgents(this.agentManager.getPrimaryAgents());
    const subagents = this.filterAgents(this.agentManager.getSubagents());
    return [...primaries, ...subagents];
  }

  public navigateUp(): void {
    const all = this.getAllItems();
    if (all.length > 0) {
      this.selectedIndex = (this.selectedIndex - 1 + all.length) % all.length;
    }
  }

  public navigateDown(): void {
    const all = this.getAllItems();
    if (all.length > 0) {
      this.selectedIndex = (this.selectedIndex + 1) % all.length;
    }
  }

  public selectCurrent(): AgentPopupResult {
    const all = this.getAllItems();
    const chosen = all[this.selectedIndex] ?? all[0];
    this.close();

    if (!chosen) {
      return { action: "close" };
    }

    if (chosen.category === "primary") {
      this.agentManager.selectAgent(chosen.name);
      return { action: "selected_primary", agent: chosen };
    }
    return { action: "selected_subagent", agent: chosen };
  }

  public handleClick(rowOffset: number): AgentPopupResult | null {
    if (!this.isOpen) return null;
    const primaries = this.filterAgents(this.agentManager.getPrimaryAgents());
    const subagents = this.filterAgents(this.agentManager.getSubagents());

    // Row 0 is header, Row 1 is Search bar, Row 2 is separator, Row 3 is primary title
    if (rowOffset >= 4 && rowOffset < 4 + primaries.length) {
      this.selectedIndex = rowOffset - 4;
      return this.selectCurrent();
    }
    const subStart = 4 + primaries.length + 2;
    if (rowOffset >= subStart && rowOffset < subStart + subagents.length) {
      this.selectedIndex = primaries.length + (rowOffset - subStart);
      return this.selectCurrent();
    }
    return null;
  }

  public render(width: number): string[] {
    if (!this.isOpen) return [];

    const safeWidth = Math.max(30, width);
    const lines: string[] = [];
    const primaries = this.filterAgents(this.agentManager.getPrimaryAgents());
    const subagents = this.filterAgents(this.agentManager.getSubagents());
    const totalMatching = primaries.length + subagents.length;

    // Header with rounded corners
    const title = " 🤖 AGENT & SUBAGENT SELECTOR ";
    const hint = " [Esc: close | Enter: select] ";
    const tLen = visibleWidth(title);
    const hLen = visibleWidth(hint);
    const rem = Math.max(0, safeWidth - 3 - tLen - hLen);

    lines.push(
      `${style("╭─", colors.activeBorder)}${style(title, colors.bold, colors.accent)}${style(
        "─".repeat(rem),
        colors.activeBorder
      )}${style(hint, colors.muted)}${style("╮", colors.activeBorder)}`
    );

    // Live Search Bar
    const searchDisplay = this.searchQuery
      ? `${style("   Search: ", colors.accent)}${style(this.searchQuery, colors.bold)}${style(
          "█",
          colors.secondary
        )}`
      : `${style("   Search: ", colors.muted)}${style(
          "type to filter agents...",
          colors.muted
        )}`;
    lines.push(this.formatBoxLine(searchDisplay, safeWidth));
    lines.push(
      this.formatBoxLine(style("  " + "─".repeat(safeWidth - 6), colors.border), safeWidth)
    );

    if (totalMatching === 0) {
      lines.push(this.formatBoxLine("", safeWidth));
      lines.push(
        this.formatBoxLine(
          style("   No agents or subagents match your search", colors.muted),
          safeWidth
        )
      );
      lines.push(this.formatBoxLine("", safeWidth));
    } else {
      // Section 1: Primary Agents
      if (primaries.length > 0) {
        const pSecTitle = "  ── PRIMARY AGENTS ───────────────────────────────────────────────────";
        lines.push(
          this.formatBoxLine(
            style(truncate(pSecTitle, safeWidth - 4), colors.secondary),
            safeWidth
          )
        );

        for (let i = 0; i < primaries.length; i++) {
          const item = primaries[i];
          if (!item) continue;
          const isSel = i === this.selectedIndex;
          lines.push(this.renderAgentRow(item, isSel, safeWidth));
        }
      }

      // Section 2: Specialized Subagents
      if (subagents.length > 0) {
        if (primaries.length > 0) lines.push(this.formatBoxLine("", safeWidth));
        const sSecTitle =
          "  ── SPECIALIZED SUBAGENTS (invoke with /agent [name] [prompt]) ────────";
        lines.push(
          this.formatBoxLine(style(truncate(sSecTitle, safeWidth - 4), colors.peach), safeWidth)
        );

        for (let j = 0; j < subagents.length; j++) {
          const item = subagents[j];
          if (!item) continue;
          const globalIdx = primaries.length + j;
          const isSel = globalIdx === this.selectedIndex;
          lines.push(this.renderAgentRow(item, isSel, safeWidth));
        }
      }
    }

    lines.push(`${style("╰" + "─".repeat(safeWidth - 2) + "╯", colors.activeBorder)}`);
    return lines;
  }

  private renderAgentRow(agent: AgentDefinition, isSelected: boolean, width: number): string {
    const pointer = isSelected ? style(" > ", colors.bold, colors.accent) : "   ";
    const dot = `${agent.color}●${colors.reset}`;
    const nameStr = `${agent.color}${agent.name.padEnd(22)}${colors.reset}`;

    const maxDesc = Math.max(10, width - 36);
    const descStr = style(
      truncate(agent.description, maxDesc),
      isSelected ? colors.text : colors.muted
    );

    const rowContent = `${pointer}${dot} ${nameStr} ${descStr}`;
    return this.formatBoxLine(rowContent, width);
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
