#!/bin/sh
# Hook to bridge Antigravity events to usagebar
set -eu

USAGEBAR_BIN="$(find "$HOME/.config/herdr/plugins/github" -name "usagebar" 2>/dev/null | head -n 1 || true)"
if [ -n "$USAGEBAR_BIN" ] && [ -x "$USAGEBAR_BIN" ]; then
  # Sincroniza tokens y estado de uso
  "$USAGEBAR_BIN" status >/dev/null 2>&1 || true
fi

printf '{}\n'
