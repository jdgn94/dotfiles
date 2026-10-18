export interface ToolCallLog {
  id: string;
  toolName: string;
  args: Record<string, any> | string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: "running" | "success" | "error";
  resultPreview?: string;
  error?: string;
}

export class ToolLogger {
  private logs: ToolCallLog[] = [];
  private listeners: Array<() => void> = [];
  private maxLogs = 50;

  public getLogs(): ToolCallLog[] {
    return [...this.logs];
  }

  public getRunningCount(): number {
    return this.logs.filter((l) => l.status === "running").length;
  }

  public getRecentLogs(limit = 10): ToolCallLog[] {
    return this.logs.slice(-limit);
  }

  public onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public onToolStart(toolCallId: string, toolName: string, args: any): void {
    const log: ToolCallLog = {
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

  public onToolEnd(
    toolCallId: string,
    toolName: string,
    result: any,
    isError: boolean,
    durationMs?: number
  ): void {
    const existing = this.logs.find((l) => l.id === toolCallId);
    const now = Date.now();
    let preview = "";

    if (result !== undefined && result !== null) {
      if (typeof result === "string") {
        preview = result.length > 200 ? result.slice(0, 197) + "..." : result;
      } else if (typeof result === "object") {
        try {
          const s = JSON.stringify(result);
          preview = s.length > 200 ? s.slice(0, 197) + "..." : s;
        } catch {
          preview = "[Object]";
        }
      } else {
        preview = String(result);
      }
    }

    if (existing) {
      existing.endTime = now;
      existing.durationMs = durationMs ?? (now - existing.startTime);
      existing.status = isError ? "error" : "success";
      existing.resultPreview = preview.replace(/\r?\n/g, " ");
      if (isError) existing.error = preview;
    } else {
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

  private notify(): void {
    for (const l of this.listeners) {
      l();
    }
  }

  public clear(): void {
    this.logs = [];
    this.notify();
  }
}
