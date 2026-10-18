import { type GitWatcher } from "./git-watcher.js";
import { type MetricsTracker } from "./metrics-tracker.js";
import { type ToolLogger } from "./tool-logger.js";
export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    text: string;
    thinking?: string;
    toolCall?: {
        name: string;
        args: any;
        result?: any;
        isError?: boolean;
        durationMs?: number;
    };
    timestamp: number;
}
export declare class AgentManager {
    private session?;
    private cwd;
    private metrics;
    private toolLogger;
    private gitWatcher;
    private messages;
    private streamingText;
    private streamingThinking;
    private isWorking;
    private currentStatus;
    private unsubscribeSession?;
    private listeners;
    constructor(cwd: string, metrics: MetricsTracker, toolLogger: ToolLogger, gitWatcher: GitWatcher);
    init(): Promise<void>;
    getMessages(): ChatMessage[];
    getStreamingText(): string;
    getStreamingThinking(): string;
    getIsWorking(): boolean;
    getStatusText(): string;
    getModelName(): string;
    getThinkingLevel(): string;
    getActiveTools(): string[];
    onChange(listener: () => void): () => void;
    prompt(text: string): Promise<void>;
    abort(): Promise<void>;
    private handleSessionEvent;
    private loadHistory;
    private updateStats;
    dispose(): void;
    private notify;
}
