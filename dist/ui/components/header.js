import { colors, style } from "../theme.js";
export class Header {
    agent;
    git;
    constructor(agent, git) {
        this.agent = agent;
        this.git = git;
    }
    invalidate() { }
    render(width) {
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
//# sourceMappingURL=header.js.map