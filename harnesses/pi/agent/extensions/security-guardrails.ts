import { execFile } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

function sendDesktopNotification(title: string, body: string, icon = "dialog-warning"): void {
  const args = [
    "-a",
    "Pi Agent",
    "-u",
    "normal",
    "-i",
    icon,
    title,
    body,
  ];
  execFile("notify-send", args, () => {});
}

function truncate(str: string, maxLen = 180): string {
  const clean = String(str || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3) + "...";
}

/**
 * Check if a file path is a sensitive system file or private credential.
 */
function isSensitivePath(filePath: string): boolean {
  if (!filePath) return false;
  const resolved = path.resolve(filePath);
  const home = os.homedir();

  // 1. System security & password files
  if (
    resolved === "/etc/shadow" ||
    resolved === "/etc/gshadow" ||
    resolved === "/etc/sudoers" ||
    resolved.startsWith("/etc/sudoers.d/") ||
    resolved.startsWith("/etc/security/opasswd")
  ) {
    return true;
  }

  // 2. SSH private keys
  if (resolved.includes("/.ssh/")) {
    const base = path.basename(resolved);
    const nonSensitiveSsh = [
      "known_hosts",
      "known_hosts.old",
      "config",
      "authorized_keys",
    ];
    if (nonSensitiveSsh.includes(base) || base.endsWith(".pub")) {
      return false;
    }
    return true; // id_rsa, id_ed25519, etc.
  }

  // 3. GPG private keys
  if (
    resolved.includes("/.gnupg/private-keys-v1.d") ||
    resolved.includes("/.gnupg/secring.")
  ) {
    return true;
  }

  // 4. Dotenv secret files (.env, .env.local, .env.production, etc.)
  // Allow template/example files
  const baseName = path.basename(resolved);
  if (
    /^\.env(\.[a-zA-Z0-9_-]+)?$/.test(baseName) &&
    !baseName.includes("example") &&
    !baseName.includes("sample") &&
    !baseName.includes("template")
  ) {
    return true;
  }

  // 5. Cloud/CLI credentials & auth databases
  const sensitiveFiles = [
    path.join(home, ".aws", "credentials"),
    path.join(home, ".config", "gcloud", "credentials.db"),
    path.join(home, ".azure", "accessTokens.json"),
    path.join(home, ".vault-token"),
    path.join(home, ".netrc"),
    path.join(home, ".pi", "agent", "auth.json"),
    path.join(home, ".pi", "agent", "antigravity-accounts.json"),
  ];

  if (sensitiveFiles.some((f) => resolved === f)) {
    return true;
  }

  return false;
}

/**
 * Check if targetPath is outside current working directory.
 */
function isOutsideCwd(targetPath: string, currentCwd: string): boolean {
  if (!targetPath) return false;
  const resolvedTarget = path.resolve(currentCwd, targetPath);
  const resolvedCwd = path.resolve(currentCwd);
  const relative = path.relative(resolvedCwd, resolvedTarget);
  return relative.startsWith("..") || path.isAbsolute(relative);
}

/**
 * Parse a bash command to check if it attempts to delete or alter files outside cwd.
 */
