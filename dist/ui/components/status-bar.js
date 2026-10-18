import { colors, style } from "../theme.js";
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export class StatusBar {
    agent;
    metrics;
    constructor(agent, metrics) {
        this.agent = agent;
        this.metrics = metrics;
    }
    invalidate() { }
    render(width) {
        const isWorking = this.agent.getIsWorking();
        const statusText = this.agent.getStatusText();
        const activeAgent = this.agent.getActiveAgentName();
        const m = this.metrics.getMetrics();
        let indicator = "";
        if (isWorking) {
            const frame = SPINNER_FRAMES[Math.floor(Date.now() / 80) % SPINNER_FRAMES.length];
            const elapsed = this.agent.getTurnElapsedSec();
            indicator = `${style(frame, colors.bold, colors.warning)} ${style(statusText, colors.warning)} ${style(`(${elapsed})`, colors.muted)}`;
        }
        else {
            indicator = `${style("●", colors.bold, colors.success)} ${style("Ready", colors.success)}`;
        }
        const agentTag = `${style("Agent:", colors.muted)} ${style(activeAgent, colors.bold, colors.secondary)}`;
        const metricsSummary = `${style("Tokens:", colors.muted)} ${style(m.total.toLocaleString(), colors.bold)} ${style(`(${m.contextPercent}%)`, colors.accent)}  ${style("Speed:", colors.muted)} ${style(m.speedTokensPerSec + " tok/s", colors.subtext)}`;
        const hints = `${style("[Tab]", colors.bold, colors.primary)} ${style("Agent", colors.muted)}  ${style("[Ctrl+T]", colors.bold, colors.primary)} ${style("Tasks", colors.muted)}  ${style("[Alt+M]", colors.bold, colors.primary)} ${style("MCPs", colors.muted)}  ${style("[Alt+S]", colors.bold, colors.primary)} ${style("Skills", colors.muted)}  ${style("[Ctrl+C]", colors.bold, colors.primary)} ${style("Exit", colors.muted)}`;
        const left = ` ${indicator}  │  ${agentTag}  │  ${metricsSummary}`;
        const right = `${hints} `;
        const leftStripped = left.replace(/\x1b\[[0-9;]*m/g, "");
        const rightStripped = right.replace(/\x1b\[[0-9;]*m/g, "");
        const space = Math.max(1, width - leftStripped.length - rightStripped.length);
        const line = `${left}${" ".repeat(space)}${right}`;
        return [line];
    }
}
//# sourceMappingURL=status-bar.js.map