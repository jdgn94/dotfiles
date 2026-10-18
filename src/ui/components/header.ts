import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { type GitWatcher } from "../../state/git-watcher.js";
import { colors, pad, style, truncate } from "../theme.js";

export class Header implements Component {
  private agent: AgentManager;
  private git: GitWatcher;

  constructor(agent: AgentManager, git: GitWatcher) {
    this.agent = agent;
    this.git = git;
  }

  public invalidate(): void {}

  public render(width: number): string[] {
    const gitStatus = this.git.getStatus();
    const model = this.agent.getModelName();
    const thinking = this.agent.getThinkingLevel();
    const branch = gitStatus.isGitRepo ? ` ${gitStatus.branch}` : "no-git";

    const left = ` ${style("π+", colors.bold, colors.accent)} ${style("Pi-TUI-Plus", colors.bold, colors.primary)}  ${style(`[${model}]`, colors.secondary)} ${style(`(think: ${thinking})`, colors.muted)}`;
    const right = `${style(branch, colors.peach)}  ${style(process.cwd().replace(process.env.HOME || "", "~"), colors.muted)} `;

    const leftStripped = left.replace(/\x1b\[[0-9;]*m/g, "");
    const rightStripped = right.replace(/\x1b\[[0-9;]*m/g, "");

    const space = Math.max(1, width - leftStripped.length - rightStripped.length);
    const line1 = `${left}${" ".repeat(space)}${right}`;
    const line2 = style("─".repeat(width), colors.border);

    return [line1, line2];
  }
}
