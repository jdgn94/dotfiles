export interface ToolCallLog {
    id: string;
    toolName: string;
    args: Record<string, unknown> | string;
    startTime: number;
    endTime?: number;
    durationMs?: number;
    status: "running" | "success" | "error";
    resultPreview?: string;
    error?: string;
}
export declare class ToolLogger {
    private logs;
    private listeners;
    private maxLogs;
    getLogs(): ToolCallLog[];
    getRunningCount(): number;
    getRecentLogs(limit?: number): ToolCallLog[];
    getActiveSubagents(): Array<{
        id: string;
        agent: string;
        task: string;
        durationSec: number;
    }>;
    onChange(listener: () => void): () => void;
    onToolStart(toolCallId: string, toolName: string, args: any): void;
    onToolEnd(toolCallId: string, toolName: string, result: any, isError: boolean, durationMs?: number): void;
    private notify;
    clear(): void;
}
