// Fallback pricing table per 1M tokens
const MODEL_PRICING = {
    "claude-3-5-sonnet": { inputPerMillion: 3.0, outputPerMillion: 15.0, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 },
    "claude-3-7-sonnet": { inputPerMillion: 3.0, outputPerMillion: 15.0, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 },
    "claude-3-haiku": { inputPerMillion: 0.25, outputPerMillion: 1.25, cacheReadPerMillion: 0.025, cacheWritePerMillion: 0.30 },
    "claude-3-5-haiku": { inputPerMillion: 0.8, outputPerMillion: 4.0, cacheReadPerMillion: 0.08, cacheWritePerMillion: 1.0 },
    "claude-3-opus": { inputPerMillion: 15.0, outputPerMillion: 75.0, cacheReadPerMillion: 1.5, cacheWritePerMillion: 18.75 },
    "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10.0, cacheReadPerMillion: 1.25 },
    "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.60, cacheReadPerMillion: 0.075 },
    "gemini-2.0-flash": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
    "gemini-1.5-pro": { inputPerMillion: 1.25, outputPerMillion: 5.0 },
};
export class MetricsTracker {
    metrics = {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        total: 0,
        contextWindow: 200000,
        contextPercent: 0,
        estimatedCostUsd: 0,
        speedTokensPerSec: 0,
        currentTurnTokens: 0,
        currentTurnDurationSec: 0,
        latencyMs: 0,
        totalTurns: 0,
    };
    currentModelName = "unknown";
    turnStartTime;
    firstTokenTime;
    listeners = [];
    getMetrics() {
        return { ...this.metrics };
    }
    reset() {
        const window = this.metrics.contextWindow;
        this.metrics = {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            total: 0,
            contextWindow: window,
            contextPercent: 0,
            estimatedCostUsd: 0,
            speedTokensPerSec: 0,
            currentTurnTokens: 0,
            currentTurnDurationSec: 0,
            latencyMs: 0,
            totalTurns: 0,
        };
        this.turnStartTime = undefined;
        this.firstTokenTime = undefined;
        this.notify();
    }
    onChange(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    setModelInfo(modelName, contextWindow) {
        this.currentModelName = modelName.toLowerCase();
        if (contextWindow && contextWindow > 0) {
            this.metrics.contextWindow = contextWindow;
        }
        else {
            if (this.currentModelName.includes("gemini")) {
                this.metrics.contextWindow = 1000000;
            }
            else if (this.currentModelName.includes("claude")) {
                this.metrics.contextWindow = 200000;
            }
            else if (this.currentModelName.includes("gpt-4")) {
                this.metrics.contextWindow = 128000;
            }
            else {
                this.metrics.contextWindow = 128000;
            }
        }
        this.recalculate();
        this.notify();
    }
    onPromptStart() {
        this.turnStartTime = Date.now();
        this.firstTokenTime = undefined;
        this.metrics.currentTurnTokens = 0;
        this.metrics.currentTurnDurationSec = 0;
        this.metrics.speedTokensPerSec = 0;
        this.notify();
    }
    onFirstToken() {
        if (this.turnStartTime && !this.firstTokenTime) {
            this.firstTokenTime = Date.now();
            this.metrics.latencyMs = this.firstTokenTime - this.turnStartTime;
            this.notify();
        }
    }
    onTokenDelta(tokensDelta = 1) {
        if (!this.firstTokenTime) {
            this.onFirstToken();
        }
        this.metrics.currentTurnTokens += tokensDelta;
        if (this.firstTokenTime) {
            const elapsedSec = (Date.now() - this.firstTokenTime) / 1000;
            if (elapsedSec > 0.1) {
                this.metrics.currentTurnDurationSec = elapsedSec;
                this.metrics.speedTokensPerSec = Math.round(this.metrics.currentTurnTokens / elapsedSec);
            }
        }
        this.notify();
    }
    updateSessionStats(stats) {
        this.metrics.input = stats.input;
        this.metrics.output = stats.output;
        this.metrics.cacheRead = stats.cacheRead;
        this.metrics.cacheWrite = stats.cacheWrite;
        this.metrics.total = stats.total;
        if (stats.totalMessages) {
            this.metrics.totalTurns = Math.floor(stats.totalMessages / 2);
        }
        this.recalculate();
        this.notify();
    }
    onTurnEnd() {
        this.metrics.totalTurns += 1;
        if (this.turnStartTime) {
            const duration = (Date.now() - this.turnStartTime) / 1000;
            this.metrics.currentTurnDurationSec = Math.max(0.1, duration);
        }
        this.recalculate();
        this.notify();
    }
    recalculate() {
        if (this.metrics.contextWindow > 0) {
            this.metrics.contextPercent = Math.min(100, Math.round((this.metrics.total / this.metrics.contextWindow) * 100));
        }
        // Cost estimation
        let pricing;
        for (const [key, p] of Object.entries(MODEL_PRICING)) {
            if (this.currentModelName.includes(key)) {
                pricing = p;
                break;
            }
        }
        if (!pricing) {
            pricing = { inputPerMillion: 3.0, outputPerMillion: 15.0 }; // fallback
        }
        const inputCost = (this.metrics.input / 1_000_000) * pricing.inputPerMillion;
        const outputCost = (this.metrics.output / 1_000_000) * pricing.outputPerMillion;
        const cacheReadCost = (this.metrics.cacheRead / 1_000_000) * (pricing.cacheReadPerMillion ?? pricing.inputPerMillion * 0.1);
        const cacheWriteCost = (this.metrics.cacheWrite / 1_000_000) * (pricing.cacheWritePerMillion ?? pricing.inputPerMillion * 1.25);
        this.metrics.estimatedCostUsd = inputCost + outputCost + cacheReadCost + cacheWriteCost;
    }
    notify() {
        for (const l of this.listeners) {
            l();
        }
    }
}
//# sourceMappingURL=metrics-tracker.js.map