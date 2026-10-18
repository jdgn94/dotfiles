import { type GitWatcher } from "./git-watcher.js";
import { type MetricsTracker } from "./metrics-tracker.js";
import { type TodoTracker } from "./todo-tracker.js";
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
export interface AgentDefinition {
    id: string;
    name: string;
    description: string;
    tools?: string[];
    thinking?: string;
    systemPrompt?: string;
    source: "default" | "user" | "project" | "builtin";
    category: "primary" | "subagent";
    color: string;
}
export declare const AGENT_COLORS: Record<string, string>;
export declare class AgentManager {
    private session?;
    private cwd;
    private metrics;
    private toolLogger;
    private gitWatcher;
    private todoTracker?;
    private messages;
    private streamingText;
    private streamingThinking;
    private isWorking;
    private currentStatus;
    private turnStartTime;
    private unsubscribeSession?;
    private listeners;
    private availableAgents;
    private currentAgentIndex;
    private defaultTools;
    private lastAgentSwitchNotice;
    constructor(cwd: string, metrics: MetricsTracker, toolLogger: ToolLogger, gitWatcher: GitWatcher, todoTracker?: TodoTracker);
    init(): Promise<void>;
    getMessages(): ChatMessage[];
    getStreamingText(): string;
    getStreamingThinking(): string;
    getIsWorking(): boolean;
    getStatusText(): string;
    getTurnElapsedSec(): string;
    getElapsedSec(): number;
    getModelName(): string;
    getModelId(): string;
    getSessionId(): string;
    getSessionName(): string;
    getPid(): number;
    getThinkingEffort(): string;
    getSkills(): Array<{
        name: string;
        description: string;
    }>;
    getMcpServers(): string[];
    getThinkingLevel(): string;
    cycleThinkingLevel(): string;
    getActiveTools(): string[];
    getCommands(): Array<{
        name: string;
        description: string;
    }>;
    getAgents(): AgentDefinition[];
    getPrimaryAgents(): AgentDefinition[];
    getSubagents(): AgentDefinition[];
    getActiveAgent(): AgentDefinition;
    getActiveAgentName(): string;
    getActiveAgentColor(): string;
    getAgentSwitchNotice(): string;
    nextAgent(): AgentDefinition;
    prevAgent(): AgentDefinition;
    selectAgent(nameOrId: string): boolean;
    private applyActiveAgent;
    private discoverAgents;
    private loadAgentsFromDir;
    onChange(listener: () => void): () => void;
    prompt(text: string): Promise<void>;
    private executeSubagentPrompt;
    abort(): Promise<void>;
    private handleSessionEvent;
    private loadHistory;
    private updateStats;
    dispose(): void;
    private notify;
}
