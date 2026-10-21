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

  cp "$DOTS_DIR/harnesses/pi/agent/settings.json" "$PI_DIR/settings.json"
  [ -f "$DOTS_DIR/harnesses/pi/agent/mcp.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/mcp.json" "$PI_DIR/mcp.json"
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
  mkdir -p "$CLAUDE_DIR/hooks" "$CLAUDE_DIR/skills"

  if [ -f "$DOTS_DIR/harnesses/claude/settings.json" ]; then
    if [ ! -f "$CLAUDE_DIR/settings.json" ]; then
      cp "$DOTS_DIR/harnesses/claude/settings.json" "$CLAUDE_DIR/settings.json"
    fi
  fi

  if [ -d "$DOTS_DIR/harnesses/claude/hooks" ]; then
    cp -r "$DOTS_DIR/harnesses/claude/hooks/"* "$CLAUDE_DIR/hooks/" 2>/dev/null || true
    chmod +x "$CLAUDE_DIR/hooks/"*.sh 2>/dev/null || true
  fi

  if [ -f "$DOTS_DIR/harnesses/claude/CLAUDE.md" ]; then
    cp "$DOTS_DIR/harnesses/claude/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
  else
    printf '# Global Claude Instructions\nImporting common rules and instructions from dotsfiles:\n@%s\n' "$AGENTS_MD" > "$CLAUDE_DIR/CLAUDE.md"
  fi

  claude mcp add -s user playwright -- npx -y @playwright/mcp@latest --headless 2>/dev/null || true
  claude mcp add -s user memory -- npx -y @modelcontextprotocol/server-memory 2>/dev/null || true
  claude mcp add -s user fetch -- uvx mcp-server-fetch 2>/dev/null || true
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
else
  log_info "Hermes Agent not installed; skipping Hermes configuration."
fi

# --- 8. Deploy Antigravity (agy / desktop) Configuration ---
if [ "$HAS_ANTIGRAVITY" = true ]; then
  log_info "Deploying Antigravity configuration..."
  GEMINI_CONFIG="$HOME_DIR/.gemini/config"
  GEMINI_AGY="$HOME_DIR/.gemini/antigravity-cli"
  mkdir -p "$GEMINI_CONFIG/skills" "$GEMINI_CONFIG/hooks" "$GEMINI_AGY/skills"

  if [ ! -f "$GEMINI_CONFIG/mcp_config.json" ] && [ -f "$DOTS_DIR/harnesses/antigravity/mcp_config.json" ]; then
    cp "$DOTS_DIR/harnesses/antigravity/mcp_config.json" "$GEMINI_CONFIG/mcp_config.json"
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

  HERDR_SIDEBAR_STATE_DIR="$HOME_DIR/.local/state/herdr/plugins/herdr-sidebar"
  mkdir -p "$HERDR_SIDEBAR_STATE_DIR"
  if [ -d "$DOTS_DIR/harnesses/herdr/state" ]; then
    cp "$DOTS_DIR/harnesses/herdr/state/state.json" "$HERDR_SIDEBAR_STATE_DIR/state.json" 2>/dev/null || true
    cp "$DOTS_DIR/harnesses/herdr/state/editor-command.txt" "$HERDR_SIDEBAR_STATE_DIR/editor-command.txt" 2>/dev/null || true
  fi

  if ! herdr plugin list 2>/dev/null | grep -q "herdr-sidebar"; then
    log_info "Installing plugin herdr-sidebar..."
    herdr plugin install alexarthurs/herdr-sidebar/plugins/herdr-sidebar -y 2>/dev/null || true
  fi
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
