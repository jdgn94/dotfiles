import { exec } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createAgentSession, } from "@earendil-works/pi-coding-agent";
export const AGENT_COLORS = {
    default: "\x1b[38;2;137;180;250m", // Lavender / Soft Blue (#89b4fa)
    orchestrator: "\x1b[38;2;116;199;236m", // Sapphire / Cyan (#74c7ec)
    "security-auditor": "\x1b[38;2;243;139;168m", // Red / Coral (#f38ba8)
    "code-reviewer": "\x1b[38;2;249;226;175m", // Yellow / Gold (#f9e2af)
    "spec-planner": "\x1b[38;2;203;166;247m", // Mauve / Violet (#cba6f7)
    "test-engineer": "\x1b[38;2;250;179;135m", // Peach / Orange (#fab387)
    "build-error-resolver": "\x1b[38;2;235;160;172m", // Maroon / Red-Orange (#eba0ac)
    "code-simplifier": "\x1b[38;2;166;227;161m", // Mint / Green (#a6e3a1)
    "doc-updater": "\x1b[38;2;137;220;235m", // Sky Blue (#89dceb)
    researcher: "\x1b[38;2;148;226;213m", // Teal (#94e2d5)
    worker: "\x1b[38;2;166;227;161m", // Green (#a6e3a1)
    oracle: "\x1b[38;2;203;166;247m", // Mauve (#cba6f7)
    scout: "\x1b[38;2;250;179;135m", // Peach (#fab387)
};
export class AgentManager {
    session;
    cwd;
    metrics;
    toolLogger;
    gitWatcher;
    todoTracker;
    messages = [];
    streamingText = "";
    streamingThinking = "";
    isWorking = false;
    currentStatus = "Ready";
    turnStartTime = 0;
    hasWarned85 = false;
    isAutoCompacting = false;
    unsubscribeSession;
    listeners = [];
    // Agent hot-switching state
    availableAgents = [];
    currentAgentIndex = 0;
    defaultTools = [];
    lastAgentSwitchNotice = "";
    constructor(cwd, metrics, toolLogger, gitWatcher, todoTracker) {
        this.cwd = cwd;
        this.metrics = metrics;
        this.toolLogger = toolLogger;
        this.gitWatcher = gitWatcher;
        this.todoTracker = todoTracker;
    }
    async init() {
        const result = await createAgentSession({
            cwd: this.cwd,
        });
        this.session = result.session;
        // Record default tools
        this.defaultTools = this.session.getActiveToolNames();
        const model = this.session.model;
        if (model) {
            this.metrics.setModelInfo(model.name, model.contextWindow);
        }
        // Discover installed agents
        this.discoverAgents();
        // Load initial session history if any
        this.loadHistory();
        // Subscribe to session events
        this.unsubscribeSession = this.session.subscribe((event) => {
            this.handleSessionEvent(event);
        });
        this.updateStats();
        this.notify();
    }
    getMessages() {
        return [...this.messages];
    }
    getStreamingText() {
        return this.streamingText;
    }
    getStreamingThinking() {
        return this.streamingThinking;
    }
    getIsWorking() {
        return this.isWorking;
    }
    getStatusText() {
        return this.currentStatus;
    }
    getTurnElapsedSec() {
        if (!this.isWorking || !this.turnStartTime)
            return "0.0s";
        return `${((Date.now() - this.turnStartTime) / 1000).toFixed(1)}s`;
    }
    getElapsedSec() {
        if (!this.isWorking || !this.turnStartTime)
            return 0;
        return (Date.now() - this.turnStartTime) / 1000;
    }
    getModelName() {
        return this.session?.model?.name ?? "default";
    }
    getModelId() {
        return this.session?.model?.id ?? "gemini-3.8-flash";
    }
    getSessionId() {
        return (this.session?.sessionId || "01a14c70").slice(0, 8);
    }
    getSessionName() {
        return this.session?.sessionName || "Unnamed session";
    }
    getPid() {
        return process.pid;
    }
    getThinkingEffort() {
        return this.session?.thinkingLevel ?? "medium";
    }
    getSkills() {
        try {
            const skillsRes = this.session?.resourceLoader?.getSkills?.();
            if (skillsRes && Array.isArray(skillsRes.skills)) {
                return skillsRes.skills.map((s) => ({
                    name: s.name,
                    description: s.description || "",
                }));
            }
        }
        catch {
            // ignore
        }
        return [];
    }
    getMcpServers() {
        const servers = [];
        const allTools = this.session?.getAllTools() || [];
        for (const tool of allTools) {
            if (tool.name.startsWith("mcp__")) {
                const parts = tool.name.split("__");
                if (parts.length > 1 && !servers.includes(parts[1])) {
                    servers.push(parts[1]);
                }
            }
        }
        if (servers.length === 0 && allTools.some((t) => t.name === "mcp")) {
            servers.push("mcp-gateway");
        }
        return servers;
    }
    getThinkingLevel() {
        return this.session?.thinkingLevel ?? "off";
    }
    cycleThinkingLevel() {
        // SAFETY: AgentSession exposes cycleThinkingLevel and setThinkingLevel at runtime.
        const sessionObj = this.session;
        if (sessionObj?.cycleThinkingLevel) {
            sessionObj.cycleThinkingLevel();
            const level = this.getThinkingEffort();
            this.lastAgentSwitchNotice = `Thinking effort: ${level}`;
            this.notify();
            return level;
        }
        const levels = ["off", "minimal", "low", "medium", "high", "max"];
        const current = this.getThinkingEffort();
        const nextIdx = (levels.indexOf(current) + 1) % levels.length;
        const next = levels[nextIdx] ?? "medium";
        if (sessionObj?.setThinkingLevel) {
            sessionObj.setThinkingLevel(next);
        }
        this.lastAgentSwitchNotice = `Thinking effort: ${next}`;
        this.notify();
        return next;
    }
    getActiveTools() {
        return this.session?.getActiveToolNames() ?? [];
    }
    async getAvailableModels() {
        try {
            // SAFETY: AgentSession exposes modelRuntime at runtime.
            const runtime = this.session?.modelRuntime;
            if (runtime?.getAvailable) {
                const models = await runtime.getAvailable();
                return models.map((m) => ({
                    id: String(m.id),
                    name: String(m.name || m.id),
                    provider: String(m.provider || "default"),
                    contextWindow: Number(m.contextWindow || 200000),
                    reasoning: Boolean(m.reasoning),
                }));
            }
        }
        catch {
            // ignore
        }
        return [];
    }
    async setModelById(modelId) {
        try {
            // SAFETY: AgentSession exposes modelRuntime and setModel at runtime.
            const sessionObj = this.session;
            if (sessionObj?.modelRuntime?.getAvailable && sessionObj.setModel) {
                const models = await sessionObj.modelRuntime.getAvailable();
                const found = models.find((m) => m.id.toLowerCase() === modelId.toLowerCase());
                if (found) {
                    await sessionObj.setModel(found);
                    this.metrics.setModelInfo(found.name || found.id, found.contextWindow);
                    this.lastAgentSwitchNotice = `Model set: ${found.id}`;
                    this.notify();
                    return true;
                }
            }
        }
        catch {
            // ignore
        }
        return false;
    }
    getCommands() {
        try {
            const exts = this.session?.resourceLoader?.getExtensions?.();
            if (exts?.runtime?.getCommands) {
                return exts.runtime.getCommands().map((c) => ({
                    name: String(c.name),
                    description: String(c.description || ""),
                }));
            }
        }
        catch {
            // ignore
        }
        return [];
    }
    // --- Agent Hot-Switching Methods ---
    getAgents() {
        return [...this.availableAgents];
    }
    getPrimaryAgents() {
        return this.availableAgents.filter((a) => a.category === "primary");
    }
    getSubagents() {
        return this.availableAgents.filter((a) => a.category === "subagent");
    }
    getActiveAgent() {
        const primaries = this.getPrimaryAgents();
        return (primaries[this.currentAgentIndex] ||
            this.availableAgents[0] || {
            id: "default",
            name: "default",
            description: "Generalist Pi Coding Agent",
            source: "default",
            category: "primary",
            color: AGENT_COLORS.default ?? "\x1b[38;2;137;180;250m",
        });
    }
    getActiveAgentName() {
        return this.getActiveAgent().name;
    }
    getActiveAgentColor() {
        return this.getActiveAgent().color || "\x1b[38;2;137;180;250m";
    }
    getAgentSwitchNotice() {
        return this.lastAgentSwitchNotice;
    }
    nextAgent() {
        const primaries = this.getPrimaryAgents();
        if (primaries.length <= 1)
            return this.getActiveAgent();
        this.currentAgentIndex = (this.currentAgentIndex + 1) % primaries.length;
        this.applyActiveAgent();
        return this.getActiveAgent();
    }
    prevAgent() {
        const primaries = this.getPrimaryAgents();
        if (primaries.length <= 1)
            return this.getActiveAgent();
        this.currentAgentIndex =
            (this.currentAgentIndex - 1 + primaries.length) % primaries.length;
        this.applyActiveAgent();
        return this.getActiveAgent();
    }
    selectAgent(nameOrId) {
        const primaries = this.getPrimaryAgents();
        const idx = primaries.findIndex((a) => a.id.toLowerCase() === nameOrId.toLowerCase() || a.name.toLowerCase() === nameOrId.toLowerCase());
        if (idx >= 0) {
            this.currentAgentIndex = idx;
            this.applyActiveAgent();
            return true;
        }
        return false;
    }
    applyActiveAgent() {
        const agent = this.getActiveAgent();
        this.lastAgentSwitchNotice = `Agent switched: ${agent.name}`;
        if (!this.session) {
            this.notify();
            return;
        }
        try {
            if (agent.tools && agent.tools.length > 0) {
                // Filter to available tools
                const all = this.session.getAllTools().map((t) => t.name);
                const valid = agent.tools.filter((t) => all.includes(t));
                this.session.setActiveToolsByName(valid);
            }
            else {
                this.session.setActiveToolsByName(this.defaultTools);
            }
            if (agent.thinking) {
                this.session.setThinkingLevel(agent.thinking);
            }
        }
        catch {
            // Ignore if session does not allow changing tool loadout
        }
        this.notify();
    }
    discoverAgents() {
        const agentsMap = new Map();
        // 1. Default generalist agent
        agentsMap.set("default", {
            id: "default",
            name: "default",
            description: "Default Pi generalist assistant with full capabilities",
            tools: this.defaultTools,
            source: "default",
            category: "primary",
            color: AGENT_COLORS.default ?? "\x1b[38;2;137;180;250m",
        });
        // 2. Discover user agents from ~/.pi/agent/agents
        const userAgentsDir = path.join(os.homedir(), ".pi", "agent", "agents");
        this.loadAgentsFromDir(userAgentsDir, "user", agentsMap);
        // 3. Discover project agents from .pi/agents
        const projectAgentsDir = path.join(this.cwd, ".pi", "agents");
        this.loadAgentsFromDir(projectAgentsDir, "project", agentsMap);
        // 4. Built-in subagents from pi-subagents if installed
        const builtinDir = path.join(os.homedir(), ".pi", "agent", "npm", "node_modules", "pi-subagents", "agents");
        this.loadAgentsFromDir(builtinDir, "builtin", agentsMap);
        this.availableAgents = Array.from(agentsMap.values());
    }
    loadAgentsFromDir(dir, source, map) {
        if (!fs.existsSync(dir))
            return;
        try {
            const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const content = fs.readFileSync(fullPath, "utf8");
                // Parse frontmatter
                const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
                const baseId = file.replace(/\.md$/, "");
                if (match) {
                    const frontmatter = match[1];
                    const body = match[2].trim();
                    const nameMatch = frontmatter.match(/name:\s*([^\r\n]+)/);
                    const descMatch = frontmatter.match(/description:\s*([^\r\n]+)/);
                    const toolsMatch = frontmatter.match(/tools:\s*([^\r\n]+)/);
                    const thinkMatch = frontmatter.match(/thinking:\s*([^\r\n]+)/);
                    const name = nameMatch ? nameMatch[1].trim() : baseId;
                    const description = descMatch ? descMatch[1].trim() : `Agent ${name}`;
                    const tools = toolsMatch
                        ? toolsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
                        : undefined;
                    const thinking = thinkMatch ? thinkMatch[1].trim() : undefined;
                    // Primary agents are default & orchestrator; all other specialists are subagents
                    const isPrimary = name.toLowerCase() === "orchestrator" || name.toLowerCase() === "default";
                    const category = isPrimary ? "primary" : "subagent";
                    const color = AGENT_COLORS[name.toLowerCase()] ??
                        AGENT_COLORS[baseId.toLowerCase()] ??
                        "\x1b[38;2;116;199;236m";
                    // Project overrides user overrides builtin
                    if (!map.has(name) || source === "project" || (source === "user" && map.get(name)?.source === "builtin")) {
                        map.set(name, {
                            id: name,
                            name,
                            description,
                            tools,
                            thinking,
                            systemPrompt: body,
                            source,
                            category,
                            color,
                        });
                    }
                }
                else {
                    // Plain markdown without frontmatter
                    if (!map.has(baseId)) {
                        const isPrimary = baseId.toLowerCase() === "orchestrator" || baseId.toLowerCase() === "default";
                        const category = isPrimary ? "primary" : "subagent";
                        const color = AGENT_COLORS[baseId.toLowerCase()] ?? "\x1b[38;2;116;199;236m";
                        map.set(baseId, {
                            id: baseId,
                            name: baseId,
                            description: `Agent ${baseId}`,
                            systemPrompt: content.trim(),
                            source,
                            category,
                            color,
                        });
                    }
                }
            }
        }
        catch {
            // Ignore reading errors
        }
    }
    // --- End Agent Hot-Switching Methods ---
    onChange(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    async prompt(text) {
        if (!this.session)
            return;
        if (!text.trim())
            return;
        // Check if the prompt is an explicit delegation: /agent <subagent> <prompt...>
        const agentCmdMatch = text.trim().match(/^\/agent\s+([^\s]+)(?:\s+([\s\S]+))?$/i);
        if (agentCmdMatch) {
            const targetName = agentCmdMatch[1];
            const targetPrompt = agentCmdMatch[2]?.trim();
            if (targetName && targetPrompt) {
                const targetAgent = this.availableAgents.find((a) => a.id.toLowerCase() === targetName.toLowerCase() ||
                    a.name.toLowerCase() === targetName.toLowerCase());
                if (targetAgent) {
                    await this.executeSubagentPrompt(targetAgent, targetPrompt, text);
                    return;
                }
            }
        }
        // Check if the prompt starts with @subagent or @agent-subagent <prompt...>
        const atAgentMatch = text.trim().match(/^@(agent-)?([a-zA-Z0-9_\-]+)(?:\s+([\s\S]+))?$/i);
        if (atAgentMatch) {
            const targetName = atAgentMatch[2];
            const subPrompt = atAgentMatch[3]?.trim();
            if (targetName && subPrompt) {
                const targetAgent = this.availableAgents.find((a) => a.id.toLowerCase() === targetName.toLowerCase() ||
                    a.name.toLowerCase() === targetName.toLowerCase());
                if (targetAgent) {
                    await this.executeSubagentPrompt(targetAgent, subPrompt, text);
                    return;
                }
            }
        }
        const activeAgent = this.getActiveAgent();
        // Push user message to UI
        this.messages.push({
            id: "user-" + Date.now(),
            role: "user",
            text,
            timestamp: Date.now(),
        });
        this.isWorking = true;
        this.currentStatus = "Processing...";
        this.turnStartTime = Date.now();
        this.streamingText = "";
        this.streamingThinking = "";
        this.metrics.onPromptStart();
        this.notify();
        // Prepare prompt with active agent context if not default
        let effectivePrompt = text;
        // Attach workspace files mentioned via @file
        const fileMatches = text.match(/@([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/g);
        if (fileMatches && fileMatches.length > 0) {
            let fileContext = "";
            for (const m of fileMatches) {
                const filePath = m.slice(1);
                try {
                    const resolved = path.resolve(this.cwd, filePath);
                    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
                        const content = fs.readFileSync(resolved, "utf8");
                        fileContext += `[Attached File: ${filePath}]\n\`\`\`\n${content}\n\`\`\`\n\n`;
                    }
                }
                catch {
                    // ignore
                }
            }
            if (fileContext) {
                effectivePrompt = `${fileContext}${effectivePrompt}`;
            }
        }
        if (activeAgent.id !== "default") {
            let agentHeader = `[Active Agent: ${activeAgent.name}]\n`;
            if (activeAgent.description) {
                agentHeader += `Role: ${activeAgent.description}\n`;
            }
            if (activeAgent.systemPrompt) {
                agentHeader += `Guidelines & Boundaries:\n${activeAgent.systemPrompt}\n\n`;
            }
            effectivePrompt = `${agentHeader}Task:\n${text}`;
        }
        try {
            await this.session.prompt(effectivePrompt);
        }
        catch (err) {
            this.messages.push({
                id: "err-" + Date.now(),
                role: "system",
                text: `Error processing prompt: ${err?.message || String(err)}`,
                timestamp: Date.now(),
            });
        }
        finally {
            const elapsed = this.turnStartTime ? (Date.now() - this.turnStartTime) / 1000 : 0;
            this.isWorking = false;
            this.currentStatus = "Ready";
            this.turnStartTime = 0;
            this.streamingText = "";
            this.streamingThinking = "";
            this.metrics.onTurnEnd();
            this.updateStats();
            this.gitWatcher.refresh().catch(() => { });
            this.notify();
            if (elapsed > 2.5) {
                try {
                    process.stdout.write("\x07");
                    const activeAgent = this.getActiveAgentName();
                    exec(`notify-send "Pi-TUI-Plus (${activeAgent})" "Turn completed in ${elapsed.toFixed(1)}s"`, () => { });
                }
                catch {
                    // ignore notification failure
                }
            }
            await this.checkContextThresholds();
        }
    }
    async executeSubagentPrompt(agent, taskPrompt, rawUserText) {
        if (!this.session)
            return;
        this.messages.push({
            id: "user-" + Date.now(),
            role: "user",
            text: rawUserText,
            timestamp: Date.now(),
        });
        this.isWorking = true;
        this.currentStatus = `[${agent.name}] Processing...`;
        this.turnStartTime = Date.now();
        this.streamingText = "";
        this.streamingThinking = "";
        this.metrics.onPromptStart();
        this.notify();
        const previousTools = this.session.getActiveToolNames();
        const previousThinking = this.session.thinkingLevel;
        try {
            if (agent.tools && agent.tools.length > 0) {
                const all = this.session.getAllTools().map((t) => t.name);
                const valid = agent.tools.filter((t) => all.includes(t));
                this.session.setActiveToolsByName(valid);
            }
            if (agent.thinking) {
                this.session.setThinkingLevel(agent.thinking);
            }
            let subagentHeader = `[Subagent Delegation: ${agent.name}]\n`;
            if (agent.description) {
                subagentHeader += `Role: ${agent.description}\n`;
            }
            if (agent.systemPrompt) {
                subagentHeader += `Instructions & Constraints:\n${agent.systemPrompt}\n\n`;
            }
            const effectivePrompt = `${subagentHeader}Task for ${agent.name}:\n${taskPrompt}`;
            await this.session.prompt(effectivePrompt);
        }
        catch (err) {
            this.messages.push({
                id: "err-" + Date.now(),
                role: "system",
                text: `Error executing subagent ${agent.name}: ${err?.message || String(err)}`,
                timestamp: Date.now(),
            });
        }
        finally {
            try {
                const activePrimary = this.getActiveAgent();
                if (activePrimary.tools && activePrimary.tools.length > 0) {
                    const all = this.session.getAllTools().map((t) => t.name);
                    const valid = activePrimary.tools.filter((t) => all.includes(t));
                    this.session.setActiveToolsByName(valid);
                }
                else {
                    this.session.setActiveToolsByName(previousTools);
                }
                if (previousThinking) {
                    this.session.setThinkingLevel(previousThinking);
                }
            }
            catch {
                // ignore
            }
            const elapsed = this.turnStartTime ? (Date.now() - this.turnStartTime) / 1000 : 0;
            this.isWorking = false;
            this.currentStatus = "Ready";
            this.turnStartTime = 0;
            this.streamingText = "";
            this.streamingThinking = "";
            this.metrics.onTurnEnd();
            this.updateStats();
            this.gitWatcher.refresh().catch(() => { });
            this.notify();
            if (elapsed > 2.5) {
                try {
                    process.stdout.write("\x07");
                    exec(`notify-send "Pi-TUI-Plus (${agent.name})" "Subagent task completed in ${elapsed.toFixed(1)}s"`, () => { });
                }
                catch {
                    // ignore
                }
            }
            await this.checkContextThresholds();
        }
    }
    clearMessages() {
        this.messages = [];
        this.hasWarned85 = false;
        this.notify();
    }
    async compact() {
        try {
            this.isWorking = true;
            this.currentStatus = "Compacting context...";
            this.notify();
            if (this.session && typeof this.session.compact === "function") {
                await this.session.compact();
            }
        }
        catch {
            // ignore
        }
        finally {
            this.isWorking = false;
            this.hasWarned85 = false;
            this.currentStatus = "Ready";
            this.updateStats();
            this.notify();
        }
    }
    async checkContextThresholds() {
        if (!this.session || this.isAutoCompacting)
            return;
        const m = this.metrics.getMetrics();
        const percent = m.contextPercent;
        if (percent < 80) {
            this.hasWarned85 = false;
        }
        // Auto-compaction at 95%
        if (percent >= 95) {
            this.isAutoCompacting = true;
            const initialTotal = m.total;
            this.messages.push({
                id: "auto-compact-" + Date.now(),
                role: "system",
                text: `⚡ Context window reached ${percent}% ceiling (${m.total.toLocaleString()} / ${m.contextWindow.toLocaleString()} tokens).\nAuto-compacting conversation memory to prevent context overflow...`,
                timestamp: Date.now(),
            });
            this.notify();
            try {
                await this.compact();
                const postM = this.metrics.getMetrics();
                const reclaimed = Math.max(0, initialTotal - postM.total);
                this.messages.push({
                    id: "auto-compact-done-" + Date.now(),
                    role: "system",
                    text: `✓ Context auto-compacted successfully: now at ${postM.contextPercent}% (${postM.total.toLocaleString()} / ${postM.contextWindow.toLocaleString()} tokens). Reclaimed ${reclaimed.toLocaleString()} tokens.`,
                    timestamp: Date.now(),
                });
            }
            catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                this.messages.push({
                    id: "auto-compact-err-" + Date.now(),
                    role: "system",
                    text: `⚠️ Auto-compaction encountered an issue: ${errMsg}`,
                    timestamp: Date.now(),
                });
            }
            finally {
                this.isAutoCompacting = false;
                this.hasWarned85 = false;
                this.updateStats();
                this.notify();
            }
            return;
        }
        // Warning alert at 85%
        if (percent >= 85 && !this.hasWarned85) {
            this.hasWarned85 = true;
            this.messages.push({
                id: "warn-85-" + Date.now(),
                role: "system",
                text: `⚠️ Context window warning: currently at ${percent}% (${m.total.toLocaleString()} / ${m.contextWindow.toLocaleString()} tokens).\nRun the command /compact to compress conversation memory and reclaim space before reaching the 95% ceiling.`,
                timestamp: Date.now(),
            });
            this.notify();
        }
    }
    showCostBreakdown() {
        const m = this.metrics.getMetrics();
        const totalIn = m.input + m.cacheRead;
        const hitRate = totalIn > 0 ? ((m.cacheRead / totalIn) * 100).toFixed(1) : "0.0";
        const info = `📊 Token Economics & Cost Breakdown:
• Model: ${this.getModelName()}
• Context Window: ${m.contextWindow.toLocaleString()} tokens (${m.contextPercent}% used)
• Input Tokens: ${m.input.toLocaleString()}
• Output Tokens: ${m.output.toLocaleString()}
• Cache Read: ${m.cacheRead.toLocaleString()} (${hitRate}% hit rate)
• Estimated Cost: $${m.estimatedCostUsd.toFixed(4)} USD`;
        this.messages.push({
            id: "cost-" + Date.now(),
            role: "system",
            text: info,
            timestamp: Date.now(),
        });
        this.notify();
    }
    async abort() {
        if (this.session) {
            await this.session.abort();
            this.isWorking = false;
            this.currentStatus = "Cancelled";
            this.turnStartTime = 0;
            this.streamingText = "";
            this.streamingThinking = "";
            this.notify();
        }
    }
    handleSessionEvent(event) {
        switch (event.type) {
            case "turn_start": {
                this.isWorking = true;
                this.currentStatus = "Processing...";
                this.streamingText = "";
                this.streamingThinking = "";
                this.notify();
                break;
            }
            case "message_update": {
                const assistantEvent = event.assistantMessageEvent;
                if (assistantEvent) {
                    if (assistantEvent.type === "text_delta") {
                        this.streamingText += assistantEvent.delta;
                        // Approx 1 token per 4 chars
                        const tokenEstimate = Math.max(1, Math.round(assistantEvent.delta.length / 4));
                        this.metrics.onTokenDelta(tokenEstimate);
                    }
                    else if (assistantEvent.type === "thinking_delta") {
                        this.streamingThinking += assistantEvent.delta;
                        this.currentStatus = "Thinking / Reasoning...";
                    }
                }
                this.notify();
                break;
            }
            case "message_end": {
                const msg = event.message;
                if (msg) {
                    if (msg.role === "assistant") {
                        let fullText = "";
                        let thinking = "";
                        if (Array.isArray(msg.content)) {
                            for (const part of msg.content) {
                                if (part.type === "text")
                                    fullText += part.text;
                                if (part.type === "thinking")
                                    thinking += part.thinking;
                            }
                        }
                        else if (typeof msg.content === "string") {
                            fullText = msg.content;
                        }
                        if (fullText.trim() || thinking.trim()) {
                            this.messages.push({
                                id: "asst-" + Date.now(),
                                role: "assistant",
                                text: fullText || this.streamingText,
                                thinking: thinking || this.streamingThinking,
                                timestamp: Date.now(),
                            });
                        }
                    }
                }
                this.streamingText = "";
                this.streamingThinking = "";
                this.updateStats();
                this.checkContextThresholds().catch(() => { });
                this.notify();
                break;
            }
            case "tool_execution_start": {
                this.currentStatus = `Executing tool: ${event.toolName}...`;
                this.toolLogger.onToolStart(event.toolCallId, event.toolName, event.args);
                if (event.toolName === "todo" && this.todoTracker) {
                    this.todoTracker.handleToolCall(event.args);
                }
                this.notify();
                break;
            }
            case "tool_execution_end": {
                this.toolLogger.onToolEnd(event.toolCallId, event.toolName, event.result, event.isError, event.durationMs);
                if (event.toolName === "todo" && this.todoTracker) {
                    this.todoTracker.handleToolCall(event.args);
                }
                this.currentStatus = `Tool completed (${event.toolName})`;
                this.gitWatcher.refresh().catch(() => { });
                this.notify();
                break;
            }
            case "agent_end":
            case "agent_settled": {
                this.isWorking = false;
                this.currentStatus = "Ready";
                this.updateStats();
                this.notify();
                break;
            }
            default:
                break;
        }
    }
    loadHistory() {
        if (!this.session)
            return;
        const sessionMessages = this.session.messages;
        for (const m of sessionMessages) {
            if (m.role === "user") {
                let text = "";
                if (typeof m.content === "string")
                    text = m.content;
                else if (Array.isArray(m.content)) {
                    text = m.content
                        .filter((p) => p.type === "text")
                        .map((p) => p.text)
                        .join("\n");
                }
                if (text) {
                    this.messages.push({
                        id: "hist-u-" + Math.random(),
                        role: "user",
                        text,
                        timestamp: Date.now(),
                    });
                }
            }
            else if (m.role === "assistant") {
                let text = "";
                let thinking = "";
                if (typeof m.content === "string")
                    text = m.content;
                else if (Array.isArray(m.content)) {
                    for (const p of m.content) {
                        if (p.type === "text")
                            text += p.text;
                        if (p.type === "thinking")
                            thinking += p.thinking;
                    }
                }
                if (text || thinking) {
                    this.messages.push({
                        id: "hist-a-" + Math.random(),
                        role: "assistant",
                        text,
                        thinking,
                        timestamp: Date.now(),
                    });
                }
            }
        }
    }
    updateStats() {
        if (!this.session)
            return;
        try {
            const stats = this.session.getSessionStats();
            if (stats && stats.tokens) {
                this.metrics.updateSessionStats({
                    input: stats.tokens.input,
                    output: stats.tokens.output,
                    cacheRead: stats.tokens.cacheRead,
                    cacheWrite: stats.tokens.cacheWrite,
                    total: stats.tokens.total,
                    totalMessages: stats.totalMessages,
                });
            }
        }
        catch {
            // ignore
        }
    }
    dispose() {
        if (this.unsubscribeSession) {
            this.unsubscribeSession();
            this.unsubscribeSession = undefined;
        }
        if (this.session) {
            this.session.dispose();
            this.session = undefined;
        }
        this.listeners = [];
    }
    notify() {
        for (const l of this.listeners) {
            l();
        }
    }
}
//# sourceMappingURL=agent-manager.js.map