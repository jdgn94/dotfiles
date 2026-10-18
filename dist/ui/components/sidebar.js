import { colors, pad, progressBar, style, truncate } from "../theme.js";
export class Sidebar {
    agent;
    metrics;
    git;
    toolLogger;
    activeTab = 0; // 0 = Metricas, 1 = Git & Env, 2 = Tool Logs
    tabs = ["Métricas", "Git & Env", "Tool Logs"];
    constructor(agent, metrics, git, toolLogger) {
        this.agent = agent;
        this.metrics = metrics;
        this.git = git;
        this.toolLogger = toolLogger;
    }
    invalidate() { }
    nextTab() {
        this.activeTab = (this.activeTab + 1) % this.tabs.length;
    }
    prevTab() {
        this.activeTab = (this.activeTab - 1 + this.tabs.length) % this.tabs.length;
    }
    setTab(index) {
        if (index >= 0 && index < this.tabs.length) {
            this.activeTab = index;
        }
    }
    getActiveTab() {
        return this.activeTab;
    }
    render(width) {
        const safeWidth = Math.max(24, width);
        const lines = [];
        // Render Tab Header
        lines.push(this.renderTabBar(safeWidth));
        lines.push(style("─".repeat(safeWidth), colors.border));
        switch (this.activeTab) {
            case 0:
                this.renderMetricsTab(lines, safeWidth);
                break;
            case 1:
                this.renderGitTab(lines, safeWidth);
                break;
            case 2:
                this.renderToolLogsTab(lines, safeWidth);
                break;
        }
        return lines;
    }
    renderTabBar(width) {
        const renderedTabs = this.tabs.map((name, i) => {
            const isSelected = i === this.activeTab;
            const num = i + 1;
            if (isSelected) {
                return style(` [${num}:${name}] `, colors.bold, colors.accent);
            }
            else {
                return style(`  ${num}:${name}  `, colors.muted);
            }
        });
        const combined = renderedTabs.join(style("│", colors.border));
        return pad(combined, width);
    }
    renderMetricsTab(lines, width) {
        const m = this.metrics.getMetrics();
        const innerW = width - 2;
        // Context Window Box
        this.boxHeader(lines, "Ventana de Contexto", colors.accent, width);
        const barW = Math.max(10, width - 14);
        const bar = progressBar(m.contextPercent, barW);
        lines.push(this.boxLine(` Uso: ${bar} ${style(m.contextPercent + "%", colors.bold, colors.accent)}`, width));
        lines.push(this.boxLine(` Tokens: ${style(m.total.toLocaleString(), colors.bold)} / ${style(m.contextWindow.toLocaleString(), colors.muted)}`, width));
        this.boxBottom(lines, colors.accent, width);
        lines.push("");
        // Token Details Box
        this.boxHeader(lines, "Tokens de Sesión", colors.secondary, width);
        lines.push(this.boxRow("Entrada:", m.input.toLocaleString(), width));
        lines.push(this.boxRow("Salida:", m.output.toLocaleString(), width));
        lines.push(this.boxRow("Caché Read:", m.cacheRead.toLocaleString(), width));
        lines.push(this.boxRow("Caché Write:", m.cacheWrite.toLocaleString(), width));
        lines.push(this.boxRow("Total:", style(m.total.toLocaleString(), colors.bold, colors.secondary), width));
        this.boxBottom(lines, colors.secondary, width);
        lines.push("");
        // Performance & Cost Box
        this.boxHeader(lines, "Rendimiento y Coste", colors.peach, width);
        const speedStr = m.speedTokensPerSec > 0 ? `${m.speedTokensPerSec} tok/s` : "0 tok/s";
        const latencyStr = m.latencyMs > 0 ? `${m.latencyMs} ms` : "-";
        lines.push(this.boxRow("Velocidad:", speedStr, width));
        lines.push(this.boxRow("Latencia 1er token:", latencyStr, width));
        lines.push(this.boxRow("Turnos completados:", String(m.totalTurns), width));
        const costStr = `$${m.estimatedCostUsd.toFixed(4)} USD`;
        lines.push(this.boxRow("Coste estimado:", style(costStr, colors.bold, colors.success), width));
        this.boxBottom(lines, colors.peach, width);
    }
    renderGitTab(lines, width) {
        const g = this.git.getStatus();
        // Git Status Box
        this.boxHeader(lines, "Estado de Git", colors.peach, width);
        lines.push(this.boxRow("Rama actual:", style(g.branch, colors.bold, colors.peach), width));
        if (g.isGitRepo) {
            lines.push(this.boxRow("Archivos modificados:", style(String(g.modified), g.modified > 0 ? colors.warning : colors.muted), width));
            lines.push(this.boxRow("En stage (staged):", style(String(g.staged), g.staged > 0 ? colors.success : colors.muted), width));
            lines.push(this.boxRow("Sin seguimiento:", style(String(g.untracked), g.untracked > 0 ? colors.error : colors.muted), width));
        }
        else {
            lines.push(this.boxLine(` ${style("Directorio sin inicializar en Git", colors.muted)}`, width));
        }
        this.boxBottom(lines, colors.peach, width);
        lines.push("");
        // Last Commit Box
        if (g.isGitRepo) {
            this.boxHeader(lines, "Último Commit", colors.secondary, width);
            lines.push(this.boxLine(` ${style(g.lastCommitHash, colors.bold, colors.accent)} ${style(g.lastCommitTime, colors.muted)}`, width));
            lines.push(this.boxLine(` ${truncate(g.lastCommitMessage, width - 4)}`, width));
            this.boxBottom(lines, colors.secondary, width);
            lines.push("");
        }
        // Tools Available Box
        const activeTools = this.agent.getActiveTools();
        this.boxHeader(lines, `Tools Activas (${activeTools.length})`, colors.accent, width);
        const chunk = activeTools.slice(0, 8).join(", ") + (activeTools.length > 8 ? "..." : "");
        lines.push(this.boxLine(` ${truncate(chunk, width - 4)}`, width));
        this.boxBottom(lines, colors.accent, width);
    }
    renderToolLogsTab(lines, width) {
        const running = this.toolLogger.getRunningCount();
        const recent = this.toolLogger.getRecentLogs(7);
        this.boxHeader(lines, `Visor de Tools (Activas: ${running})`, colors.accent, width);
        if (recent.length === 0) {
            lines.push(this.boxLine(` ${style("No hay tools ejecutadas aún.", colors.muted)}`, width));
        }
        else {
            for (const log of recent.reverse()) {
                const icon = log.status === "running"
                    ? style("⟳", colors.warning)
                    : log.status === "success"
                        ? style("✓", colors.success)
                        : style("✗", colors.error);
                const dur = log.durationMs !== undefined ? `${log.durationMs}ms` : "en curso";
                const headerText = ` ${icon} ${style(log.toolName, colors.bold)} · ${style(dur, colors.muted)}`;
                lines.push(this.boxLine(headerText, width));
                let argsPreview = "";
                if (typeof log.args === "object") {
                    const keys = Object.keys(log.args);
                    if (keys.length > 0) {
                        const firstKey = keys[0];
                        const val = String(log.args[firstKey]);
                        argsPreview = `${firstKey}: ${val}`;
                    }
                }
                else {
                    argsPreview = String(log.args);
                }
                if (argsPreview) {
                    lines.push(this.boxLine(`   ${style(truncate(argsPreview, width - 8), colors.subtext)}`, width));
                }
                if (log.resultPreview) {
                    lines.push(this.boxLine(`   ${style("↳ " + truncate(log.resultPreview, width - 8), colors.muted)}`, width));
                }
            }
        }
        this.boxBottom(lines, colors.accent, width);
    }
    boxHeader(target, title, color, width) {
        const titleStr = ` ${title} `;
        const rem = Math.max(0, width - 2 - titleStr.length);
        target.push(`${style("┌─", color)}${style(titleStr, colors.bold, color)}${style("─".repeat(rem) + "┐", color)}`);
    }
    boxLine(content, width) {
        const stripped = content.replace(/\x1b\[[0-9;]*m/g, "");
        const padCount = Math.max(0, width - 2 - stripped.length);
        return `${style("│", colors.border)}${content}${" ".repeat(padCount)}${style("│", colors.border)}`;
    }
    boxRow(label, value, width) {
        const strippedLabel = label.replace(/\x1b\[[0-9;]*m/g, "");
        const strippedVal = value.replace(/\x1b\[[0-9;]*m/g, "");
        const space = Math.max(1, width - 4 - strippedLabel.length - strippedVal.length);
        const content = ` ${label}${" ".repeat(space)}${value} `;
        return `${style("│", colors.border)}${content}${style("│", colors.border)}`;
    }
    boxBottom(target, color, width) {
        target.push(`${style("└" + "─".repeat(width - 2) + "┘", color)}`);
    }
}
//# sourceMappingURL=sidebar.js.map