import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, Text, truncateToWidth } from "@earendil-works/pi-tui";
import { Type } from "typebox";

export type TodoStatus = "pending" | "in_progress" | "completed" | "failed";

export interface TodoItem {
  id: number;
  text: string;
  status: TodoStatus;
}

interface TodoDetails {
  action: "init" | "add" | "update" | "toggle" | "list" | "clear";
  todos: TodoItem[];
  nextId: number;
  error?: string;
}

const TodoParams = Type.Object({
  action: StringEnum(["init", "add", "update", "toggle", "list", "clear"] as const, {
    description: "Action to perform: init (initialize plan), add (single task), update (change status), toggle, list, clear",
  }),
  tasks: Type.Optional(
    Type.Array(Type.String(), {
      description: "List of step descriptions to initialize a plan with (for 'init')",
    })
  ),
  text: Type.Optional(Type.String({ description: "Task description (for 'add')" })),
  id: Type.Optional(Type.Number({ description: "Task ID (for 'update' or 'toggle')" })),
  status: Type.Optional(
    StringEnum(["pending", "in_progress", "completed", "failed"] as const, {
      description: "New status for task (for 'update')",
    })
  ),
});

/**
 * Interactive UI component for the /todos command
 */
class TodoListComponent {
  private todos: TodoItem[];
  private theme: Theme;
  private onClose: () => void;
  private cachedWidth?: number;
  private cachedLines?: string[];

  constructor(todos: TodoItem[], theme: Theme, onClose: () => void) {
    this.todos = todos;
    this.theme = theme;
    this.onClose = onClose;
  }

  handleInput(data: string): void {
    if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
      this.onClose();
    }
  }

  render(width: number): string[] {
    if (this.cachedLines && this.cachedWidth === width) {
      return this.cachedLines;
    }

    const lines: string[] = [];
    const th = this.theme;

    lines.push("");
    const title = th.fg("accent", " 📋 Plan & Execution Todos ");
    const headerLine =
      th.fg("borderMuted", "─".repeat(3)) + title + th.fg("borderMuted", "─".repeat(Math.max(0, width - 28)));
    lines.push(truncateToWidth(headerLine, width));
    lines.push("");

    if (this.todos.length === 0) {
      lines.push(truncateToWidth(`  ${th.fg("dim", "No active plan. Initialize one with the todo tool!")}`, width));
    } else {
      const completed = this.todos.filter((t) => t.status === "completed").length;
      const inProgress = this.todos.filter((t) => t.status === "in_progress").length;
      const failed = this.todos.filter((t) => t.status === "failed").length;
      const total = this.todos.length;

      lines.push(
        truncateToWidth(
          `  ${th.fg("muted", "Progreso:")} ${th.fg("success", `${completed}/${total} completados`)}` +
            (inProgress ? ` • ${th.fg("accent", `${inProgress} en curso`)}` : "") +
            (failed ? ` • ${th.fg("error", `${failed} fallidos`)}` : ""),
          width
        )
      );
      lines.push("");

      for (const t of this.todos) {
        let badge: string;
        let itemText: string;

        switch (t.status) {
          case "completed":
            badge = th.fg("success", " ✓ ");
            itemText = th.fg("dim", t.text);
            break;
          case "in_progress":
            badge = th.fg("accent", th.bold(" ▶ "));
            itemText = th.fg("accent", th.bold(t.text));
            break;
          case "failed":
            badge = th.fg("error", " ✗ ");
            itemText = th.fg("error", t.text);
            break;
          case "pending":
          default:
            badge = th.fg("dim", " ○ ");
            itemText = th.fg("text", t.text);
            break;
        }

        const idBadge = th.fg("muted", `#${t.id}`);
        lines.push(truncateToWidth(`  ${badge}${idBadge} ${itemText}`, width));
      }
    }

    lines.push("");
    lines.push(truncateToWidth(`  ${th.fg("dim", "Presiona Escape para cerrar")}`, width));
    lines.push("");

    this.cachedWidth = width;
    this.cachedLines = lines;
    return lines;
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
  }
}

