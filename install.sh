#!/usr/bin/env bash
#
# install.sh - Universal installer for dotsfiles harnesses, configurations, shared skills, and secrets.
# Only deploys configurations for harnesses that are actually installed on the system.
# Supports Linux and macOS.
#
set -euo pipefail

DOTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_DIR="${HOME:-$HOME}"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- OS Detection ---
OS="unknown"
case "$(uname -s 2>/dev/null || echo unknown)" in
  Darwin*) OS="macos" ;;
  Linux*)  OS="linux" ;;
  *)       OS="unknown" ;;
esac
log_info "Detected OS: $OS"

# --- Helper: Link or copy ---
link_or_copy() {
  local src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  rm -rf "$dst"
  if ln -sf "$src" "$dst" 2>/dev/null; then
    echo "  -> Linked: $dst -> $src"
  else
    cp -r "$src" "$dst"
    echo "  -> Copied: $dst (symlinks not supported)"
  fi
}

# --- 1. Detect Installed Harnesses ---
log_info "Detecting installed AI harnesses and multiplexers..."

HAS_PI=false
HAS_CLAUDE=false
HAS_OPENCODE=false
OPENCODE_CMD=""
HAS_HERMES=false
HAS_ANTIGRAVITY=false
HAS_HERDR=false

if command -v pi >/dev/null 2>&1 || [ -d "$DOTS_DIR/pi-tui-plus" ]; then
  HAS_PI=true
  log_success "Pi Coding Agent / Pi-TUI-Plus detected"
fi

if command -v claude >/dev/null 2>&1; then
  HAS_CLAUDE=true
  log_success "Claude Code detected"
fi

if command -v opencode2 >/dev/null 2>&1; then
  HAS_OPENCODE=true
  OPENCODE_CMD="opencode2"
  log_success "OpenCode2 detected ($OPENCODE_CMD)"
elif command -v opencode >/dev/null 2>&1; then
  HAS_OPENCODE=true
  OPENCODE_CMD="opencode"
  log_success "OpenCode detected ($OPENCODE_CMD)"
fi

if command -v hermes >/dev/null 2>&1; then
  HAS_HERMES=true
  log_success "Hermes Agent detected"
fi

if command -v agy >/dev/null 2>&1 || command -v antigravity >/dev/null 2>&1 || [ -d "$HOME_DIR/.gemini" ]; then
  HAS_ANTIGRAVITY=true
  log_success "Antigravity detected"
fi

if command -v herdr >/dev/null 2>&1; then
  HAS_HERDR=true
  log_success "Herdr multiplexer detected"
fi

# --- 2. Configure Central Tokens / Secrets Directory ---
log_info "Setting up centralized secrets in ~/.config/dotsfiles/ ..."
DOTSFILES_CONFIG_DIR="$HOME_DIR/.config/dotsfiles"
mkdir -p "$DOTSFILES_CONFIG_DIR"

if [ ! -f "$DOTSFILES_CONFIG_DIR/tokens.env" ]; then
  cp "$DOTS_DIR/secrets/tokens.env.example" "$DOTSFILES_CONFIG_DIR/tokens.env"
  chmod 600 "$DOTSFILES_CONFIG_DIR/tokens.env"
  log_info "Created $DOTSFILES_CONFIG_DIR/tokens.env (fill your API keys there)"
else
  log_info "$DOTSFILES_CONFIG_DIR/tokens.env already exists. Preserving."
fi

if [ ! -f "$DOTSFILES_CONFIG_DIR/tokens.json" ]; then
  cp "$DOTS_DIR/secrets/tokens.json.example" "$DOTSFILES_CONFIG_DIR/tokens.json"
  chmod 600 "$DOTSFILES_CONFIG_DIR/tokens.json"
  log_info "Created $DOTSFILES_CONFIG_DIR/tokens.json"
fi

# Context7 is the only MCP in the default set that needs a credential.
CONTEXT7_TOKEN="${CONTEXT7_API_KEY:-}"
if command -v python3 >/dev/null 2>&1; then
  FILE_CONTEXT7_TOKEN="$(python3 - "$DOTSFILES_CONFIG_DIR/tokens.env" "$DOTSFILES_CONFIG_DIR/tokens.json" <<'PY'
