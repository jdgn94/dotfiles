export interface ModelPricing {
    inputPerMillion: number;
    outputPerMillion: number;
    cacheReadPerMillion?: number;
    cacheWritePerMillion?: number;
}
export interface TokenMetrics {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
    contextWindow: number;
    contextPercent: number;
    estimatedCostUsd: number;
    speedTokensPerSec: number;
    currentTurnTokens: number;
    currentTurnDurationSec: number;
    latencyMs: number;
    totalTurns: number;
}
export declare class MetricsTracker {
    private metrics;
    private currentModelName;
    private turnStartTime?;
    private firstTokenTime?;
    private listeners;
    getMetrics(): TokenMetrics;
    onChange(listener: () => void): () => void;
    setModelInfo(modelName: string, contextWindow?: number): void;
    onPromptStart(): void;
    onFirstToken(): void;
    onTokenDelta(tokensDelta?: number): void;
    updateSessionStats(stats: {
        input: number;
        output: number;
        cacheRead: number;
        cacheWrite: number;
        total: number;
        totalMessages?: number;
    }): void;
    onTurnEnd(): void;
    private recalculate;
    private notify;
}
