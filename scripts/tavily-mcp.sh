#!/usr/bin/env bash
# Run Tavily MCP with the key from the shared dotsfiles token file.
set -euo pipefail

. "$HOME/.config/dotsfiles/tokens.env"

exec npx -y tavily-mcp