import json
import re
import sys

env_path, json_path = sys.argv[1:3]
token = ""
try:
    match = re.search(r'^export CONTEXT7_API_KEY=(.*)$', open(env_path).read(), re.M)
    if match:
        value = match.group(1).strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        token = value
except FileNotFoundError:
    pass
if not token:
    try:
        data = json.load(open(json_path))
        token = (data.get("tokens") or data).get("CONTEXT7_API_KEY", "")
    except Exception:
        pass
print(token)
PY
)"
  if [ -n "$FILE_CONTEXT7_TOKEN" ]; then
    CONTEXT7_TOKEN="$FILE_CONTEXT7_TOKEN"
  fi
fi

if [ -z "$CONTEXT7_TOKEN" ] && [ -t 0 ]; then
  printf 'Context7 API key (leave empty to skip): '
  IFS= read -rs CONTEXT7_TOKEN
  printf '\n'
fi

if [ -n "$CONTEXT7_TOKEN" ]; then
  export CONTEXT7_API_KEY="$CONTEXT7_TOKEN"
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$DOTSFILES_CONFIG_DIR/tokens.env" "$DOTSFILES_CONFIG_DIR/tokens.json" "$CONTEXT7_TOKEN" <<'PY'
import json
import os
import shlex
import sys

env_path, json_path, token = sys.argv[1:4]
line = f"export CONTEXT7_API_KEY={shlex.quote(token)}"

try:
    lines = open(env_path).read().splitlines()
except FileNotFoundError:
    lines = []
found = False
for index, existing in enumerate(lines):
    if existing.startswith("export CONTEXT7_API_KEY="):
        lines[index] = line
        found = True
if not found:
    lines.append(line)
with open(env_path, "w") as handle:
    handle.write("\n".join(lines) + "\n")
os.chmod(env_path, 0o600)

try:
    with open(json_path) as handle:
        data = json.load(handle)
except FileNotFoundError:
    data = {}
data.setdefault("tokens", {})["CONTEXT7_API_KEY"] = token
with open(json_path, "w") as handle:
    json.dump(data, handle, indent=2, ensure_ascii=False)
    handle.write("\n")
os.chmod(json_path, 0o600)
PY
  fi
  log_success "Context7 API key stored in centralized tokens."
else
  log_info "Context7 API key not set; the Context7 MCP will need it later."
fi

# Tavily is the web-search MCP; it needs a key too.
TAVILY_TOKEN="${TAVILY_API_KEY:-}"
if command -v python3 >/dev/null 2>&1; then
  FILE_TAVILY_TOKEN="$(python3 "$DOTS_DIR/scripts/token.py" get "$DOTSFILES_CONFIG_DIR/tokens.env" "$DOTSFILES_CONFIG_DIR/tokens.json" TAVILY_API_KEY 2>/dev/null || true)"
  if [ -n "$FILE_TAVILY_TOKEN" ]; then
    TAVILY_TOKEN="$FILE_TAVILY_TOKEN"
  fi
fi
if [ -z "$TAVILY_TOKEN" ] && [ -t 0 ]; then
  printf 'Tavily API key (leave empty to skip): '
  IFS= read -rs TAVILY_TOKEN
  printf '\n'
fi
if [ -n "$TAVILY_TOKEN" ]; then
  export TAVILY_API_KEY="$TAVILY_TOKEN"
  if command -v python3 >/dev/null 2>&1; then
    python3 "$DOTS_DIR/scripts/token.py" set "$DOTSFILES_CONFIG_DIR/tokens.env" "$DOTSFILES_CONFIG_DIR/tokens.json" TAVILY_API_KEY "$TAVILY_TOKEN"
  fi
  log_success "Tavily API key stored in centralized tokens."
else
  log_info "Tavily API key not set; the Tavily MCP will need it later."
fi

