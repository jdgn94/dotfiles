#!/usr/bin/env bash
#
# Multiplex statusLine for Claude Code: sends stdin to both orca and herdr-agent-usage (usagebar).
#
set -euo pipefail

# Leer todo el payload JSON de entrada una sola vez en memoria
PAYLOAD="$(cat || true)"

# 1. Enviar a Herdr usagebar si está instalado
USAGEBAR_STATUSLINE="$(find "$HOME/.config/herdr/plugins/github" -name "run-statusline.sh" 2>/dev/null | head -n 1 || true)"
if [ -n "$USAGEBAR_STATUSLINE" ] && [ -x "$USAGEBAR_STATUSLINE" ]; then
  printf '%s' "$PAYLOAD" | bash "$USAGEBAR_STATUSLINE" >/dev/null 2>&1 || true
fi

# 2. Enviar a Orca si el hook de Orca existe
if [ -f "$HOME/.orca/agent-hooks/claude-statusline.sh" ] && [ -x "$HOME/.orca/agent-hooks/claude-statusline.sh" ]; then
  printf '%s' "$PAYLOAD" | /bin/sh "$HOME/.orca/agent-hooks/claude-statusline.sh" || true
else
  # Si no hay Orca, dejar pasar o imprimir salida vacía
  printf '{}\n'
fi
