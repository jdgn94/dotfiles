import {
  createAgentSession,
  type AgentSession,
} from "@earendil-works/pi-coding-agent";
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

export class AgentManager {
  private session?: AgentSession;
  private cwd: string;
  private metrics: MetricsTracker;
  private toolLogger: ToolLogger;
  private gitWatcher: GitWatcher;

  private messages: ChatMessage[] = [];
  private streamingText = "";
  private streamingThinking = "";
  private isWorking = false;
  private currentStatus = "Listo";
  private unsubscribeSession?: () => void;
  private listeners: Array<() => void> = [];

  constructor(
    cwd: string,
    metrics: MetricsTracker,
    toolLogger: ToolLogger,
    gitWatcher: GitWatcher
  ) {
    this.cwd = cwd;
    this.metrics = metrics;
    this.toolLogger = toolLogger;
    this.gitWatcher = gitWatcher;
  }

  public async init(): Promise<void> {
    const result = await createAgentSession({
      cwd: this.cwd,
    });
    this.session = result.session;

    const model = this.session.model;
    if (model) {
      this.metrics.setModelInfo(model.name, (model as any).contextWindow);
    }

    // Load initial session history if any
    this.loadHistory();

    // Subscribe to session events
    this.unsubscribeSession = this.session.subscribe((event: any) => {
      this.handleSessionEvent(event);
    });

    this.updateStats();
    this.notify();
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public getStreamingText(): string {
    return this.streamingText;
  }

  public getStreamingThinking(): string {
    return this.streamingThinking;
  }

  public getIsWorking(): boolean {
    return this.isWorking;
  }

  public getStatusText(): string {
    return this.currentStatus;
  }

  public getModelName(): string {
    return this.session?.model?.name ?? "default";
  }

  public getThinkingLevel(): string {
    return this.session?.thinkingLevel ?? "off";
  }

  public getActiveTools(): string[] {
    return this.session?.getActiveToolNames() ?? [];
  }

  public onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async prompt(text: string): Promise<void> {
    if (!this.session) return;
    if (!text.trim()) return;

    // Push user message
    this.messages.push({
      id: "user-" + Date.now(),
      role: "user",
      text,
      timestamp: Date.now(),
    });

    this.isWorking = true;
    this.currentStatus = "Procesando...";
    this.streamingText = "";
    this.streamingThinking = "";
    this.metrics.onPromptStart();
    this.notify();

    try {
      await this.session.prompt(text);
    } catch (err: any) {
      this.messages.push({
        id: "err-" + Date.now(),
        role: "system",
        text: `Error al procesar: ${err?.message || String(err)}`,
        timestamp: Date.now(),
      });
    } finally {
      this.isWorking = false;
      this.currentStatus = "Listo";
      this.streamingText = "";
      this.streamingThinking = "";
      this.metrics.onTurnEnd();
      this.updateStats();
      this.gitWatcher.refresh().catch(() => {});
      this.notify();
    }
  }

  public async abort(): Promise<void> {
    if (this.session) {
      await this.session.abort();
      this.isWorking = false;
      this.currentStatus = "Cancelado";
      this.streamingText = "";
      this.streamingThinking = "";
      this.notify();
    }
  }

  private handleSessionEvent(event: any): void {
    switch (event.type) {
      case "turn_start": {
        this.isWorking = true;
        this.currentStatus = "Generando respuesta...";
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
          } else if (assistantEvent.type === "thinking_delta") {
            this.streamingThinking += assistantEvent.delta;
            this.currentStatus = "Pensando...";
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
                if (part.type === "text") fullText += part.text;
                if (part.type === "thinking") thinking += part.thinking;
              }
            } else if (typeof msg.content === "string") {
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
        this.notify();
        break;
      }

      case "tool_execution_start": {
        this.currentStatus = `Ejecutando tool: ${event.toolName}...`;
        this.toolLogger.onToolStart(event.toolCallId, event.toolName, event.args);
        this.notify();
        break;
      }

      case "tool_execution_end": {
        this.toolLogger.onToolEnd(
          event.toolCallId,
          event.toolName,
          event.result,
          event.isError,
          event.durationMs
        );
        this.currentStatus = "Tool finalizada";
        this.gitWatcher.refresh().catch(() => {});
        this.notify();
        break;
      }

      case "agent_end":
      case "agent_settled": {
        this.isWorking = false;
        this.currentStatus = "Listo";
        this.updateStats();
        this.notify();
        break;
      }
    }
  }

  private loadHistory(): void {
    if (!this.session) return;
    const sessionMessages = this.session.messages;
    for (const m of sessionMessages) {
      if (m.role === "user") {
        let text = "";
        if (typeof m.content === "string") text = m.content;
        else if (Array.isArray(m.content)) {
          text = m.content
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
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
      } else if (m.role === "assistant") {
        let text = "";
        let thinking = "";
        if (typeof m.content === "string") text = m.content;
        else if (Array.isArray(m.content)) {
          for (const p of m.content) {
            if (p.type === "text") text += p.text;
            if (p.type === "thinking") thinking += p.thinking;
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

  private updateStats(): void {
    if (!this.session) return;
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
    } catch {
      // ignore
    }
  }

  public dispose(): void {
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

  private notify(): void {
    for (const l of this.listeners) {
      l();
    }
  }
}