# Make the shared token file visible to every harness launched from a new shell.
SHELL_RC="$HOME_DIR/.profile"
case "$(basename "${SHELL:-}")" in
  zsh) SHELL_RC="$HOME_DIR/.zshrc" ;;
  bash) SHELL_RC="$HOME_DIR/.bashrc" ;;
esac
if [ -d "$(dirname "$SHELL_RC")" ] && ! grep -q ">>> dotsfiles tokens >>>" "$SHELL_RC" 2>/dev/null; then
  {
    printf '\n# >>> dotsfiles tokens >>>\n'
    printf 'if [ -f "%s" ]; then\n  . "%s"\nfi\n' "$DOTSFILES_CONFIG_DIR/tokens.env" "$DOTSFILES_CONFIG_DIR/tokens.env"
    printf '# <<< dotsfiles tokens <<<\n'
  } >> "$SHELL_RC"
  log_info "Added tokens.env sourcing to $SHELL_RC"
fi

# Shared MCP bridge scripts read the token file at runtime.
DOTSFILES_BIN_DIR="$HOME_DIR/.config/dotsfiles/bin"
mkdir -p "$DOTSFILES_BIN_DIR"
cp "$DOTS_DIR/scripts/context7-mcp.sh" "$DOTS_DIR/scripts/tavily-mcp.sh" "$DOTSFILES_BIN_DIR/"
chmod +x "$DOTSFILES_BIN_DIR/context7-mcp.sh" "$DOTSFILES_BIN_DIR/tavily-mcp.sh"

# --- 3. Configure ~/.agents (Single Canonical Source of Truth) ---
log_info "Linking ~/.agents to $DOTS_DIR/shared ..."
AGENTS_LINK="$HOME_DIR/.agents"
rm -rf "$AGENTS_LINK"
ln -s "$DOTS_DIR/shared" "$AGENTS_LINK"
log_success "~/.agents -> $DOTS_DIR/shared"
AGENTS_MD="$HOME_DIR/.agents/rules/AGENTS.md"

