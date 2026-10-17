#!/usr/bin/env bash
#
# toggle-explorer.sh - Toggle right-side file explorer pane in Herdr
#
set -euo pipefail

# 1. Obtener la información del pane actual para saber en qué workspace estamos y cuál es el cwd
CURRENT_INFO="$(herdr pane current 2>/dev/null || true)"
WORKSPACE_CWD=""
if [ -n "$CURRENT_INFO" ]; then
  WORKSPACE_CWD=$(echo "$CURRENT_INFO" | grep -o '"foreground_cwd":"[^"]*"' | head -n 1 | cut -d'"' -f4 || true)
  if [ -z "$WORKSPACE_CWD" ]; then
    WORKSPACE_CWD=$(echo "$CURRENT_INFO" | grep -o '"cwd":"[^"]*"' | head -n 1 | cut -d'"' -f4 || true)
  fi
fi

if [ -z "$WORKSPACE_CWD" ]; then
  WORKSPACE_CWD="$PWD"
fi

# 2. Revisar si ya existe un panel de Explorer abierto
EXPLORER_PANE_ID=$(herdr pane list 2>/dev/null | grep -o '"label":"Explorer"[^}]*"pane_id":"[^"]*"' | head -n 1 | grep -o '"pane_id":"[^"]*"' | cut -d'"' -f4 || true)

if [ -z "$EXPLORER_PANE_ID" ]; then
  # Fallback a buscar por título Yazi
  EXPLORER_PANE_ID=$(herdr pane list 2>/dev/null | grep -o '"pane_id":"[^"]*"[^}]*Yazi' | head -n 1 | grep -o '"pane_id":"[^"]*"' | cut -d'"' -f4 || true)
fi

if [ -n "$EXPLORER_PANE_ID" ]; then
  # Si ya está abierto, lo cerramos
  herdr pane close "$EXPLORER_PANE_ID" 2>/dev/null || true
else
  # Si no está abierto, abrimos Yazi a la derecha en el directorio de trabajo del workspace
  herdr plugin pane open --plugin herdr-files --entrypoint explorer --placement split --direction right --ratio 0.35 --cwd "$WORKSPACE_CWD" --focus 2>/dev/null || \
  herdr plugin pane open --plugin herdr-files --entrypoint explorer --placement split --direction right --cwd "$WORKSPACE_CWD" --focus 2>/dev/null || \
  yazi "$WORKSPACE_CWD"
fi
