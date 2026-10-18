import { colors, style } from "../theme.js";
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
        const m = this.metrics.getMetrics();
        const indicator = isWorking
            ? `${style("⟳", colors.bold, colors.warning)} ${style(statusText, colors.warning)}`
            : `${style("●", colors.bold, colors.success)} ${style("Listo", colors.success)}`;
        const metricsSummary = `${style("Tokens:", colors.muted)} ${style(m.total.toLocaleString(), colors.bold)} ${style(`(${m.contextPercent}%)`, colors.accent)}  ${style("Vel:", colors.muted)} ${style(m.speedTokensPerSec + " tok/s", colors.subtext)}`;
        const hints = `${style("[Tab]", colors.bold, colors.primary)} ${style("Panel", colors.muted)}  ${style("[Ctrl+C]", colors.bold, colors.primary)} ${style("Salir", colors.muted)}`;
        const left = ` ${indicator}  │  ${metricsSummary}`;
        const right = `${hints} `;
        const leftStripped = left.replace(/\x1b\[[0-9;]*m/g, "");
        const rightStripped = right.replace(/\x1b\[[0-9;]*m/g, "");
        const space = Math.max(1, width - leftStripped.length - rightStripped.length);
        const line = `${left}${" ".repeat(space)}${right}`;
        return [line];
    }
}
//# sourceMappingURL=status-bar.js.map