# --- 4. Deploy Pi Coding Agent Configuration ---
if [ "$HAS_PI" = true ]; then
  log_info "Deploying Pi Coding Agent configuration..."
  PI_DIR="$HOME_DIR/.pi/agent"
  mkdir -p "$PI_DIR/agents" "$PI_DIR/extensions" "$PI_DIR/npm" "$PI_DIR/pi-subagents" "$PI_DIR/skills"

  link_or_copy "$HOME_DIR/.agents/AGENTS.md" "$PI_DIR/AGENTS.md"

  cp "$DOTS_DIR/harnesses/pi/agent/settings.json" "$PI_DIR/settings.json"
  [ -f "$DOTS_DIR/harnesses/pi/agent/mcp.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/mcp.json" "$PI_DIR/mcp.json"
  if [ -f "$PI_DIR/mcp.json" ] && command -v python3 >/dev/null 2>&1; then
    python3 "$DOTS_DIR/scripts/mcp-config.py" pi "$PI_DIR/mcp.json" 2>/dev/null || log_info "Could not merge Pi MCP configuration."
  fi
  [ -f "$DOTS_DIR/harnesses/pi/agent/pi-slate.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/pi-slate.json" "$PI_DIR/pi-slate.json"
  [ -f "$DOTS_DIR/harnesses/pi/agent/mcp-onboarding.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/mcp-onboarding.json" "$PI_DIR/mcp-onboarding.json"
  [ -f "$DOTS_DIR/harnesses/pi/agent/npm/package.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/npm/package.json" "$PI_DIR/npm/package.json"

  if [ -d "$DOTS_DIR/harnesses/pi/agent/agents" ]; then
    cp -r "$DOTS_DIR/harnesses/pi/agent/agents/"* "$PI_DIR/agents/" 2>/dev/null || true
  fi

  if [ -d "$DOTS_DIR/harnesses/pi/agent/extensions" ]; then
    cp -r "$DOTS_DIR/harnesses/pi/agent/extensions/"* "$PI_DIR/extensions/" 2>/dev/null || true
  fi

  if [ -d "$PI_DIR/npm" ] && command -v npm >/dev/null 2>&1; then
    log_info "Installing Pi extension dependencies..."
    (cd "$PI_DIR/npm" && npm install --silent 2>/dev/null || true)
  fi

  if [ -d "$DOTS_DIR/pi-tui-plus" ]; then
    log_info "Building and linking pi-tui-plus (pi-plus CLI)..."
    (
      cd "$DOTS_DIR/pi-tui-plus"
      if command -v pnpm >/dev/null 2>&1; then
        pnpm install --silent 2>/dev/null || pnpm install
        pnpm run build
      elif command -v npm >/dev/null 2>&1; then
        npm install --silent 2>/dev/null || npm install
        npm run build
      fi
      npm link --silent 2>/dev/null || npm link || true
    )
  fi
else
  log_info "Pi Coding Agent not installed; skipping Pi configuration."
fi

# --- 5. Deploy Claude Code Configuration ---
if [ "$HAS_CLAUDE" = true ]; then
  log_info "Deploying Claude Code configuration..."
  CLAUDE_DIR="$HOME_DIR/.claude"
  mkdir -p "$CLAUDE_DIR/hooks" "$CLAUDE_DIR/skills" "$CLAUDE_DIR/rules"

  if [ -f "$DOTS_DIR/harnesses/claude/settings.json" ]; then
    if [ ! -f "$CLAUDE_DIR/settings.json" ]; then
      cp "$DOTS_DIR/harnesses/claude/settings.json" "$CLAUDE_DIR/settings.json"
    fi
  fi

  if [ -d "$DOTS_DIR/harnesses/claude/hooks" ]; then
    cp -r "$DOTS_DIR/harnesses/claude/hooks/"* "$CLAUDE_DIR/hooks/" 2>/dev/null || true
    chmod +x "$CLAUDE_DIR/hooks/"*.sh 2>/dev/null || true
  fi

  if [ -d "$DOTS_DIR/harnesses/claude/agents" ]; then
    mkdir -p "$CLAUDE_DIR/agents"
    cp -r "$DOTS_DIR/harnesses/claude/agents/"* "$CLAUDE_DIR/agents/" 2>/dev/null || true
  fi

  # Claude reads AGENTS.md, and CLAUDE.md is the entrypoint that points to it.
  cp "$DOTS_DIR/harnesses/claude/AGENTS.md" "$CLAUDE_DIR/AGENTS.md"
  cp "$DOTS_DIR/harnesses/claude/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
  link_or_copy "$CLAUDE_DIR/AGENTS.md" "$CLAUDE_DIR/rules/AGENTS.md"

  # Load project AGENTS.md beside CLAUDE.md; CLAUDE.md stays the entrypoint.
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$CLAUDE_DIR/settings.json" <<'PY'
import json
import sys

path = sys.argv[1]
try:
    with open(path) as handle:
        settings = json.load(handle)
except FileNotFoundError:
    settings = {}

plugin = settings.setdefault("pluginConfigs", {}).setdefault("cc-plugin-agents-md@builtin", {})
plugin.setdefault("options", {})["instructionFiles"] = "claude-md-and-agents-md"

excludes = settings.get("claudeMdExcludes")
if isinstance(excludes, list):
    for pattern in ("**/CLAUDE.md", "**/CLAUDE.local.md"):
        while pattern in excludes:
            excludes.remove(pattern)
    if not excludes:
        settings.pop("claudeMdExcludes", None)

with open(path, "w") as handle:
    json.dump(settings, handle, indent=2, ensure_ascii=False)
    handle.write("\n")
PY
  fi

  claude mcp add -s user playwright -- npx -y @playwright/mcp@latest --headless 2>/dev/null || true
  claude mcp add -s user memory -- npx -y @modelcontextprotocol/server-memory 2>/dev/null || true
  claude mcp add -s user fetch -- uvx mcp-server-fetch 2>/dev/null || true
  claude mcp add-json -s user context7 '{"type":"http","url":"https://mcp.context7.com/mcp","headers":{"Authorization":"Bearer ${CONTEXT7_API_KEY}"}}' 2>/dev/null || true
  claude mcp add -s user browsermcp -- npx -y @browsermcp/mcp@latest 2>/dev/null || true
  claude mcp add -s user tavily -- "$DOTSFILES_BIN_DIR/tavily-mcp.sh" 2>/dev/null || true
  claude mcp add -s user osv -- npx -y @cyanheads/osv-advisory-mcp-server 2>/dev/null || true
else
  log_info "Claude Code not installed; skipping Claude configuration."
fi

# --- 6. Deploy OpenCode Configuration (Only for detected version) ---
if [ "$HAS_OPENCODE" = true ] && [ -n "$OPENCODE_CMD" ]; then
  log_info "Deploying configuration for $OPENCODE_CMD..."
  O_DIR="$HOME_DIR/.config/$OPENCODE_CMD"
  mkdir -p "$O_DIR/plugins" "$O_DIR/skills"

  if [ ! -f "$O_DIR/opencode.jsonc" ]; then
    cp "$DOTS_DIR/harnesses/opencode/opencode.jsonc" "$O_DIR/opencode.jsonc"
  fi
  [ -f "$DOTS_DIR/harnesses/opencode/tui.jsonc" ] && cp "$DOTS_DIR/harnesses/opencode/tui.jsonc" "$O_DIR/tui.jsonc"
  [ -f "$DOTS_DIR/harnesses/opencode/herdr-tui-session.js" ] && cp "$DOTS_DIR/harnesses/opencode/herdr-tui-session.js" "$O_DIR/herdr-tui-session.js"
  if [ -d "$DOTS_DIR/harnesses/opencode/plugins" ]; then
    cp -r "$DOTS_DIR/harnesses/opencode/plugins/"* "$O_DIR/plugins/" 2>/dev/null || true
  fi
  printf '> **Cross-Agent Parity**: follow the rule in `%s`.\n' "$AGENTS_MD" > "$O_DIR/AGENTS.md"

  # Keep OpenCode and OpenCode2 on the same shared MCP set when both exist.
  if command -v python3 >/dev/null 2>&1; then
    for OD in "$HOME_DIR/.config/opencode" "$HOME_DIR/.config/opencode2"; do
      [ -f "$OD/opencode.jsonc" ] || continue
      python3 "$DOTS_DIR/scripts/mcp-config.py" opencode "$OD/opencode.jsonc" 2>/dev/null || log_info "Could not merge MCP configuration in $OD."
    done
  fi
else
  log_info "Neither OpenCode nor OpenCode2 installed; skipping OpenCode configuration."
fi

# --- 7. Deploy Hermes Configuration ---
if [ "$HAS_HERMES" = true ]; then
  log_info "Deploying Hermes Agent configuration..."
  HERMES_DIR="$HOME_DIR/.hermes"
  mkdir -p "$HERMES_DIR/skills"
  if [ ! -f "$HERMES_DIR/config.yaml" ] && [ -f "$DOTS_DIR/harnesses/hermes/config.yaml" ]; then
    cp "$DOTS_DIR/harnesses/hermes/config.yaml" "$HERMES_DIR/config.yaml"
  fi
  if [ -f "$HERMES_DIR/config.yaml" ] && command -v python3 >/dev/null 2>&1; then
    python3 "$DOTS_DIR/scripts/mcp-config.py" hermes "$HERMES_DIR/config.yaml" 2>/dev/null || log_info "Could not merge Hermes MCP configuration."
  fi

  # Hermes injects SOUL.md globally every turn; point it at the canonical rules.
  HERMES_SOUL="$HERMES_DIR/SOUL.md"
  if ! grep -q "dotsfiles:begin" "$HERMES_SOUL" 2>/dev/null; then
    printf '\n<!-- dotsfiles:begin -->\nMachine-wide rules: read and follow `%s` before any non-trivial task.\n<!-- dotsfiles:end -->\n' \
      "$HOME_DIR/.agents/AGENTS.md" >> "$HERMES_SOUL"
  fi
else
  log_info "Hermes Agent not installed; skipping Hermes configuration."
fi

# --- 8. Deploy Antigravity (agy / desktop) Configuration ---
if [ "$HAS_ANTIGRAVITY" = true ]; then
  log_info "Deploying Antigravity configuration..."
  GEMINI_CONFIG="$HOME_DIR/.gemini/config"
  GEMINI_AGY="$HOME_DIR/.gemini/antigravity-cli"
  mkdir -p "$GEMINI_CONFIG/skills" "$GEMINI_CONFIG/hooks" "$GEMINI_AGY/skills"

  # Antigravity discovers global rules in ~/.gemini and ~/.gemini/config;
  # it deduplicates by resolved file, so linking both is safe.
  link_or_copy "$HOME_DIR/.agents/AGENTS.md" "$GEMINI_CONFIG/AGENTS.md"
  link_or_copy "$HOME_DIR/.agents/AGENTS.md" "$HOME_DIR/.gemini/AGENTS.md"

  if [ ! -f "$GEMINI_CONFIG/mcp_config.json" ] && [ -f "$DOTS_DIR/harnesses/antigravity/mcp_config.json" ]; then
    cp "$DOTS_DIR/harnesses/antigravity/mcp_config.json" "$GEMINI_CONFIG/mcp_config.json"
  fi
  # Antigravity's remote-header handling is inconsistent; Context7 goes through
  # an mcp-remote bridge that reads the shared token file.
  if [ -f "$GEMINI_CONFIG/mcp_config.json" ] && command -v python3 >/dev/null 2>&1; then
    python3 "$DOTS_DIR/scripts/mcp-config.py" antigravity "$GEMINI_CONFIG/mcp_config.json" 2>/dev/null || log_info "Could not merge Antigravity MCP configuration."
  fi
  if [ ! -f "$GEMINI_AGY/settings.json" ] && [ -f "$DOTS_DIR/harnesses/antigravity/agy-settings.json" ]; then
    cp "$DOTS_DIR/harnesses/antigravity/agy-settings.json" "$GEMINI_AGY/settings.json"
  fi
  if [ -d "$DOTS_DIR/harnesses/antigravity/hooks" ]; then
    cp -r "$DOTS_DIR/harnesses/antigravity/hooks/"* "$GEMINI_CONFIG/hooks/" 2>/dev/null || true
    chmod +x "$GEMINI_CONFIG/hooks/"*.sh 2>/dev/null || true
  fi
else
  log_info "Antigravity not installed; skipping Antigravity configuration."
fi

# --- 9. Deploy Herdr Configuration & Plugins ---
if [ "$HAS_HERDR" = true ]; then
  log_info "Deploying Herdr configuration and plugins..."
  HERDR_DIR="$HOME_DIR/.config/herdr"
  mkdir -p "$HERDR_DIR"

  DOTS_BIN_DIR="$HOME_DIR/.config/dotsfiles/bin"
  mkdir -p "$DOTS_BIN_DIR"
  if [ -d "$DOTS_DIR/bin" ]; then
    cp "$DOTS_DIR/bin/"* "$DOTS_BIN_DIR/" 2>/dev/null || true
    chmod +x "$DOTS_BIN_DIR/"*.sh 2>/dev/null || true
  fi

  cp "$DOTS_DIR/harnesses/herdr/config.toml" "$HERDR_DIR/config.toml"
  cp "$DOTS_DIR/harnesses/herdr/plugins.json" "$HERDR_DIR/plugins.json"

  if ! herdr plugin list 2>/dev/null | grep -q "usagebar"; then
    log_info "Installing plugin herdr-agent-usage (usagebar)..."
    herdr plugin install senna-lang/herdr-agent-usage -y 2>/dev/null || true
  fi
  USAGEBAR_DIR="$(find "$HOME_DIR/.config/herdr/plugins/github" -maxdepth 1 -name "usagebar-*" 2>/dev/null | head -n 1 || true)"
  if [ -n "$USAGEBAR_DIR" ] && [ -f "$DOTS_DIR/harnesses/herdr/usagebar-patches/usagebar.patch" ]; then
    (cd "$USAGEBAR_DIR" && git apply "$DOTS_DIR/harnesses/herdr/usagebar-patches/usagebar.patch" 2>/dev/null || true && go build -o bin/usagebar ./cmd/usagebar 2>/dev/null || true)
  fi
  USAGEBAR_RUN_LIMITS="$(find "$HOME_DIR/.config/herdr/plugins/github" -name "run-limits-pane.sh" 2>/dev/null | head -n 1 || true)"
  if [ -n "$USAGEBAR_RUN_LIMITS" ] && [ -f "$DOTS_DIR/harnesses/herdr/usagebar-patches/run-limits-pane.sh" ]; then
    cp "$DOTS_DIR/harnesses/herdr/usagebar-patches/run-limits-pane.sh" "$USAGEBAR_RUN_LIMITS"
    chmod +x "$USAGEBAR_RUN_LIMITS"
  fi
  if ! herdr plugin list 2>/dev/null | grep -q "herdr.auto-title"; then
    log_info "Installing plugin herdr-auto-title..."
    herdr plugin install kryptamine/herdr-auto-title -y 2>/dev/null || true
    herdr plugin action invoke herdr.auto-title.restart 2>/dev/null || true
  fi
  if ! herdr plugin list 2>/dev/null | grep -q "local.agent-icons"; then
    log_info "Installing plugin herdr-agent-icons..."
    herdr plugin install adihex/herdr-agent-icons -y 2>/dev/null || true
    herdr plugin action invoke local.agent-icons.install-font 2>/dev/null || true
  fi
  if ! herdr plugin list 2>/dev/null | grep -q "jt.command-palette"; then
    log_info "Installing plugin herdr-command-palette..."
    herdr plugin install JanTvrdik/herdr-command-palette -y 2>/dev/null || true
  fi
  if ! herdr plugin list 2>/dev/null | grep -q "persiyanov.reviewr"; then
    log_info "Installing plugin herdr-reviewr..."
    herdr plugin install persiyanov/herdr-reviewr -y 2>/dev/null || true
  fi
  if ! herdr plugin list 2>/dev/null | grep -q "tdi.worktree-setup"; then
    log_info "Installing plugin herdr-worktree-setup..."
    herdr plugin install tdi/herdr-worktree-setup -y 2>/dev/null || true
  fi
  if ! herdr plugin list 2>/dev/null | grep -q "ez-corp.space-usage"; then
    log_info "Installing plugin herdr-pc-ram-and-cpu-usage-overlay..."
    herdr plugin install ezcorp-org/herdr-pc-ram-and-cpu-usage-overlay -y 2>/dev/null || true
  fi

  # Enable integrations only for installed agents
  [ "$HAS_PI" = true ] && herdr integration install pi 2>/dev/null || true
  [ "$HAS_CLAUDE" = true ] && herdr integration install claude 2>/dev/null || true
  [ "$HAS_OPENCODE" = true ] && herdr integration install opencode 2>/dev/null || true
  [ "$HAS_HERMES" = true ] && herdr integration install hermes 2>/dev/null || true
  [ "$HAS_ANTIGRAVITY" = true ] && herdr integration install antigravity-cli 2>/dev/null || true
else
  log_info "Herdr not installed; skipping Herdr configuration."
fi

# --- 9b. Deploy Neovim (NvChad + neo-tree) and lazygit ---
if command -v nvim >/dev/null 2>&1; then
  log_info "Deploying Neovim / NvChad configuration..."
  NVIM_DIR="$HOME_DIR/.config/nvim"
  if [ -d "$NVIM_DIR" ] && [ -f "$NVIM_DIR/init.lua" ] && [ ! -f "$NVIM_DIR/.dotsfiles-managed" ]; then
    NVIM_BACKUP="$NVIM_DIR.bak.$(date +%Y%m%d%H%M%S)"
    mv "$NVIM_DIR" "$NVIM_BACKUP"
    log_info "Backed up existing Neovim config to $NVIM_BACKUP"
  fi
  mkdir -p "$NVIM_DIR"
  cp -r "$DOTS_DIR/harnesses/nvim/." "$NVIM_DIR/"
  touch "$NVIM_DIR/.dotsfiles-managed"

  if ! command -v tree-sitter >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    log_info "Installing tree-sitter CLI..."
    npm install -g tree-sitter-cli >/dev/null 2>&1 || log_info "tree-sitter CLI install failed; Treesitter parsers may need it."
  fi

  if [ ! -d "$HOME_DIR/.local/share/nvim/lazy/lazy.nvim" ]; then
    log_info "Bootstrapping NvChad plugins (first run)..."
    timeout 300 nvim --headless "+Lazy! sync" +qa 2>/dev/null || log_info "Open nvim once to finish plugin installation."
  fi
fi

if ! command -v lazygit >/dev/null 2>&1 && command -v go >/dev/null 2>&1; then
  log_info "Installing lazygit..."
  GOBIN="$HOME_DIR/.local/bin" timeout 300 go install github.com/jesseduffield/lazygit@latest 2>/dev/null || log_info "lazygit install failed; install it manually."
fi
mkdir -p "$HOME_DIR/.config/lazygit"
cp "$DOTS_DIR/harnesses/lazygit/config.yml" "$HOME_DIR/.config/lazygit/config.yml"

if ! fc-list 2>/dev/null | grep -qiE "nerd font"; then
  log_info "No Nerd Font detected; install one for neo-tree/lazygit icons."
fi

# --- 9c. Install Agent Reach CLI (internet reading; Tavily handles search) ---
if command -v uv >/dev/null 2>&1 || command -v pipx >/dev/null 2>&1; then
  if ! command -v agent-reach >/dev/null 2>&1; then
    log_info "Installing Agent Reach CLI..."
    if command -v uv >/dev/null 2>&1; then
      uv tool install "https://github.com/Panniantong/Agent-Reach/archive/main.zip" >/dev/null 2>&1 || log_info "Agent Reach install failed; install it manually."
    else
      pipx install "https://github.com/Panniantong/Agent-Reach/archive/main.zip" >/dev/null 2>&1 || log_info "Agent Reach install failed; install it manually."
    fi
  fi
  if ! command -v yt-dlp >/dev/null 2>&1 && command -v uv >/dev/null 2>&1; then
    uv tool install yt-dlp >/dev/null 2>&1 || true
  fi
  if command -v agent-reach >/dev/null 2>&1; then
    agent-reach install --env=auto >/dev/null 2>&1 || true
  fi
fi

# --- 10. Distribute Shared Canonical Skills to Installed Harnesses ---
log_info "Distributing shared canonical skills to installed harnesses..."

HARNESS_SKILL_DIRS=()
[ "$HAS_PI" = true ] && HARNESS_SKILL_DIRS+=("$HOME_DIR/.pi/agent/skills")
[ "$HAS_CLAUDE" = true ] && HARNESS_SKILL_DIRS+=("$HOME_DIR/.claude/skills")
[ "$HAS_OPENCODE" = true ] && [ -n "$OPENCODE_CMD" ] && HARNESS_SKILL_DIRS+=("$HOME_DIR/.config/$OPENCODE_CMD/skills")
[ "$HAS_HERMES" = true ] && HARNESS_SKILL_DIRS+=("$HOME_DIR/.hermes/skills")
[ "$HAS_ANTIGRAVITY" = true ] && HARNESS_SKILL_DIRS+=("$HOME_DIR/.gemini/antigravity-cli/skills" "$HOME_DIR/.gemini/config/skills")

if [ ${#HARNESS_SKILL_DIRS[@]} -gt 0 ]; then
  for s_dir in "$DOTS_DIR/shared/skills"/*; do
    [ -d "$s_dir" ] || continue
    skill_name="$(basename "$s_dir")"
    for target_dir in "${HARNESS_SKILL_DIRS[@]}"; do
      mkdir -p "$target_dir"
      link_or_copy "$DOTS_DIR/shared/skills/$skill_name" "$target_dir/$skill_name"
    done
  done
fi

log_success "Dotsfiles deployment completed successfully!"
