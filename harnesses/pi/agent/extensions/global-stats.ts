import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface GlobalStatsData {
  firstSeenDate: string;
  activeDates: string[];
  totalSessions: number;
  totalTurns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheHits: number;
  totalCommits: number;
  agentUsage: Record<string, number>;
  toolUsage: Record<string, number>;
}

const STATS_FILE_PATH = path.join(os.homedir(), ".pi", "agent", "global-stats.json");

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadGlobalStats(): GlobalStatsData {
  try {
    if (fs.existsSync(STATS_FILE_PATH)) {
      const raw = fs.readFileSync(STATS_FILE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    void err;
  }
  return {
    firstSeenDate: new Date().toISOString(),
    activeDates: [getTodayString()],
    totalSessions: 0,
    totalTurns: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheHits: 0,
    totalCommits: 0,
    agentUsage: {},
    toolUsage: {},
  };
}

function saveGlobalStats(data: GlobalStatsData): void {
  try {
    const dir = path.dirname(STATS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    void err;
  }
}

export default function (pi: ExtensionAPI) {
  let stats = loadGlobalStats();

  // Track session start
  pi.on("session_start", async () => {
    stats.totalSessions++;
    const today = getTodayString();
    if (!stats.activeDates.includes(today)) {
      stats.activeDates.push(today);
    }
    saveGlobalStats(stats);
  });

  // Track turns and agent usage
  pi.on("turn_start", async () => {
    stats.totalTurns++;
    saveGlobalStats(stats);
  });

  // Track tool calls
  pi.on("tool_call", async (event) => {
    stats.toolUsage[event.toolName] = (stats.toolUsage[event.toolName] || 0) + 1;
    saveGlobalStats(stats);
  });

  // Track token usage from assistant responses
  pi.on("message_end", async (event) => {
    const msg = event.message;
    if (msg.role === "assistant" && (msg as { usage?: { input?: number; output?: number; cacheRead?: number } }).usage) {
      const u = (msg as { usage: { input?: number; output?: number; cacheRead?: number } }).usage;
      if (u.input) stats.totalInputTokens += u.input;
      if (u.output) stats.totalOutputTokens += u.output;
      if (u.cacheRead) stats.totalCacheHits += u.cacheRead;
      saveGlobalStats(stats);
    }
  });

  // Command: /status and /stats
  const statusHandler = async (_args: string, ctx: { ui: { notify: (msg: string, type?: "info" | "warning" | "error") => void } }) => {
    const totalDays = stats.activeDates.length;
    const firstDate = stats.firstSeenDate.slice(0, 10);
    const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
    const cacheSavingsRatio =
      totalTokens > 0 ? ((stats.totalCacheHits / (totalTokens + stats.totalCacheHits)) * 100).toFixed(1) : "0.0";

    const topTools = Object.entries(stats.toolUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tool, count]) => `${tool}: ${count}`)
      .join(" • ");

    const lines = [
      "╔══════════════════════════════════════════════════════════════════════╗",
      "║                 📊 PI CODING AGENT GLOBAL STATUS                     ║",
      "╠══════════════════════════════════════════════════════════════════════╣",
      `║ 📅 First seen : ${firstDate.padEnd(20)} │ ⏱️ Active days : ${String(totalDays).padEnd(16)}║`,
      `║ 🚀 Sessions   : ${String(stats.totalSessions).padEnd(20)} │ 🔄 Total turns : ${String(stats.totalTurns).padEnd(16)}║`,
      "╠──────────────────────────────────────────────────────────────────────╣",
      "║ 🧠 CONTEXT & TOKEN CONSUMPTION                                       ║",
      `║ • Input Tokens   : ${String(stats.totalInputTokens.toLocaleString()).padEnd(50)}║`,
      `║ • Output Tokens  : ${String(stats.totalOutputTokens.toLocaleString()).padEnd(50)}║`,
      `║ • Cache Hits     : ${String(stats.totalCacheHits.toLocaleString()).padEnd(50)}║`,
      `║ • Cache Savings  : ${cacheSavingsRatio}% recycled context`.padEnd(71) + "║",
      "╠──────────────────────────────────────────────────────────────────────╣",
      "║ 🛠️ MOST FREQUENT TOOLS                                                ║",
      `║ ${topTools.slice(0, 68).padEnd(68)} ║`,
      "╚══════════════════════════════════════════════════════════════════════╝",
    ];

    ctx.ui.notify(lines.join("\n"), "info");
  };

  pi.registerCommand("status", {
    description: "Show global metrics and session status",
    handler: statusHandler,
  });

  pi.registerCommand("stats", {
    description: "Show cumulative global Pi statistics",
    handler: statusHandler,
  });
}
