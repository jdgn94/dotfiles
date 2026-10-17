import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface MemoryItem {
  id: number;
  text: string;
  createdAt: string;
}

interface MemoryStore {
  items: MemoryItem[];
  nextId: number;
}

const GLOBAL_MEMORY_PATH = path.join(os.homedir(), ".pi", "agent", "memory.json");

function loadStore(filePath: string): MemoryStore {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw);
    }
  } catch {}
  return { items: [], nextId: 1 };
}

function saveStore(filePath: string, store: MemoryStore): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error(`[persistent-memory] Error saving to ${filePath}:`, err);
  }
}

function getProjectMemoryPath(cwd: string): string | null {
  // Check if inside a git repository or project
  let current = path.resolve(cwd);
  const root = path.parse(current).root;

  while (current && current !== root) {
    if (fs.existsSync(path.join(current, ".git")) || fs.existsSync(path.join(current, ".pi"))) {
      return path.join(current, ".pi", "memory.json");
    }
    current = path.dirname(current);
  }
  return null;
}

export default function (pi: ExtensionAPI) {
  // Automatically inject active memories into prompt guidelines at each turn start
  pi.on("before_agent_start", async (_event) => {
    const cwd = process.cwd();
    const globalStore = loadStore(GLOBAL_MEMORY_PATH);
    const projPath = getProjectMemoryPath(cwd);
    const projStore = projPath ? loadStore(projPath) : { items: [], nextId: 1 };

    if (globalStore.items.length === 0 && projStore.items.length === 0) {
      return undefined;
    }

    const memoryLines: string[] = [];

    if (globalStore.items.length > 0) {
      memoryLines.push("GLOBAL PREFERENCES (User-wide rules):");
      for (const item of globalStore.items) {
        memoryLines.push(`- ${item.text}`);
      }
    }

    if (projStore.items.length > 0) {
      memoryLines.push("PROJECT RULES (Repository-specific rules):");
      for (const item of projStore.items) {
        memoryLines.push(`- ${item.text}`);
      }
    }

    return {
      systemPromptOptions: {
        guidelines: [
          "### 🧠 Persistent Memories & Explicit Directives",
          ...memoryLines,
        ],
      },
    };
  });

  // Command: /remember [global|project] <text>
  pi.registerCommand("remember", {
    description: "Guardar una memoria o preferencia persistente (/remember [global|project] <texto>)",
    handler: async (args, ctx) => {
      const raw = String(args || "").trim();
      if (!raw) {
        ctx.ui.notify("Uso: /remember [global|project] <regla o preferencia>", "warning");
        return;
      }

      let scope: "global" | "project" = "project";
      let text = raw;

      if (raw.toLowerCase().startsWith("global ")) {
        scope = "global";
        text = raw.slice(7).trim();
      } else if (raw.toLowerCase().startsWith("project ")) {
        scope = "project";
        text = raw.slice(8).trim();
      } else {
        // Auto-detect: if no git root found, default to global
        if (!getProjectMemoryPath(process.cwd())) {
          scope = "global";
        }
      }

      const targetPath = scope === "global" ? GLOBAL_MEMORY_PATH : getProjectMemoryPath(process.cwd()) || GLOBAL_MEMORY_PATH;
      const store = loadStore(targetPath);
      const newItem: MemoryItem = {
        id: store.nextId++,
        text,
        createdAt: new Date().toISOString(),
      };
      store.items.push(newItem);
      saveStore(targetPath, store);

      ctx.ui.notify(`🧠 Memoria ${scope.toUpperCase()} guardada (#${newItem.id}): "${text}"`, "info");
    },
  });

  // Command: /memory [clear [global|project] [id]]
  pi.registerCommand("memory", {
    description: "Ver o gestionar las memorias persistentes (/memory [clear [global|project]])",
    handler: async (args, ctx) => {
      const sub = String(args || "").trim().toLowerCase();
      const cwd = process.cwd();
      const projPath = getProjectMemoryPath(cwd);

      if (sub.startsWith("clear")) {
        const parts = sub.split(/\s+/);
        const targetScope = parts[1]; // 'global' or 'project'
        const itemId = parts[2] ? parseInt(parts[2], 10) : undefined;

        if (targetScope === "global") {
          const store = loadStore(GLOBAL_MEMORY_PATH);
          if (itemId !== undefined && !isNaN(itemId)) {
            store.items = store.items.filter((i) => i.id !== itemId);
            saveStore(GLOBAL_MEMORY_PATH, store);
            ctx.ui.notify(`Memoria global #${itemId} eliminada.`, "info");
          } else {
            saveStore(GLOBAL_MEMORY_PATH, { items: [], nextId: 1 });
            ctx.ui.notify("Todas las memorias globales fueron eliminadas.", "info");
          }
          return;
        } else if (targetScope === "project" && projPath) {
          const store = loadStore(projPath);
          if (itemId !== undefined && !isNaN(itemId)) {
            store.items = store.items.filter((i) => i.id !== itemId);
            saveStore(projPath, store);
            ctx.ui.notify(`Memoria de proyecto #${itemId} eliminada.`, "info");
          } else {
            saveStore(projPath, { items: [], nextId: 1 });
            ctx.ui.notify("Todas las memorias del proyecto fueron eliminadas.", "info");
          }
          return;
        } else {
          ctx.ui.notify("Uso: /memory clear [global|project] [id]", "warning");
          return;
        }
      }

      // Display memories
      const globalStore = loadStore(GLOBAL_MEMORY_PATH);
      const projStore = projPath ? loadStore(projPath) : { items: [], nextId: 1 };

      const lines: string[] = ["🧠 MEMORIAS PERSISTENTES ACTIVAS:"];

      lines.push("\n🌐 Globales (~/.pi/agent/memory.json):");
      if (globalStore.items.length === 0) {
        lines.push("  (Sin memorias globales guardadas)");
      } else {
        for (const item of globalStore.items) {
          lines.push(`  [#${item.id}] ${item.text}`);
        }
      }

      lines.push("\n📁 Proyecto (.pi/memory.json):");
      if (projStore.items.length === 0) {
        lines.push("  (Sin memorias de proyecto guardadas)");
      } else {
        for (const item of projStore.items) {
          lines.push(`  [#${item.id}] ${item.text}`);
        }
      }

      lines.push("\nUsa '/remember [global|project] <texto>' para guardar, o '/memory clear [global|project]' para borrar.");

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}
