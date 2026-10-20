import * as path from "node:path";
import { colors, style, truncate } from "../theme.js";
import { ImagePreview } from "./image-preview.js";
function formatTokens(count) {
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
export class Sidebar {
    agent;
    metrics;
    git;
    toolLogger;
    todoTracker;
    specGraph;
    inputBox;
    // Collapsible sections state
    mcpExpanded = false;
    skillsExpanded = false;
    planExpanded = true;
    clickMap = new Map();
    constructor(agent, metrics, git, toolLogger, todoTracker, specGraph, inputBox) {
        this.agent = agent;
        this.metrics = metrics;
        this.git = git;
        this.toolLogger = toolLogger;
        this.todoTracker = todoTracker;
        this.specGraph = specGraph;
        this.inputBox = inputBox;
    }
    invalidate() { }
    toggleMcp() {
        this.mcpExpanded = !this.mcpExpanded;
    }
    toggleSkills() {
        this.skillsExpanded = !this.skillsExpanded;
    }
    togglePlan() {
        this.planExpanded = !this.planExpanded;
    }
    isMcpExpanded() {
        return this.mcpExpanded;
    }
    isSkillsExpanded() {
        return this.skillsExpanded;
    }
    isPlanExpanded() {
        return this.planExpanded;
    }
    handleClick(sidebarRowIndex) {
        return this.clickMap.get(sidebarRowIndex) ?? null;
    }
    render(width) {
        const safeWidth = Math.max(26, width);
        const lines = [];
        this.clickMap.clear();
        // --- 1. SESSION SECTION (matches image-1) ---
        lines.push(style(" SESSION", colors.muted));
        const sessionName = this.agent.getSessionName();
        lines.push(style(` ${sessionName}`, colors.bold, colors.peach));
        const sessionId = this.agent.getSessionId();
        const pid = this.agent.getPid();
        lines.push(style(` ${sessionId} · pid ${pid}`, colors.muted));
        lines.push("");
        // --- 2. MODEL & THINKING EFFORT + AGENT PERMISSION BADGES (Option 5) ---
        const modelId = this.agent.getModelId();
        const effort = this.agent.getThinkingEffort();
        const modelLeft = ` ${style(modelId, colors.bold, colors.text)}`;
        const effortRight = `${style(effort, colors.muted)} `;
        lines.push(this.spaceBetween(modelLeft, effortRight, safeWidth));
        const activeAgent = this.agent.getActiveAgent();
        const hasWrite = activeAgent.tools?.some((t) => t === "write" || t === "edit" || t === "bash") ?? true;
        const modeBadge = hasWrite
            ? style("[FULL-WRITE]", colors.bold, colors.success)
            : style("[READ-ONLY]", colors.bold, colors.warning);
        const thinkBadge = style(`[THINK: ${this.agent.getThinkingEffort().toUpperCase()}]`, colors.secondary);
        const toolCount = activeAgent.tools
            ? activeAgent.tools.length
            : this.agent.getActiveTools().length;
        const toolsBadge = style(`[Tools: ${toolCount}]`, colors.muted);
        lines.push(` Mode: ${modeBadge}  ${thinkBadge}  ${toolsBadge}`);
        lines.push("");
        // --- 3. CONTEXT & PROMPT CACHE EFFICIENCY SECTION (Option 2) ---
        const m = this.metrics.getMetrics();
        const contextLine = this.renderBar(" Context  ", m.contextPercent, safeWidth, "\x1b[38;2;180;160;235m");
        lines.push(contextLine);
        // Below context bar: e.g. "192k / 1M · $0.48 · ~150/s"
        const totalStr = formatTokens(m.total);
        const maxStr = formatTokens(m.contextWindow);
        const costStr = `$${m.estimatedCostUsd >= 0.01 ? m.estimatedCostUsd.toFixed(2) : m.estimatedCostUsd.toFixed(4)}`;
        const speedStr = `~${m.speedTokensPerSec}/s`;
        const subStats = ` ${style(`${totalStr} / ${maxStr} · ${costStr} · ${speedStr}`, colors.muted)}`;
        lines.push(subStats);
        // Cache hit ratio gauge: identical width and alignment without "· 0 cached"
        const totalInputTokens = m.input + m.cacheRead;
        const cacheHitPct = totalInputTokens > 0
            ? Math.round((m.cacheRead / totalInputTokens) * 100)
            : 0;
        const cacheLine = this.renderBar(" Cache    ", cacheHitPct, safeWidth, "\x1b[38;2;116;199;236m");
        lines.push(cacheLine);
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
        // --- 5. SUBAGENTS IN BACKGROUND SECTION (Option 3) ---
        if (this.toolLogger) {
            const subagents = this.toolLogger.getActiveSubagents();
            if (subagents.length > 0) {
                lines.push(style("─".repeat(safeWidth), colors.border));
                lines.push(` ${style("🤖 SUBAGENTS IN BACKGROUND", colors.bold, colors.accent)} ${style(`(${subagents.length})`, colors.muted)}`);
                for (const sub of subagents) {
                    const subDur = `${sub.durationSec}s`;
                    const subTitle = truncate(sub.task || "working", safeWidth - 22);
                    lines.push(`  ${style("⟳", colors.warning)} ${style(sub.agent, colors.bold)} ${style(`(${subDur})`, colors.muted)} · ${style(subTitle, colors.subtext)}`);
                }
            }
        }
        // --- 6. LIVE RECENT TOOL CALLS (Option 1) ---
        if (this.toolLogger) {
            const recentTools = this.toolLogger.getRecentLogs(3);
            if (recentTools.length > 0) {
                lines.push(style("─".repeat(safeWidth), colors.border));
                const runningCount = this.toolLogger.getRunningCount();
                const runningTag = runningCount > 0
                    ? ` ${style(`(${runningCount} active)`, colors.warning)}`
                    : "";
                lines.push(` ${style("⚡ RECENT TOOL CALLS", colors.bold, colors.accent)}${runningTag}`);
                for (const log of recentTools.reverse()) {
                    const icon = log.status === "running"
                        ? style("⟳", colors.warning)
                        : log.status === "success"
                            ? style("✓", colors.success)
                            : style("✗", colors.error);
                    const dur = log.durationMs !== undefined ? `${log.durationMs}ms` : "in prog";
                    let target = "";
                    if (typeof log.args === "object" && log.args !== null) {
                        const argsObj = log.args;
                        target = String(argsObj.path ||
                            argsObj.file ||
                            argsObj.command ||
                            argsObj.query ||
                            "");
                    }
                    else if (log.args) {
                        target = String(log.args);
                    }
                    const targetShort = target
                        ? ` · ${truncate(target, safeWidth - 22)}`
                        : "";
                    lines.push(`  ${icon} ${style(log.toolName, colors.bold)} ${style(`(${dur})`, colors.muted)}${style(targetShort, colors.subtext)}`);
                }
            }
        }
        // --- 7. COLLAPSIBLE PLAN & TASKS SECTION ---
        if (this.todoTracker && this.todoTracker.hasTasks()) {
            const summary = this.todoTracker.getSummary();
            const tasks = this.todoTracker.getTasks();
            const planArrow = this.planExpanded ? "▼" : "▶";
            lines.push(style("─".repeat(safeWidth), colors.border));
            const planHeader = ` ${style(planArrow, colors.warning)} ${style("Plan & Tasks", colors.bold, colors.warning)} ${style(`(${summary.completed}/${summary.total})`, colors.bold, colors.text)}`;
            const planHint = style("[Ctrl+Y]", colors.muted);
            lines.push(this.spaceBetween(planHeader, planHint + " ", safeWidth));
            this.clickMap.set(lines.length - 1, { type: "toggle_plan" });
            // 1. Current active task ("por cual tarea va")
            const activeTask = tasks.find((t) => t.status === "in_progress") ||
                tasks.find((t) => t.status === "pending") ||
                tasks[0];
            if (activeTask) {
                lines.push(`  ${style("Current:", colors.muted)} ${style(`⟳ #${activeTask.id}`, colors.bold, colors.warning)} ${style(truncate(activeTask.text, safeWidth - 20), colors.bold, colors.text)}`);
            }
            // 2. Progress summary ("cuantas son y cuales ha terminado")
            const pct = Math.round((summary.completed / Math.max(1, summary.total)) * 100);
            lines.push(`  ${style("Progress:", colors.muted)} ${style(`${summary.completed} done`, colors.success)} · ${style(`${summary.total} total`, colors.text)} ${style(`(${pct}%)`, colors.accent)}`);
            // 3. Full list when expanded
            if (this.planExpanded) {
                for (const t of tasks.slice(0, 8)) {
                    let icon = style("[ ]", colors.muted);
                    let textColor = colors.muted;
                    if (t.status === "completed") {
                        icon = style("[✓]", colors.success);
                        textColor = colors.subtext;
                    }
                    else if (t.status === "in_progress") {
                        icon = style("[⟳]", colors.warning);
                        textColor = colors.bold;
                    }
                    else if (t.status === "failed") {
                        icon = style("[✗]", colors.error);
                        textColor = colors.error;
                    }
                    lines.push(`   ${icon} #${t.id} ${style(truncate(t.text, safeWidth - 14), textColor)}`);
                }
                if (tasks.length > 8) {
                    lines.push(style(`   ... and ${tasks.length - 8} more tasks`, colors.muted));
                }
            }
        }
        else {
            lines.push(style("─".repeat(safeWidth), colors.border));
            lines.push(` ${style("▶", colors.muted)} ${style("Plan & Tasks", colors.bold, colors.muted)} ${style("(no active plan)", colors.muted)}`);
            this.clickMap.set(lines.length - 1, { type: "toggle_plan" });
        }
        // --- 8. COLLAPSIBLE MCP SERVERS SECTION ---
        lines.push(style("─".repeat(safeWidth), colors.border));
        const mcpServers = this.agent.getMcpServers();
        const mcpCount = mcpServers.length;
        const mcpArrow = this.mcpExpanded ? "▼" : "▶";
        const mcpHeader = ` ${style(mcpArrow, colors.accent)} ${style("MCP Servers", colors.bold, colors.primary)} ${style(`(${mcpCount})`, colors.muted)}`;
        const mcpHint = style("[F3 / Alt+M]", colors.muted);
        lines.push(this.spaceBetween(mcpHeader, mcpHint + " ", safeWidth));
        this.clickMap.set(lines.length - 1, { type: "toggle_mcp" });
        if (this.mcpExpanded) {
            if (mcpServers.length === 0) {
                lines.push(style("   (no active MCP servers)", colors.muted));
            }
            else {
                for (const server of mcpServers) {
                    lines.push(`   ${style("•", colors.accent)} ${style(server, colors.text)}`);
                }
            }
        }
        lines.push(style("─".repeat(safeWidth), colors.border));
        // --- 8. COLLAPSIBLE SKILLS SECTION ---
        const skills = this.agent.getSkills();
        const skillsCount = skills.length;
        const skillsArrow = this.skillsExpanded ? "▼" : "▶";
        const skillsHeader = ` ${style(skillsArrow, colors.secondary)} ${style("Skills", colors.bold, colors.secondary)} ${style(`(${skillsCount})`, colors.muted)}`;
        const skillsHint = style("[F4 / Alt+S]", colors.muted);
        lines.push(this.spaceBetween(skillsHeader, skillsHint + " ", safeWidth));
        this.clickMap.set(lines.length - 1, { type: "toggle_skills" });
        if (this.skillsExpanded) {
            if (skills.length === 0) {
                lines.push(style("   (no skills installed)", colors.muted));
            }
            else {
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
        // --- 9. GIT REPOSITORY & UNCOMMITTED CHANGES SECTION ---
        const g = this.git.getStatus();
        lines.push(` ${style("GIT REPOSITORY", colors.bold, colors.peach)}`);
        lines.push(` ${style("Directory:", colors.muted)} ${style(g.projectDir, colors.text)}`);
        const branchLabel = g.isGitRepo ? ` ${g.branch}` : "Not a git repo";
        lines.push(` ${style("Branch:   ", colors.muted)} ${style(branchLabel, colors.bold, colors.peach)}`);
        if (g.isGitRepo) {
            const changes = g.changedFiles;
            lines.push(` ${style("Uncommitted / Unpushed", colors.bold, colors.warning)} ${style(`(${changes.length})`, colors.muted)}:`);
            if (changes.length === 0) {
                lines.push(`  ${style("✓ Working tree clean", colors.success)}`);
            }
            else {
                // Display up to 5 changed files with additions/deletions diff stat
                for (const ch of changes.slice(0, 5)) {
                    let diffBadge = "";
                    if (ch.additions > 0 || ch.deletions > 0) {
                        diffBadge = ` ${style(`+${ch.additions}`, colors.success)}${style(` -${ch.deletions}`, colors.error)}`;
                    }
                    else if (ch.status === "untracked") {
                        diffBadge = ` ${style("(new)", colors.accent)}`;
                    }
                    const statusColor = ch.status === "untracked"
                        ? colors.accent
                        : ch.status === "deleted"
                            ? colors.error
                            : colors.warning;
                    const fileText = `  ${style(ch.statusCode || "M", statusColor)} ${truncate(ch.file, safeWidth - 18)}${diffBadge}`;
                    lines.push(fileText);
                    this.clickMap.set(lines.length - 1, { type: "open_diff", file: ch.file });
                }
                if (changes.length > 5) {
                    lines.push(`   ${style(`... and ${changes.length - 5} more files`, colors.muted)}`);
                }
            }
        }
        lines.push(style("─".repeat(safeWidth), colors.border));
        // --- 10. OPENSPEC & GRAPHIFY OVERVIEW ---
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
        // --- 11. PROCESS RESOURCES / MEMORY (Option 6) ---
        lines.push(style("─".repeat(safeWidth), colors.border));
        const mem = process.memoryUsage();
        const rssMb = (mem.rss / (1024 * 1024)).toFixed(0);
        const heapUsedMb = (mem.heapUsed / (1024 * 1024)).toFixed(0);
        const heapTotalMb = (mem.heapTotal / (1024 * 1024)).toFixed(0);
        lines.push(` ${style("⚙ Process:", colors.muted)} ${style(`RSS ${rssMb} MB`, colors.text)} · ${style(`Heap ${heapUsedMb}/${heapTotalMb} MB`, colors.subtext)}`);
        // --- 12. IMAGE PREVIEW (when cursor is over an attached image file) ---
        const attachedImage = this.inputBox?.getAttachedImageAtCursor();
        if (attachedImage) {
            lines.push(style("─".repeat(safeWidth), colors.border));
            const filename = path.basename(attachedImage);
            lines.push(` ${style("󰋩 Image Preview:", colors.bold, colors.accent)} ${style(truncate(filename, safeWidth - 18), colors.secondary)}`);
            const previewLines = ImagePreview.render(attachedImage, safeWidth - 4, 8);
            for (const pLine of previewLines) {
                lines.push(`  ${pLine}`);
            }
        }
        return lines;
    }
    renderBar(label, percent, width, fillColor = "\x1b[38;2;180;160;235m") {
        const clamped = Math.max(0, Math.min(100, percent));
        const percentStr = ` | ${clamped}% `;
        const barWidth = Math.max(6, width - label.length - percentStr.length);
        const fillWidth = Math.round((clamped / 100) * barWidth);
        const emptyWidth = Math.max(0, barWidth - fillWidth);
        const filled = `${fillColor}${"█".repeat(fillWidth)}${colors.reset}`;
        const empty = `${colors.muted}${"░".repeat(emptyWidth)}${colors.reset}`;
        return `${style(label, colors.muted)}${filled}${empty}${style(percentStr, colors.muted)}`;
    }
    spaceBetween(left, right, targetWidth) {
        const strippedLeft = left.replace(/\x1b\[[0-9;]*m/g, "");
        const strippedRight = right.replace(/\x1b\[[0-9;]*m/g, "");
        const space = Math.max(1, targetWidth - strippedLeft.length - strippedRight.length);
        return `${left}${" ".repeat(space)}${right}`;
    }
}
//# sourceMappingURL=sidebar.js.map