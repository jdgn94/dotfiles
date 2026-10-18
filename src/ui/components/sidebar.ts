import * as path from "node:path";
import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { type GitWatcher } from "../../state/git-watcher.js";
import { type MetricsTracker } from "../../state/metrics-tracker.js";
import { type SpecGraphWatcher } from "../../state/spec-graph-watcher.js";
import { colors, style, truncate } from "../theme.js";
import { ImagePreview } from "./image-preview.js";
import { type InputBox } from "./input-box.js";

function formatTokens(count: number): string {
  if (count >= 1000000) {
    const val = count / 1000000;
    return val >= 10 ? `${Math.round(val)}M` : `${val.toFixed(1)}M`;
  }
  if (count >= 1000) {
    const val = count / 1000;
    return val >= 10 ? `${Math.round(val)}k` : `${val.toFixed(1)}k`;
  }
  return String(count);
}

export class Sidebar implements Component {
  private agent: AgentManager;
  private metrics: MetricsTracker;
  private git: GitWatcher;
  private specGraph?: SpecGraphWatcher;
  private inputBox?: InputBox;

  // Collapsible sections state
  private mcpExpanded = false;
  private skillsExpanded = false;

  constructor(
    agent: AgentManager,
    metrics: MetricsTracker,
    git: GitWatcher,
    specGraph?: SpecGraphWatcher,
    inputBox?: InputBox
  ) {
    this.agent = agent;
    this.metrics = metrics;
    this.git = git;
    this.specGraph = specGraph;
    this.inputBox = inputBox;
  }

  public invalidate(): void {}

  public toggleMcp(): void {
    this.mcpExpanded = !this.mcpExpanded;
  }

  public toggleSkills(): void {
    this.skillsExpanded = !this.skillsExpanded;
  }

  public isMcpExpanded(): boolean {
    return this.mcpExpanded;
  }

  public isSkillsExpanded(): boolean {
    return this.skillsExpanded;
  }

