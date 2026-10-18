import type { Component } from "@earendil-works/pi-tui";
import { type AgentManager } from "../../state/agent-manager.js";
import { type MetricsTracker } from "../../state/metrics-tracker.js";
import { colors, renderWavePulse, style } from "../theme.js";

export class StatusBar implements Component {
  private agent: AgentManager;
  private metrics: MetricsTracker;

  constructor(agent: AgentManager, metrics: MetricsTracker) {
    this.agent = agent;
    this.metrics = metrics;
  }

  public invalidate(): void {}

  public render(width: number): string[] {
    const isWorking = this.agent.getIsWorking();
    const statusText = this.agent.getStatusText();
    const activeAgent = this.agent.getActiveAgentName();
    const m = this.metrics.getMetrics();

    let indicator = "";
    if (isWorking) {
      const elapsedSec = this.agent.getElapsedSec();
      const wave = renderWavePulse(12, elapsedSec);
      const elapsed = this.agent.getTurnElapsedSec();
      indicator = `${wave}  ${style(statusText, colors.bold, colors.warning)} ${style(
        `(${elapsed})`,
        colors.muted
      )}`;
    } else {
      indicator = `${style("●", colors.bold, colors.success)} ${style("Ready", colors.success)}`;
    }

    const agentTag = `${style("Agent:", colors.muted)} ${style(
      activeAgent,
      colors.bold,
      colors.secondary
    )}`;
    const metricsSummary = `${style("Tokens:", colors.muted)} ${style(
      m.total.toLocaleString(),
      colors.bold
    )} ${style(`(${m.contextPercent}%)`, colors.accent)}  ${style("Speed:", colors.muted)} ${style(
      m.speedTokensPerSec + " tok/s",
      colors.subtext
    )}`;

    const hints = `${style("[Tab]", colors.bold, colors.primary)} ${style(
      "Agent",
      colors.muted
    )}  ${style("[Ctrl+T]", colors.bold, colors.primary)} ${style(
      "Tasks",
      colors.muted
    )}  ${style("[Alt+M]", colors.bold, colors.primary)} ${style(
      "MCPs",
      colors.muted
    )}  ${style("[Alt+S]", colors.bold, colors.primary)} ${style(
      "Skills",
      colors.muted
    )}  ${style("[Ctrl+C]", colors.bold, colors.primary)} ${style("Exit", colors.muted)}`;

    const left = ` ${indicator}  │  ${agentTag}  │  ${metricsSummary}`;
    const right = `${hints} `;

    const leftStripped = left.replace(/\x1b\[[0-9;]*m/g, "");
    const rightStripped = right.replace(/\x1b\[[0-9;]*m/g, "");

    const space = Math.max(1, width - leftStripped.length - rightStripped.length);
    const line = `${left}${" ".repeat(space)}${right}`;

    return [line];
  }
}
