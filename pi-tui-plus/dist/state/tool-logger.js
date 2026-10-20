export class ToolLogger {
    logs = [];
    listeners = [];
    maxLogs = 50;
    getLogs() {
        return [...this.logs];
    }
    getRunningCount() {
        return this.logs.filter((l) => l.status === "running").length;
    }
    getRecentLogs(limit = 10) {
        return this.logs.slice(-limit);
    }
    getActiveSubagents() {
        const running = this.logs.filter((l) => l.status === "running" &&
            (l.toolName === "subagent" ||
                l.toolName === "acp_delegate" ||
                l.toolName === "delegate_agent"));
        return running.map((r) => {
            let agentName = "subagent";
            let taskSummary = "";
            if (typeof r.args === "object" && r.args !== null) {
                const argsObj = r.args;
                agentName = String(argsObj.agent || argsObj.role || "subagent");
                taskSummary = String(argsObj.task || argsObj.prompt || "");
            }
            const durationSec = Math.max(0, Math.floor((Date.now() - r.startTime) / 1000));
            return {
                id: r.id,
                agent: agentName,
                task: taskSummary,
                durationSec,
            };
        });
    }
    onChange(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    onToolStart(toolCallId, toolName, args) {
        const log = {
            id: toolCallId,
            toolName,
            args: typeof args === "object" ? args : String(args),
            startTime: Date.now(),
            status: "running",
        };
        this.logs.push(log);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        this.notify();
    }
    onToolEnd(toolCallId, toolName, result, isError, durationMs) {
        const existing = this.logs.find((l) => l.id === toolCallId);
        const now = Date.now();
        let preview = "";
        if (result !== undefined && result !== null) {
            if (typeof result === "string") {
                preview = result.length > 200 ? result.slice(0, 197) + "..." : result;
            }
            else if (typeof result === "object") {
                try {
                    const s = JSON.stringify(result);
                    preview = s.length > 200 ? s.slice(0, 197) + "..." : s;
                }
                catch {
                    preview = "[Object]";
                }
            }
            else {
                preview = String(result);
            }
        }
        if (existing) {
            existing.endTime = now;
            existing.durationMs = durationMs ?? (now - existing.startTime);
            existing.status = isError ? "error" : "success";
            existing.resultPreview = preview.replace(/\r?\n/g, " ");
            if (isError)
                existing.error = preview;
        }
        else {
            this.logs.push({
                id: toolCallId,
                toolName,
                args: {},
                startTime: now - (durationMs || 0),
                endTime: now,
                durationMs: durationMs || 0,
                status: isError ? "error" : "success",
                resultPreview: preview.replace(/\r?\n/g, " "),
            });
            if (this.logs.length > this.maxLogs) {
                this.logs.shift();
            }
        }
        this.notify();
    }
    notify() {
        for (const l of this.listeners) {
            l();
        }
    }
    clear() {
        this.logs = [];
        this.notify();
    }
}
//# sourceMappingURL=tool-logger.js.map