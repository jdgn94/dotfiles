import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { StringEnum, Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const AGENTS_DIR = path.join(os.homedir(), ".pi", "agent", "agents");

interface AgentSpec {
  name: string;
  description: string;
  filePath: string;
  tools?: string[];
  systemPrompt: string;
}

let activeAgentName = "orchestrator";

function parseAgentMarkdown(filePath: string): AgentSpec | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return null;

    const rawFront = match[1];
    const systemPrompt = match[2].trim();

    let name = path.basename(filePath, ".md");
    let description = "";
    let tools: string[] = [];

    for (const line of rawFront.split(/\r?\n/)) {
      const nameM = line.match(/^name:\s*(.+)$/);
      if (nameM) name = nameM[1].trim().replace(/^["']|["']$/g, "");

      const descM = line.match(/^description:\s*(.+)$/);
      if (descM) description = descM[1].trim().replace(/^["']|["']$/g, "");

      const toolsM = line.match(/^tools:\s*(.+)$/);
      if (toolsM) {
        tools = toolsM[1].split(",").map((t) => t.trim().toLowerCase());
      }
    }

    return { name, description, filePath, tools, systemPrompt };
  } catch {
    return null;
  }
}

function loadAllAgents(): Map<string, AgentSpec> {
  const map = new Map<string, AgentSpec>();
  if (!fs.existsSync(AGENTS_DIR)) return map;

  const entries = fs.readdirSync(AGENTS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const parsed = parseAgentMarkdown(path.join(AGENTS_DIR, entry.name));
      if (parsed) {
        map.set(parsed.name, parsed);
        // Common aliases
        if (parsed.name === "security-auditor") map.set("hacker", parsed);
        if (parsed.name === "spec-planner") map.set("planner", parsed);
        if (parsed.name === "orchestrator") map.set("executor", parsed);
        if (parsed.name === "code-reviewer") map.set("reviewer", parsed);
        if (parsed.name === "test-engineer") map.set("tester", parsed);
        if (parsed.name === "researcher") map.set("scout", parsed);
      }
    }
  }
  return map;
}

function notifyAgentSwitched(agentName: string): void {
  const args = [
    "-a",
    "Pi Agent",
    "-u",
    "normal",
    "-i",
    "dialog-information",
    `🤖 Agente Activo: ${agentName}`,
    `El rol de la sesión ha cambiado a ${agentName}.`,
  ];
  execFile("notify-send", args, () => {});
}

function updateAgentStatusBadge(ctx?: ExtensionContext): void {
  if (!ctx || !ctx.hasUI) return;
  let modeBadge = "";
  if (activeAgentName === "security-auditor" || activeAgentName === "spec-planner" || activeAgentName === "doc-updater") {
    modeBadge = " [.md only]";
  } else if (activeAgentName === "code-reviewer" || activeAgentName === "researcher") {
    modeBadge = " [Read-only]";
  } else if (activeAgentName === "test-engineer") {
    modeBadge = " [Tests only]";
  } else {
    modeBadge = " [Full access]";
  }
  ctx.ui.setStatus("agent-role", `🤖 Agent: ${activeAgentName}${modeBadge}`);
}

export default function (pi: ExtensionAPI) {
  // Update status badge on session start
  pi.on("session_start", async (_event, ctx) => {
    updateAgentStatusBadge(ctx);
  });

  // Inject active agent system prompt / guidelines before turn
  pi.on("before_agent_start", async (_event) => {
    const agents = loadAllAgents();
    const current = agents.get(activeAgentName);
    if (!current) return undefined;

    return {
      systemPromptOptions: {
        guidelines: [
          `### 🤖 Active Persona: ${current.name.toUpperCase()}`,
          current.description,
          "",
          current.systemPrompt,
        ],
      },
    };
  });

  // =========================================================================
  // RUNTIME PERMISSION ENFORCEMENT BASED ON ACTIVE AGENT ROLE
  // =========================================================================
  pi.on("tool_call", async (event) => {
    const agent = activeAgentName;

    // 1. security-auditor, spec-planner, doc-updater: ONLY .md files allowed
    if (agent === "security-auditor" || agent === "spec-planner" || agent === "doc-updater") {
      if (event.toolName === "write" || event.toolName === "edit") {
        const filePath = String((event.input as { path?: string })?.path || "").toLowerCase();
        const isMarkdown = filePath.endsWith(".md") || filePath.endsWith(".markdown");

        if (!isMarkdown) {
          const reason = `[Role Access Denied]: Active agent '${agent}' is strictly restricted to markdown documentation files (.md). Attempted modification of '${filePath}' blocked.`;
          return {
            block: true,
            reason,
          };
        }
      }
    }

    // 2. code-reviewer & researcher: STRICTLY READ-ONLY
    if (agent === "code-reviewer" || agent === "researcher") {
      if (event.toolName === "write" || event.toolName === "edit") {
        return {
          block: true,
          reason: `[Role Access Denied]: Active agent '${agent}' is strictly read-only and cannot modify files.`,
        };
      }
    }

    // 3. test-engineer: WRITE ONLY TO TEST FILES / DIRECTORIES
    if (agent === "test-engineer") {
      if (event.toolName === "write" || event.toolName === "edit") {
        const filePath = String((event.input as { path?: string })?.path || "");
        const isTestFile = /(tests?\/|__tests__\/|\.(test|spec)\.[a-zA-Z0-9]+$)/i.test(filePath);

        if (!isTestFile) {
          return {
            block: true,
            reason: `[Role Access Denied]: 'test-engineer' is only authorized to modify test suites (under tests/, __tests__/ or *.test.* / *.spec.* files). Modification of '${filePath}' blocked.`,
          };
        }
      }
    }

    return undefined;
  });

  // Tool: delegate_agent (for agents to invoke other subagents in clean background context)
  pi.registerTool({
    name: "delegate_agent",
    label: "Delegate to Agent",
    description: "Launch a specialized agent (orchestrator, security-auditor, spec-planner, code-reviewer, researcher, test-engineer, build-error-resolver, code-simplifier, doc-updater) in a clean background context and return its synthesis.",
    promptSnippet: "Delegate analysis or specialized work to another agent",
    parameters: Type.Object({
      agent: Type.String({
        description: "Name of target agent (e.g. security-auditor, spec-planner, build-error-resolver)",
      }),
      task: Type.String({
        description: "Exact task and context to hand off to the specialist agent",
      }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const agents = loadAllAgents();
      const target = agents.get(params.agent.toLowerCase());
      if (!target) {
        return {
          content: [{ type: "text", text: `Error: Agent '${params.agent}' not found in ~/.pi/agent/agents/` }],
          details: { error: "not_found" },
        };
      }

      ctx.ui?.notify(`Invoking subagent '${target.name}' in background...`, "info");

      // Execute via subagent tool if available or executeTool
      try {
        const result = await ctx.executeTool("subagent", {
          agent: target.name,
          task: params.task,
        });
        return result;
      } catch (err: unknown) {
        return {
          content: [{ type: "text", text: `Delegation to '${target.name}' failed: ${String(err)}` }],
          details: { error: String(err) },
        };
      }
    },
  });

  // Command: /agent [name|list]
  pi.registerCommand("agent", {
    description: "Switch or inspect active specialized agents (/agent [name|list])",
    handler: async (args, ctx) => {
      const sub = String(args || "").trim().toLowerCase();
      const agents = loadAllAgents();

      if (!sub || sub === "list") {
        const unique = new Map<string, AgentSpec>();
        for (const spec of agents.values()) {
          unique.set(spec.name, spec);
        }

        const lines = ["🤖 AVAILABLE SPECIALIZED AGENTS:"];
        for (const [name, spec] of unique.entries()) {
          const isCurrent = name === activeAgentName ? " (ACTIVE)" : "";
          lines.push(`• **${name}**${isCurrent}: ${spec.description}`);
        }
        lines.push(`\nCurrent active agent: **${activeAgentName}**. Use '/agent <name>' to switch.`);
        ctx.ui.notify(lines.join("\n"), "info");
        return;
      }

      const target = agents.get(sub);
      if (!target) {
        ctx.ui.notify(`Agent '${sub}' does not exist. Use '/agent' to view available list.`, "warning");
        return;
      }

      activeAgentName = target.name;
      updateAgentStatusBadge(ctx);
      notifyAgentSwitched(target.name);
      ctx.ui.notify(`Active agent switched to: **${target.name}**\n${target.description}`, "info");
    },
  });
}
