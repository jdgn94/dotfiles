import { execFile, execSync } from "node:child_process";
import * as path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface FileChangeStats {
  path: string;
  added: number;
  deleted: number;
  status: string; // 'M', 'A', 'D', '?'
}

interface SessionGitState {
  touchedFiles: Set<string>;
  initialCommitHash: string | null;
  commitsCreated: number;
  initialCheckpoint: string | null;
}

let sessionState: SessionGitState = {
  touchedFiles: new Set<string>(),
  initialCommitHash: null,
  commitsCreated: 0,
  initialCheckpoint: null,
};

function isGitRepo(cwd: string): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", { cwd, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getCurrentCommit(cwd: string): string | null {
  try {
    return execSync("git rev-parse HEAD", { cwd, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function emitWakaTimeHeartbeat(filePath: string, cwd: string): void {
  try {
    const fullPath = path.resolve(cwd, filePath);
    execFile("wakatime-cli", ["--entity", fullPath, "--write"], (err) => {
      // Silently ignore if wakatime is not configured
    });
  } catch {}
}

function getSessionGitDiff(cwd: string): { files: FileChangeStats[]; totalAdded: number; totalDeleted: number } {
  if (!isGitRepo(cwd)) {
    return { files: [], totalAdded: 0, totalDeleted: 0 };
  }

  const results: FileChangeStats[] = [];
  let totalAdded = 0;
  let totalDeleted = 0;

  try {
    // 1. Get porcelain status to check which files are still uncommitted/modified
    const statusOutput = execSync("git status --porcelain", { cwd, encoding: "utf8" });
    const statusMap = new Map<string, string>();

    for (const line of statusOutput.split("\n")) {
      if (!line.trim()) continue;
      const code = line.slice(0, 2).trim();
      const relPath = line.slice(3).trim().replace(/^["']|["']$/g, "");
      statusMap.set(relPath, code);
    }

    // 2. Get numstat for line additions/deletions
    let numstatOutput = "";
    try {
      numstatOutput = execSync("git diff --numstat HEAD", { cwd, encoding: "utf8" });
    } catch {
      // In case repo has no commits yet
      numstatOutput = execSync("git diff --numstat", { cwd, encoding: "utf8" });
    }

    const numstatMap = new Map<string, { added: number; deleted: number }>();
    for (const line of numstatOutput.split("\n")) {
      const parts = line.split(/\t+/);
      if (parts.length >= 3) {
        const added = parseInt(parts[0], 10) || 0;
        const deleted = parseInt(parts[1], 10) || 0;
        const file = parts[2].trim();
        numstatMap.set(file, { added, deleted });
      }
    }

    // 3. Filter touched files that still have uncommitted working-tree changes
    // If a file was committed and clean, it naturally is NOT in statusMap, so it disappears!
    for (const touched of sessionState.touchedFiles) {
      if (statusMap.has(touched)) {
        const stats = numstatMap.get(touched) || { added: 0, deleted: 0 };
        results.push({
          path: touched,
          status: statusMap.get(touched) || "M",
          added: stats.added,
          deleted: stats.deleted,
        });
        totalAdded += stats.added;
        totalDeleted += stats.deleted;
      }
    }
  } catch (err) {
    // Graceful fallback
  }

  return { files: results, totalAdded, totalDeleted };
}

function updateGitWidget(ctx?: ExtensionContext): void {
  if (!ctx || !ctx.hasUI) return;
  const cwd = process.cwd();
  if (!isGitRepo(cwd)) {
    ctx.ui.setWidget("git-session-tracker", undefined);
    return;
  }

  const { files, totalAdded, totalDeleted } = getSessionGitDiff(cwd);

  if (files.length === 0 && sessionState.commitsCreated === 0) {
    ctx.ui.setWidget("git-session-tracker", undefined);
    return;
  }

  const lines: string[] = [];
  const header = `📂 Cambios Git de Sesión (${files.length} pendientes | +${totalAdded}/-${totalDeleted} líneas):`;
  lines.push(header);

  for (const f of files.slice(0, 4)) {
    const changeBadge = `+${f.added}/-${f.deleted}`;
    lines.push(`  ${f.status} ${f.path} (${changeBadge})`);
  }

  if (files.length > 4) {
    lines.push(`  ... y ${files.length - 4} archivo(s) más (/diff para ver)`);
  }

  if (sessionState.commitsCreated > 0) {
    lines.push(`  ✨ ${sessionState.commitsCreated} commit(s) realizados en esta sesión`);
  }

  ctx.ui.setWidget("git-session-tracker", lines, { placement: "belowEditor" });
}

export default function (pi: ExtensionAPI) {
  // Initialize state on session start
  pi.on("session_start", async (_event, ctx) => {
    const cwd = process.cwd();
    sessionState.touchedFiles.clear();
    sessionState.commitsCreated = 0;
    sessionState.initialCommitHash = isGitRepo(cwd) ? getCurrentCommit(cwd) : null;

    // Create an automatic safety checkpoint if in git repo
    if (isGitRepo(cwd)) {
      try {
        const checkpoint = execSync("git stash create 'Pi Session Auto-Checkpoint'", { cwd, encoding: "utf8" }).trim();
        sessionState.initialCheckpoint = checkpoint || null;
      } catch {}
    }

    updateGitWidget(ctx);
  });

  // Track file modifications
  pi.on("tool_result", async (event, ctx) => {
    const cwd = process.cwd();
    if (!isGitRepo(cwd)) return;

    if (event.toolName === "write" || event.toolName === "edit") {
      const targetPath = String((event.input as { path?: string })?.path || "");
      if (targetPath) {
        const rel = path.relative(cwd, path.resolve(cwd, targetPath));
        if (!rel.startsWith("..")) {
          sessionState.touchedFiles.add(rel);
          emitWakaTimeHeartbeat(rel, cwd);
          updateGitWidget(ctx);
        }
      }
    }

    // Detect if git commit was run in bash tool
    if (event.toolName === "bash") {
      const cmd = String((event.input as { command?: string })?.command || "");
      if (/\bgit\s+(commit|merge|rebase)\b/.test(cmd)) {
        sessionState.commitsCreated++;
        updateGitWidget(ctx);
      }
    }
  });

  // Command: /diff
  pi.registerCommand("diff", {
    description: "Ver el diff coloreado de los cambios realizados por esta sesión",
    handler: async (_args, ctx) => {
      const cwd = process.cwd();
      if (!isGitRepo(cwd)) {
        ctx.ui.notify("No estás dentro de un repositorio Git.", "warning");
        return;
      }

      try {
        const diff = execSync("git diff HEAD", { cwd, encoding: "utf8" });
        if (!diff.trim()) {
          ctx.ui.notify("No hay cambios no commiteados en el repositorio.", "info");
          return;
        }
        ctx.ui.notify(diff.slice(0, 4000) + (diff.length > 4000 ? "\n\n... (diff truncado)" : ""), "info");
      } catch (err: unknown) {
        ctx.ui.notify(`Error al obtener git diff: ${String(err)}`, "error");
      }
    },
  });

  // Command: /rollback
  pi.registerCommand("rollback", {
    description: "Revertir todos los cambios realizados en esta sesión al estado inicial",
    handler: async (_args, ctx) => {
      const cwd = process.cwd();
      if (!isGitRepo(cwd)) {
        ctx.ui.notify("No estás en un repositorio Git.", "warning");
        return;
      }

      const confirmed = await ctx.ui.confirm(
        "¿Confirmar Rollback de la Sesión?",
        "Esto descartará los cambios no commiteados en los archivos modificados por la sesión."
      );

      if (!confirmed) {
        ctx.ui.notify("Rollback cancelado.", "info");
        return;
      }

      try {
        execSync("git restore .", { cwd });
        sessionState.touchedFiles.clear();
        updateGitWidget(ctx);
        ctx.ui.notify("✅ Rollback completado: El árbol de trabajo fue restaurado.", "info");
      } catch (err: unknown) {
        ctx.ui.notify(`Fallo al ejecutar rollback: ${String(err)}`, "error");
      }
    },
  });
}
