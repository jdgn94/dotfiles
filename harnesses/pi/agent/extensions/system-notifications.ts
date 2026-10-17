import { execFile } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  urgency?: "low" | "normal" | "critical";
  category?: string;
}

let notificationsEnabled = true;

function sendDesktopNotification(opts: NotificationOptions): void {
  if (!notificationsEnabled) return;
  const args = [
    "-a",
    "Pi Agent",
    "-u",
    opts.urgency || "normal",
    "-i",
    opts.icon || "dialog-information",
    opts.title,
    opts.body,
  ];

  if (opts.category) {
    args.push("-c", opts.category);
  }

  execFile("notify-send", args, (err) => {
    // Non-blocking fire-and-forget; ignore errors silently
    if (err && process.env.PI_NOTIFY_DEBUG) {
      console.error("[system-notifications] notify-send error:", err);
    }
  });
}

function truncate(str: string, maxLen: number = 180): string {
  const clean = String(str || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3) + "...";
}

export default function (pi: ExtensionAPI) {
  let turnStartTime = 0;
  let turnToolCallsCount = 0;
  let isWaitingInput = false;

  // Track run start
  pi.on("agent_start", async () => {
    turnStartTime = Date.now();
    turnToolCallsCount = 0;
    isWaitingInput = false;
  });

  // Track tool calls: intercept questions and user confirmations
  pi.on("tool_call", async (event) => {
    turnToolCallsCount++;

    // 1. Tool ask_user_question
    if (event.toolName === "ask_user_question") {
      isWaitingInput = true;
      const questions = (event.input as { questions?: Array<{ question?: string; header?: string }> })?.questions;
      let body = "";
      if (Array.isArray(questions) && questions.length > 0) {
        body = questions
          .map((q) => q.question || q.header || "")
          .filter(Boolean)
          .join(" • ");
      }
      if (!body) body = "Pi ha formulado una pregunta y requiere tu respuesta.";

      sendDesktopNotification({
        title: "❓ Pregunta de Pi",
        body: truncate(body, 200),
        icon: "dialog-question",
        urgency: "normal",
        category: "presence",
      });
      return;
    }

    // 2. Tool contact_supervisor
    if (event.toolName === "contact_supervisor") {
      const input = event.input as { reason?: string; message?: string };
      if (input?.reason === "need_decision" || input?.reason === "interview_request") {
        isWaitingInput = true;
        const body = input.message || "Pi solicita una decisión o entrevista para continuar.";
        sendDesktopNotification({
          title: "⚖️ Decisión requerida",
          body: truncate(body, 200),
          icon: "dialog-warning",
          urgency: "normal",
        });
      }
      return;
    }
  });

  // 3. UI Prompts (confirmations, inputs, selects)
  pi.on("ui_prompt_start", async (event) => {
    isWaitingInput = true;
    if (event.kind === "confirm") {
      sendDesktopNotification({
        title: "⚠️ Confirmación requerida",
        body: event.title ? truncate(event.title, 180) : "Pi requiere tu confirmación para proceder.",
        icon: "dialog-warning",
        urgency: "normal",
      });
    } else if (event.kind === "input" || event.kind === "select") {
      sendDesktopNotification({
        title: event.kind === "input" ? "⌨️ Entrada requerida" : "📋 Selección requerida",
        body: event.title
          ? truncate(event.title, 180)
          : `Pi está esperando ${event.kind === "input" ? "tu texto" : "tu selección"}.`,
        icon: "dialog-information",
        urgency: "normal",
      });
    }
  });

  pi.on("ui_prompt_end", async () => {
    isWaitingInput = false;
  });

  // 4. Agent completion / cancellation
  pi.on("agent_settled", async (event) => {
    const elapsed = Date.now() - turnStartTime;
    const cwd = process.cwd().split(/[\\/]/).filter(Boolean).at(-1) || "proyecto";

    if (!event.aborted) {
      // Notify only if there was meaningful activity (tool calls or > 2.5s)
      if (turnToolCallsCount > 0 || elapsed > 2500) {
        const durationSec = (elapsed / 1000).toFixed(1);
        sendDesktopNotification({
          title: "✅ Tarea completada",
          body: `Pi ha terminado la tarea en ${cwd} (${durationSec}s)`,
          icon: "emblem-default",
          urgency: "normal",
        });
      }
    } else {
      sendDesktopNotification({
        title: "⏹️ Tarea cancelada",
        body: `La ejecución en ${cwd} fue cancelada.`,
        icon: "dialog-warning",
        urgency: "low",
      });
    }
    isWaitingInput = false;
  });

  // Register /notify command
  pi.registerCommand("notify", {
    description: "Configurar o probar notificaciones del sistema (/notify [test|on|off|status])",
    handler: async (args, ctx) => {
      const subcommand = String(args || "").trim().toLowerCase();

      if (subcommand === "test") {
        sendDesktopNotification({
          title: "🔔 Notificación de prueba",
          body: "Las notificaciones de Pi están funcionando correctamente en tu escritorio.",
          icon: "dialog-information",
          urgency: "normal",
        });
        ctx.ui.notify("Notificación de prueba enviada al sistema.", "info");
      } else if (subcommand === "on") {
        notificationsEnabled = true;
        ctx.ui.notify("Notificaciones de escritorio activadas.", "info");
      } else if (subcommand === "off") {
        notificationsEnabled = false;
        ctx.ui.notify("Notificaciones de escritorio desactivadas.", "info");
      } else if (subcommand === "toggle") {
        notificationsEnabled = !notificationsEnabled;
        ctx.ui.notify(
          `Notificaciones de escritorio ${notificationsEnabled ? "activadas" : "desactivadas"}.`,
          "info"
        );
      } else {
        ctx.ui.notify(
          `Estado de notificaciones: ${notificationsEnabled ? "ACTIVADAS" : "DESACTIVADAS"}. Usa /notify [test|on|off|toggle]`,
          "info"
        );
      }
    },
  });
}
