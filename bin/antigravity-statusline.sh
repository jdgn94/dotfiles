#!/usr/bin/env bash
#
# Multiplex statusLine for Antigravity CLI (agy): sends session JSON payload to usagebar.
#
set -euo pipefail

PAYLOAD="$(cat || true)"
USAGEBAR_AGY="$(find "$HOME/.config/herdr/plugins/github" -name "run-antigravity-statusline.sh" 2>/dev/null | head -n 1 || true)"

if [ -n "$USAGEBAR_AGY" ] && [ -x "$USAGEBAR_AGY" ]; then
  printf '%s' "$PAYLOAD" | bash "$USAGEBAR_AGY" >/dev/null 2>&1 || true
fi