function checkDestructiveBashCommand(command: string, currentCwd: string): { isDestructive: boolean; target?: string } {
  const deleteRegex = /\b(rm|unlink|rmdir)\s+([^;&|\n]+)/g;
  let match: RegExpExecArray | null;

  while ((match = deleteRegex.exec(command)) !== null) {
    const rawArgs = match[2].trim();
    const tokens = rawArgs.split(/\s+/).filter((t) => !t.startsWith("-"));

    for (const token of tokens) {
      // Clean quotes
      const cleanToken = token.replace(/^["']|["']$/g, "");
      // Resolve path (handling home directory ~)
      let resolvedTarget: string;
      if (cleanToken.startsWith("~/") || cleanToken === "~") {
        resolvedTarget = path.resolve(os.homedir(), cleanToken.slice(cleanToken === "~" ? 1 : 2));
      } else {
        resolvedTarget = path.resolve(currentCwd, cleanToken);
      }

      if (isOutsideCwd(resolvedTarget, currentCwd)) {
        return { isDestructive: true, target: resolvedTarget };
      }
    }
  }

  return { isDestructive: false };
}

// In-memory set of directories explicitly allowed for this Pi session only
const sessionAllowedDirectories = new Set<string>();

function isPathInAllowedSessionDirectory(targetPath: string): boolean {
  for (const allowedDir of sessionAllowedDirectories) {
    const rel = path.relative(allowedDir, targetPath);
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
      return true;
    }
  }
  return false;
}

export default function (pi: ExtensionAPI) {
  // Reset allowed session paths when session starts/restarts
  pi.on("session_start", async () => {
    sessionAllowedDirectories.clear();
  });

  pi.on("tool_call", async (event, ctx) => {
    const currentCwd = path.resolve(process.cwd());

    // =========================================================================
    // 1. READ PROTECTION: Block sensitive system files and credentials
    // =========================================================================
    if (event.toolName === "read") {
      const readPath = (event.input as { path?: string })?.path || "";
      const resolvedReadPath = path.resolve(currentCwd, readPath);

      if (isSensitivePath(resolvedReadPath)) {
        const msg = `Access denied: File '${readPath}' is classified as a sensitive system file or private credential and cannot be read.`;
        ctx.ui?.notify(msg, "warning");
        sendDesktopNotification(
          "🛡️ Read blocked",
          `Read attempt blocked for sensitive file:\n${truncate(resolvedReadPath, 150)}`,
          "dialog-error"
        );
        return {
          block: true,
          reason: msg,
        };
      }
      return undefined;
    }

    // =========================================================================
    // 2. WRITE & EDIT PROTECTION: Ask confirmation if outside current cwd
    // =========================================================================
    if (event.toolName === "write" || event.toolName === "edit") {
      const targetPath = (event.input as { path?: string })?.path || "";
      const resolvedTarget = path.resolve(currentCwd, targetPath);

      if (isOutsideCwd(resolvedTarget, currentCwd)) {
        // Check if path belongs to a directory already authorized for this session
        if (isPathInAllowedSessionDirectory(resolvedTarget)) {
          return undefined;
        }

        const action = event.toolName === "write" ? "create or overwrite" : "edit";
        const targetDir = path.dirname(resolvedTarget);
        const folderName = path.basename(targetDir);

        // Send desktop notification immediately
        sendDesktopNotification(
          "⚠️ Permission required to modify external file",
          `Pi requests to ${action} file:\n${truncate(resolvedTarget, 150)}`,
          "dialog-warning"
        );

        if (ctx.hasUI) {
          const promptTitle = `⚠️ Permission required outside project (${event.toolName})\nFile: ${resolvedTarget}`;
          const choice = await ctx.ui.select(promptTitle, [
            "1. Allow only this file",
            `2. Allow future files in '${folderName}/' during this session`,
            "3. Deny / Cancel action",
          ]);

          // Option 1: Allow once for this specific file
          if (choice?.startsWith("1.")) {
            ctx.ui.notify(`Permission granted for this file: ${path.basename(resolvedTarget)}`, "info");
            return undefined;
          }

          // Option 2: Allow all future files in this directory for this session (with secondary confirmation)
          if (choice?.startsWith("2.")) {
            const confirmedDir = await ctx.ui.confirm(
              "Confirm folder authorization for this session?",
              `Do you authorize Pi to create and edit files inside:\n\n${targetDir}\n\nand all its subfolders for the remainder of this session without prompting again?`
            );

            if (confirmedDir) {
              sessionAllowedDirectories.add(targetDir);
              ctx.ui.notify(`✅ Folder authorized for the session: ${targetDir}`, "info");
              sendDesktopNotification(
                "✅ Folder authorized for session",
                `Unrestricted writes allowed in:\n${truncate(targetDir, 150)}`,
                "dialog-information"
              );
              return undefined;
            } else {
              ctx.ui.notify("Folder authorization cancelled.", "info");
              return {
                block: true,
                reason: `Action cancelled by user: Folder authorization rejected for session.`,
              };
            }
          }

          // Option 3 / Cancel / Escape
          ctx.ui.notify(`Operation cancelled: Modification denied for ${resolvedTarget}`, "info");
          return {
            block: true,
            reason: `Action cancelled by user: No permission granted to ${action} file '${resolvedTarget}' outside project root.`,
          };
        } else {
          return {
            block: true,
            reason: `Operation blocked: Modifying outside project root '${resolvedTarget}' denied in non-interactive mode.`,
          };
        }
      }
      return undefined;
    }

    // =========================================================================
    // 3. DELETE / DESTRUCTIVE COMMAND PROTECTION: Confirm rm outside cwd
    // =========================================================================
    if (event.toolName === "bash") {
      const command = (event.input as { command?: string })?.command || "";
      const { isDestructive, target } = checkDestructiveBashCommand(command, currentCwd);

      if (isDestructive && target) {
        if (isPathInAllowedSessionDirectory(target)) {
          return undefined;
        }

        const title = "⚠️ Permission to delete files outside project root";
        const details = `Bash command attempts to delete or alter files outside current directory.\n\nCommand: ${command}\nAffected target: ${target}\nWorking directory: ${currentCwd}`;

        // Send desktop notification immediately
        sendDesktopNotification(
          "⚠️ Permission to delete outside project",
          `Pi requests execution of:\n${truncate(command, 150)}`,
          "dialog-warning"
        );

        if (ctx.hasUI) {
          const confirmed = await ctx.ui.confirm(title, details);
          if (!confirmed) {
            ctx.ui.notify(`Command cancelled by user.`, "info");
            return {
              block: true,
              reason: `Command cancelled by user: Permission denied to delete files outside working directory (${target}).`,
            };
          }
        } else {
          return {
            block: true,
            reason: `Command blocked: Deletion outside working directory '${target}' disallowed without interactive confirmation.`,
          };
        }
      }
      return undefined;
    }

    return undefined;
  });

  // Command: /permissions
  pi.registerCommand("permissions", {
    description: "View or revoke external directory authorizations for this session (/permissions [clear])",
    handler: async (args, ctx) => {
      const sub = String(args || "").trim().toLowerCase();
      if (sub === "clear") {
        const count = sessionAllowedDirectories.size;
        sessionAllowedDirectories.clear();
        ctx.ui.notify(`Revoked ${count} session directory authorization(s).`, "info");
        return;
      }

      if (sessionAllowedDirectories.size === 0) {
        ctx.ui.notify("No external directories are authorized for this session.", "info");
        return;
      }

      const lines = ["📂 AUTHORIZED EXTERNAL DIRECTORIES FOR THIS SESSION:"];
      for (const dir of sessionAllowedDirectories) {
        lines.push(`• ${dir} (and subdirectories)`);
      }
      lines.push("\nUse '/permissions clear' to revoke all authorizations.");
      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}
