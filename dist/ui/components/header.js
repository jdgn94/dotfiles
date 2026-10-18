import { colors, style } from "../theme.js";
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export class Header {
    agent;
    constructor(agent) {
        this.agent = agent;
    }
    invalidate() { }
    render(width) {
        const model = this.agent.getModelName();
        const thinking = this.agent.getThinkingEffort();
        const isWorking = this.agent.getIsWorking();
        const statusText = this.agent.getStatusText();
        const activeAgent = this.agent.getActiveAgentName();
        const left = ` ${style("π+", colors.bold, colors.accent)} ${style("Pi-TUI-Plus", colors.bold, colors.primary)}  ${style(`[${model}]`, colors.secondary)} ${style(`(think: ${thinking})`, colors.muted)}`;
        let right = "";
        if (isWorking) {
            const frame = SPINNER_FRAMES[Math.floor(Date.now() / 80) % SPINNER_FRAMES.length];
            const elapsed = this.agent.getTurnElapsedSec();
            right = `${style(frame, colors.bold, colors.warning)} ${style(statusText, colors.warning)} ${style(`(${elapsed})`, colors.muted)}  ${style(`[${activeAgent}]`, colors.secondary)} `;
        }
        else {
            right = `${style("●", colors.success)} ${style("Ready", colors.muted)}  ${style(`[Agent: ${activeAgent}]`, colors.secondary)} `;
        }
        const leftStripped = left.replace(/\x1b\[[0-9;]*m/g, "");
        const rightStripped = right.replace(/\x1b\[[0-9;]*m/g, "");
        const space = Math.max(1, width - leftStripped.length - rightStripped.length);
        const line1 = `${left}${" ".repeat(space)}${right}`;
        const line2 = style("─".repeat(width), colors.border);
        return [line1, line2];
    }
}
//# sourceMappingURL=header.js.map