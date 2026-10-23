#!/usr/bin/env bash
# Bridge Context7's authenticated HTTP MCP endpoint for harnesses that do not
# reliably expand ${CONTEXT7_API_KEY} in remote MCP headers (Antigravity).
set -euo pipefail

. "$HOME/.config/dotsfiles/tokens.env"

exec npx -y mcp-remote@latest https://mcp.context7.com/mcp \
  --header "Authorization: Bearer ${CONTEXT7_API_KEY}"
