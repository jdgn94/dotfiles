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
        const msg = `Acceso denegado: El archivo '${readPath}' está clasificado como sensible del sistema o credencial y no puede ser leído.`;
        ctx.ui?.notify(msg, "warning");
        sendDesktopNotification(
          "🛡️ Lectura bloqueada",
          `Intento de lectura bloqueado a archivo sensible:\n${truncate(resolvedReadPath, 150)}`,
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

        const action = event.toolName === "write" ? "crear o sobrescribir" : "editar";
        const targetDir = path.dirname(resolvedTarget);
        const folderName = path.basename(targetDir);

        // Send desktop notification immediately
        sendDesktopNotification(
          "⚠️ Permiso para modificar archivo externo",
          `Pi solicita ${action} el archivo:\n${truncate(resolvedTarget, 150)}`,
          "dialog-warning"
        );

        if (ctx.hasUI) {
          const promptTitle = `⚠️ Permiso requerido fuera del proyecto (${event.toolName})\nArchivo: ${resolvedTarget}`;
          const choice = await ctx.ui.select(promptTitle, [
            "1. Permitir solo este archivo",
            `2. Permitir archivos futuros en '${folderName}/' durante esta sesión`,
            "3. Denegar / Cancelar acción",
          ]);

          // Option 1: Allow once for this specific file
          if (choice?.startsWith("1.")) {
            ctx.ui.notify(`Permiso concedido para este archivo: ${path.basename(resolvedTarget)}`, "info");
            return undefined;
          }

          // Option 2: Allow all future files in this directory for this session (with secondary confirmation)
          if (choice?.startsWith("2.")) {
            const confirmedDir = await ctx.ui.confirm(
              "¿Confirmar autorización de carpeta para la sesión?",
              `¿Autorizas que Pi pueda crear y editar cualquier archivo dentro de:\n\n${targetDir}\n\ny todas sus subcarpetas durante el resto de esta sesión sin volver a pedir confirmación?`
            );

            if (confirmedDir) {
              sessionAllowedDirectories.add(targetDir);
              ctx.ui.notify(`✅ Carpeta autorizada para el resto de la sesión: ${targetDir}`, "info");
              sendDesktopNotification(
                "✅ Carpeta autorizada para la sesión",
                `Escritura permitida sin confirmación en:\n${truncate(targetDir, 150)}`,
                "dialog-information"
              );
              return undefined;
            } else {
              ctx.ui.notify("Autorización de carpeta cancelada.", "info");
              return {
                block: true,
                reason: `Acción cancelada por el usuario: Se rechazó la autorización de carpeta para la sesión.`,
              };
            }
          }

          // Option 3 / Cancel / Escape
          ctx.ui.notify(`Operación cancelada: Se denegó la modificación en ${resolvedTarget}`, "info");
          return {
            block: true,
            reason: `Acción cancelada por el usuario: No se otorgó permiso para ${action} el archivo '${resolvedTarget}' fuera del directorio raíz.`,
          };
        } else {
          return {
            block: true,
            reason: `Operación bloqueada: Modificación fuera del directorio raíz '${resolvedTarget}' denegada en modo sin interfaz de confirmación.`,
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

        const title = "⚠️ Permiso para eliminar archivo fuera del proyecto";
        const details = `El comando bash intenta eliminar o alterar archivos fuera del directorio actual.\n\nComando: ${command}\nRuta afectada: ${target}\nDirectorio raíz: ${currentCwd}`;

        // Send desktop notification immediately
        sendDesktopNotification(
          "⚠️ Permiso para eliminar fuera del proyecto",
          `Pi solicita ejecutar:\n${truncate(command, 150)}`,
          "dialog-warning"
        );

        if (ctx.hasUI) {
          const confirmed = await ctx.ui.confirm(title, details);
          if (!confirmed) {
            ctx.ui.notify(`Comando cancelado por el usuario.`, "info");
            return {
              block: true,
              reason: `Comando cancelado por el usuario: Se denegó el permiso para eliminar archivos fuera del directorio raíz (${target}).`,
            };
          }
        } else {
          return {
            block: true,
            reason: `Comando bloqueado: Eliminación fuera del directorio raíz '${target}' no permitida sin confirmación interactiva.`,
          };
        }
      }
      return undefined;
    }

    return undefined;
  });

  // Command: /permissions
  pi.registerCommand("permissions", {
    description: "Ver o limpiar las carpetas externas autorizadas para esta sesión (/permissions [clear])",
    handler: async (args, ctx) => {
      const sub = String(args || "").trim().toLowerCase();
      if (sub === "clear") {
        const count = sessionAllowedDirectories.size;
        sessionAllowedDirectories.clear();
        ctx.ui.notify(`Se han revocado ${count} autorizaciones de sesión.`, "info");
        return;
      }

      if (sessionAllowedDirectories.size === 0) {
        ctx.ui.notify("No hay carpetas externas autorizadas para esta sesión.", "info");
        return;
      }

      const lines = ["📂 CARPETAS EXTERNAS AUTORIZADAS PARA ESTA SESIÓN:"];
      for (const dir of sessionAllowedDirectories) {
        lines.push(`• ${dir} (y subcarpetas)`);
      }
      lines.push("\nUsa '/permissions clear' para revocar todas las autorizaciones.");
      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}