  public render(width: number): string[] {
    const safeWidth = Math.max(26, width);
    const lines: string[] = [];

    // --- 1. SESSION SECTION (matches image-1) ---
    lines.push(style(" SESSION", colors.muted));
    const sessionName = this.agent.getSessionName();
    lines.push(style(` ${sessionName}`, colors.bold, colors.peach));

    const sessionId = this.agent.getSessionId();
    const pid = this.agent.getPid();
    lines.push(style(` ${sessionId} · pid ${pid}`, colors.muted));
    lines.push("");

    // --- 2. MODEL & THINKING EFFORT (matches image-1) ---
    const modelId = this.agent.getModelId();
    const effort = this.agent.getThinkingEffort();
    const modelLeft = ` ${style(modelId, colors.bold, colors.text)}`;
    const effortRight = `${style(effort, colors.muted)} `;
    lines.push(this.spaceBetween(modelLeft, effortRight, safeWidth));
    lines.push("");

    // --- 3. CONTEXT PROGRESS BAR (matches image-1) ---
    const m = this.metrics.getMetrics();
    const contextLine = this.renderContextBar(m.contextPercent, safeWidth);
    lines.push(contextLine);

    // Below context bar: e.g. "192k / 1M · $0.48 · ~150/s"
    const totalStr = formatTokens(m.total);
    const maxStr = formatTokens(m.contextWindow);
    const costStr = `$${m.estimatedCostUsd >= 0.01 ? m.estimatedCostUsd.toFixed(2) : m.estimatedCostUsd.toFixed(4)}`;
    const speedStr = `~${m.speedTokensPerSec}/s`;
    const subStats = ` ${style(`${totalStr} / ${maxStr} · ${costStr} · ${speedStr}`, colors.muted)}`;
    lines.push(subStats);
    lines.push("");

    // --- 4. TOKEN IN/OUT/CACHE TABLE (matches image-1) ---
    const inTokens = formatTokens(m.input);
    const outTokens = formatTokens(m.output);
    const cacheTokens = formatTokens(m.cacheRead);
    const uncachedTokens = formatTokens(Math.max(0, m.input - m.cacheRead));

    const row1Left = ` ${style("in", colors.muted)}  ${style(inTokens, colors.bold, colors.text)}`;
    const row1Right = `${style("cache", colors.muted)} ${style(cacheTokens, colors.bold, colors.text)} `;
    lines.push(this.spaceBetween(row1Left, row1Right, safeWidth));

    const row2Left = ` ${style("out", colors.muted)} ${style(outTokens, colors.bold, colors.text)}`;
    const row2Right = `${style("uncached", colors.muted)} ${style(uncachedTokens, colors.bold, colors.text)} `;
    lines.push(this.spaceBetween(row2Left, row2Right, safeWidth));
    lines.push(style("─".repeat(safeWidth), colors.border));

    // --- 5. COLLAPSIBLE MCP SERVERS SECTION ---
    const mcpServers = this.agent.getMcpServers();
    const mcpCount = mcpServers.length;
    const mcpArrow = this.mcpExpanded ? "▼" : "▶";
    const mcpHeader = ` ${style(mcpArrow, colors.accent)} ${style("MCP Servers", colors.bold, colors.primary)} ${style(`(${mcpCount})`, colors.muted)}`;
    const mcpHint = style("[Alt+M]", colors.muted);
    lines.push(this.spaceBetween(mcpHeader, mcpHint + " ", safeWidth));

    if (this.mcpExpanded) {
      if (mcpServers.length === 0) {
        lines.push(style("   (no active MCP servers)", colors.muted));
      } else {
        for (const server of mcpServers) {
          lines.push(`   ${style("•", colors.accent)} ${style(server, colors.text)}`);
        }
      }
    }
    lines.push(style("─".repeat(safeWidth), colors.border));

    // --- 6. COLLAPSIBLE SKILLS SECTION ---
    const skills = this.agent.getSkills();
    const skillsCount = skills.length;
    const skillsArrow = this.skillsExpanded ? "▼" : "▶";
    const skillsHeader = ` ${style(skillsArrow, colors.secondary)} ${style("Skills", colors.bold, colors.secondary)} ${style(`(${skillsCount})`, colors.muted)}`;
    const skillsHint = style("[Alt+S]", colors.muted);
    lines.push(this.spaceBetween(skillsHeader, skillsHint + " ", safeWidth));

    if (this.skillsExpanded) {
      if (skills.length === 0) {
        lines.push(style("   (no skills installed)", colors.muted));
      } else {
        const displaySkills = skills.slice(0, 10);
        for (const s of displaySkills) {
          lines.push(`   ${style("•", colors.secondary)} ${style(s.name, colors.text)}`);
        }
        if (skills.length > 10) {
          lines.push(style(`   ... and ${skills.length - 10} more skills`, colors.muted));
        }
      }
    }
    lines.push(style("─".repeat(safeWidth), colors.border));

    // --- 7. GIT REPOSITORY & UNCOMMITTED CHANGES SECTION ---
    const g = this.git.getStatus();
    lines.push(` ${style("GIT REPOSITORY", colors.bold, colors.peach)}`);
    lines.push(` ${style("Directory:", colors.muted)} ${style(g.projectDir, colors.text)}`);
    const branchLabel = g.isGitRepo ? ` ${g.branch}` : "Not a git repo";
    lines.push(` ${style("Branch:   ", colors.muted)} ${style(branchLabel, colors.bold, colors.peach)}`);

    if (g.isGitRepo) {
      const changes = g.changedFiles;
      lines.push(
        ` ${style("Uncommitted / Unpushed", colors.bold, colors.warning)} ${style(`(${changes.length})`, colors.muted)}:`
      );

      if (changes.length === 0) {
        lines.push(`  ${style("✓ Working tree clean", colors.success)}`);
      } else {
        // Display up to 5 changed files with additions/deletions diff stat
        for (const ch of changes.slice(0, 5)) {
          let diffBadge = "";
          if (ch.additions > 0 || ch.deletions > 0) {
            diffBadge = ` ${style(`+${ch.additions}`, colors.success)}${style(` -${ch.deletions}`, colors.error)}`;
          } else if (ch.status === "untracked") {
            diffBadge = ` ${style("(new)", colors.accent)}`;
          }

          const statusColor =
            ch.status === "untracked"
              ? colors.accent
              : ch.status === "deleted"
              ? colors.error
              : colors.warning;

          const fileText = `  ${style(ch.statusCode || "M", statusColor)} ${truncate(
            ch.file,
            safeWidth - 18
          )}${diffBadge}`;
          lines.push(fileText);
        }
        if (changes.length > 5) {
          lines.push(`   ${style(`... and ${changes.length - 5} more files`, colors.muted)}`);
        }
      }
    }
    lines.push(style("─".repeat(safeWidth), colors.border));

    // --- 8. OPENSPEC & GRAPHIFY OVERVIEW ---
    if (this.specGraph) {
      const data = this.specGraph.getData();
      if (data.openSpec.hasOpenSpec || data.graphify.hasGraphify) {
        const specSummary = data.openSpec.hasOpenSpec
          ? `${style("OpenSpec:", colors.muted)} ${style(String(data.openSpec.specsCount) + " specs", colors.bold, colors.accent)}`
          : "";
        const graphSummary = data.graphify.hasGraphify
          ? `${style("Graph:", colors.muted)} ${style(String(data.graphify.nodeCount) + " nodes", colors.bold, colors.secondary)}`
          : "";
        lines.push(` ${specSummary}  ${graphSummary}`);
      }
    }

    // --- 9. IMAGE PREVIEW (when cursor is over an attached image file) ---
    const attachedImage = this.inputBox?.getAttachedImageAtCursor();
    if (attachedImage) {
      lines.push(style("─".repeat(safeWidth), colors.border));
      const filename = path.basename(attachedImage);
      lines.push(
        ` ${style("󰋩 Image Preview:", colors.bold, colors.accent)} ${style(
          truncate(filename, safeWidth - 18),
          colors.secondary
        )}`
      );

      const previewLines = ImagePreview.render(attachedImage, safeWidth - 4, 8);
      for (const pLine of previewLines) {
        lines.push(`  ${pLine}`);
      }
    }

    return lines;
  }

  private renderContextBar(percent: number, width: number): string {
    const clamped = Math.max(0, Math.min(100, percent));
    const label = " Context  ";
    const percentStr = ` | ${clamped}% `;

    const barWidth = Math.max(6, width - label.length - percentStr.length);
    const fillWidth = Math.round((clamped / 100) * barWidth);
    const emptyWidth = Math.max(0, barWidth - fillWidth);

    // Pastel lavender filled bar like image-1
    const lavenderColor = "\x1b[38;2;180;160;235m";
    const filled = `${lavenderColor}${"█".repeat(fillWidth)}${colors.reset}`;
    const empty = `${colors.muted}${"░".repeat(emptyWidth)}${colors.reset}`;

    return `${style(label, colors.muted)}${filled}${empty}${style(percentStr, colors.muted)}`;
  }

  private spaceBetween(left: string, right: string, targetWidth: number): string {
    const strippedLeft = left.replace(/\x1b\[[0-9;]*m/g, "");
    const strippedRight = right.replace(/\x1b\[[0-9;]*m/g, "");
    const space = Math.max(1, targetWidth - strippedLeft.length - strippedRight.length);
    return `${left}${" ".repeat(space)}${right}`;
  }
}
