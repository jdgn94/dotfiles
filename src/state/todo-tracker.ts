export interface TodoItem {
  id: number;
  text: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export class TodoTracker {
  private tasks: TodoItem[] = [];
  private collapsed = false;
  private listeners: Array<() => void> = [];

  public getTasks(): TodoItem[] {
    return [...this.tasks];
  }

  public hasTasks(): boolean {
    return this.tasks.length > 0;
  }

  public isCollapsed(): boolean {
    return this.collapsed;
  }

  public toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.notify();
  }

  public setCollapsed(val: boolean): void {
    this.collapsed = val;
    this.notify();
  }

  public getSummary(): { total: number; completed: number; inProgress: number } {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.status === "completed").length;
    const inProgress = this.tasks.filter((t) => t.status === "in_progress").length;
    return { total, completed, inProgress };
  }

  public handleToolCall(args: Record<string, unknown> | null | undefined): void {
    if (!args || typeof args !== "object") return;

    const action = args.action;

    switch (action) {
      case "init": {
        if (Array.isArray(args.tasks)) {
          this.tasks = args.tasks.map((text: string, index: number) => ({
            id: index + 1,
            text: String(text),
            status: index === 0 ? "in_progress" : "pending",
          }));
          this.collapsed = false; // Auto-expand when initialized
          this.notify();
        }
        break;
      }

      case "add": {
        if (args.text) {
          const nextId =
            this.tasks.length > 0
              ? Math.max(...this.tasks.map((t) => t.id)) + 1
              : 1;
          this.tasks.push({
            id: nextId,
            text: String(args.text),
            status: "pending",
          });
          this.notify();
        }
        break;
      }

      case "update": {
        const id = Number(args.id);
        const status = args.status;
        const task = this.tasks.find((t) => t.id === id);
        if (
          task &&
          (status === "pending" ||
            status === "in_progress" ||
            status === "completed" ||
            status === "failed")
        ) {
          task.status = status;
          this.notify();
        }
        break;
      }

      case "toggle": {
        const id = Number(args.id);
        const task = this.tasks.find((t) => t.id === id);
        if (task) {
          task.status = task.status === "completed" ? "pending" : "completed";
          this.notify();
        }
        break;
      }

      case "clear": {
        this.tasks = [];
        this.notify();
        break;
      }

      default:
        break;
    }
  }

  public onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const l of this.listeners) {
      l();
    }
  }
}