export default function (pi: ExtensionAPI) {
  let todos: TodoItem[] = [];
  let nextId = 1;

  // Render or update the live progress widget above the editor
  function updateWidget(ctx?: ExtensionContext) {
    if (!ctx || !ctx.hasUI) return;

    if (todos.length === 0) {
      ctx.ui.setWidget("plan-todos", undefined);
      return;
    }

    const completed = todos.filter((t) => t.status === "completed").length;
    const total = todos.length;
    const active = todos.find((t) => t.status === "in_progress");

    const lines: string[] = [];
    const statusText = `📋 Plan (${completed}/${total})` + (active ? ` • [En curso: #${active.id} ${active.text}]` : "");
    lines.push(statusText);

    // Show compact overview (up to 3 items)
    for (const t of todos.slice(0, 4)) {
      const icon =
        t.status === "completed" ? "✓" : t.status === "in_progress" ? "▶" : t.status === "failed" ? "✗" : "○";
      lines.push(`  ${icon} #${t.id}: ${t.text}`);
    }
    if (todos.length > 4) {
      lines.push(`  ... (${todos.length - 4} pasos más, escribe /todos para ver todo)`);
    }

    ctx.ui.setWidget("plan-todos", lines, { placement: "aboveEditor" });
  }

  const reconstructState = (ctx: ExtensionContext) => {
    todos = [];
    nextId = 1;

    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type !== "message") continue;
      const msg = entry.message;
      if (msg.role !== "toolResult" || msg.toolName !== "todo") continue;

      const details = msg.details as TodoDetails | undefined;
      if (details) {
        todos = details.todos;
        nextId = details.nextId;
      }
    }
    updateWidget(ctx);
  };

  pi.on("session_start", async (_event, ctx) => reconstructState(ctx));
  pi.on("session_tree", async (_event, ctx) => reconstructState(ctx));

  // Tool: todo
  pi.registerTool({
    name: "todo",
    label: "Todo Planner",
    description:
      "Manage a plan checklist for multi-step processes. Use 'init' to declare planned steps, 'update' to mark progress (in_progress, completed, failed), and 'list' to inspect. Keeps user informed with live progress.",
    promptSnippet: "Create and update execution checklists during multi-step plans",
    promptGuidelines: [
      "When planning complex workflows or tasks with 3+ steps, use the todo tool with action: 'init' to define your steps.",
      "Update task status with action: 'update' (to 'in_progress' when starting, 'completed' when done, or 'failed' if an error occurs).",
      "This provides live progress tracking directly in the user's terminal interface.",
    ],
    parameters: TodoParams,

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      switch (params.action) {
        case "init": {
          const taskList = params.tasks || [];
          if (!Array.isArray(taskList) || taskList.length === 0) {
            return {
              content: [{ type: "text", text: "Error: 'tasks' array of strings is required for action: 'init'" }],
              details: { action: "init", todos, nextId, error: "tasks array required" },
            };
          }

          todos = taskList.map((t, idx) => ({
            id: idx + 1,
            text: t,
            status: idx === 0 ? "in_progress" : "pending",
          }));
          nextId = todos.length + 1;
          updateWidget(ctx);

          const listStr = todos.map((t) => `[${t.status}] #${t.id}: ${t.text}`).join("\n");
          return {
            content: [{ type: "text", text: `Initialized plan with ${todos.length} steps:\n${listStr}` }],
            details: { action: "init", todos: [...todos], nextId },
          };
        }

        case "add": {
          if (!params.text) {
            return {
              content: [{ type: "text", text: "Error: 'text' required for action: 'add'" }],
              details: { action: "add", todos: [...todos], nextId, error: "text required" },
            };
          }
          const newItem: TodoItem = {
            id: nextId++,
            text: params.text,
            status: "pending",
          };
          todos.push(newItem);
          updateWidget(ctx);

          return {
            content: [{ type: "text", text: `Added step #${newItem.id}: ${newItem.text}` }],
            details: { action: "add", todos: [...todos], nextId },
          };
        }

        case "update": {
          if (params.id === undefined) {
            return {
              content: [{ type: "text", text: "Error: 'id' required for action: 'update'" }],
              details: { action: "update", todos: [...todos], nextId, error: "id required" },
            };
          }
          const item = todos.find((t) => t.id === params.id);
          if (!item) {
            return {
              content: [{ type: "text", text: `Task #${params.id} not found.` }],
              details: { action: "update", todos: [...todos], nextId, error: "not_found" },
            };
          }

          if (params.status) {
            item.status = params.status;
          }
          if (params.text) {
            item.text = params.text;
          }
          updateWidget(ctx);

          return {
            content: [{ type: "text", text: `Task #${item.id} is now ${item.status}: ${item.text}` }],
            details: { action: "update", todos: [...todos], nextId },
          };
        }

        case "toggle": {
          if (params.id === undefined) {
            return {
              content: [{ type: "text", text: "Error: 'id' required for action: 'toggle'" }],
              details: { action: "toggle", todos: [...todos], nextId, error: "id required" },
            };
          }
          const item = todos.find((t) => t.id === params.id);
          if (!item) {
            return {
              content: [{ type: "text", text: `Task #${params.id} not found.` }],
              details: { action: "toggle", todos: [...todos], nextId, error: "not_found" },
            };
          }
          item.status = item.status === "completed" ? "pending" : "completed";
          updateWidget(ctx);

          return {
            content: [{ type: "text", text: `Task #${item.id} marked as ${item.status}.` }],
            details: { action: "toggle", todos: [...todos], nextId },
          };
        }

        case "list": {
          const listStr = todos.length
            ? todos.map((t) => `[${t.status}] #${t.id}: ${t.text}`).join("\n")
            : "No active tasks in plan.";
          return {
            content: [{ type: "text", text: listStr }],
            details: { action: "list", todos: [...todos], nextId },
          };
        }

        case "clear": {
          const count = todos.length;
          todos = [];
          nextId = 1;
          updateWidget(ctx);

          return {
            content: [{ type: "text", text: `Cleared ${count} tasks from plan.` }],
            details: { action: "clear", todos: [], nextId: 1 },
          };
        }

        default:
          return {
            content: [{ type: "text", text: `Unknown action: ${params.action}` }],
            details: { action: "list", todos: [...todos], nextId, error: "unknown_action" },
          };
      }
    },

    renderCall(args, theme) {
      let text = theme.fg("toolTitle", theme.bold("todo ")) + theme.fg("muted", args.action);
      if (args.tasks && Array.isArray(args.tasks)) {
        text += ` ${theme.fg("accent", `[${args.tasks.length} pasos]`)}`;
      } else if (args.text) {
        text += ` ${theme.fg("dim", `"${args.text}"`)}`;
      }
      if (args.id !== undefined) text += ` ${theme.fg("accent", `#${args.id}`)}`;
      if (args.status) text += ` → ${theme.fg("accent", args.status)}`;
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded }, theme) {
      const details = result.details as TodoDetails | undefined;
      if (!details) {
        const text = result.content[0];
        return new Text(text?.type === "text" ? text.text : "", 0, 0);
      }

      if (details.error) {
        return new Text(theme.fg("error", `Error: ${details.error}`), 0, 0);
      }

      const todoList = details.todos;
      if (todoList.length === 0) {
        return new Text(theme.fg("dim", "Plan vacío"), 0, 0);
      }

      const display = expanded ? todoList : todoList.slice(0, 5);
      const lines = [theme.fg("muted", `Plan (${todoList.filter((t) => t.status === "completed").length}/${todoList.length} completados):`)];

      for (const t of display) {
        let symbol: string;
        switch (t.status) {
          case "completed":
            symbol = theme.fg("success", "✓");
            break;
          case "in_progress":
            symbol = theme.fg("accent", "▶");
            break;
          case "failed":
            symbol = theme.fg("error", "✗");
            break;
          default:
            symbol = theme.fg("dim", "○");
        }
        lines.push(`${symbol} ${theme.fg("accent", `#${t.id}`)} ${t.status === "completed" ? theme.fg("dim", t.text) : theme.fg("text", t.text)}`);
      }

      if (!expanded && todoList.length > 5) {
        lines.push(theme.fg("dim", `... ${todoList.length - 5} pasos adicionales`));
      }

      return new Text(lines.join("\n"), 0, 0);
    },
  });

  // Command: /todos
  pi.registerCommand("todos", {
    description: "Ver el plan y la lista de tareas actual",
    handler: async (args, ctx) => {
      const sub = String(args || "").trim().toLowerCase();
      if (sub === "clear") {
        todos = [];
        nextId = 1;
        updateWidget(ctx);
        ctx.ui.notify("Plan y tareas limpiadas.", "info");
        return;
      }

      if (ctx.mode !== "tui") {
        const text = todos.length
          ? todos.map((t) => `[${t.status}] #${t.id}: ${t.text}`).join("\n")
          : "No hay tareas activas.";
        ctx.ui.notify(text, "info");
        return;
      }

      await ctx.ui.custom<void>((_tui, theme, _kb, done) => {
        return new TodoListComponent(todos, theme, () => done());
      });
    },
  });
}
