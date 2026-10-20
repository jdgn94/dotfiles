#!/usr/bin/env bash
#
# install.sh - Universal installer for dotsfiles harnesses, configurations, shared skills, and secrets.
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
log_info "Sistema detectado: $OS"

# --- Helper: Link or copy ---
link_or_copy() {
  local src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  rm -rf "$dst"
  if ln -sf "$src" "$dst" 2>/dev/null; then
    echo "  -> Enlace creado: $dst -> $src"
  else
    cp -r "$src" "$dst"
    echo "  -> Copiado: $dst (symlinks no soportados)"
  fi
}

# --- 1. Harnesses Native Installation ---
log_info "Comprobando e instalando harnesses faltantes..."

install_harness_binary() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    log_success "$name ya está instalado ($(command -v "$name"))"
    return 0
  fi

  log_info "Instalando $name..."
  case "$name" in
    pi)
      if command -v npm >/dev/null 2>&1; then
        npm install -g @earendil-works/pi-coding-agent || log_warn "Fallo al instalar pi vía npm"
      else
        log_warn "npm no encontrado; instala Node.js para instalar pi"
      fi
      ;;
    claude)
      if command -v npm >/dev/null 2>&1; then
        npm install -g @anthropic-ai/claude-code || log_warn "Fallo al instalar claude vía npm"
      elif command -v brew >/dev/null 2>&1; then
        brew install claude-code || true
      else
        log_warn "npm o brew requerido para instalar claude"
      fi
      ;;
    opencode)
      if command -v npm >/dev/null 2>&1; then
        npm install -g opencode-ai || true
      else
        curl -fsSL https://opencode.ai/install.sh | bash || log_warn "Fallo al descargar opencode"
      fi
      ;;
    hermes)
      if command -v curl >/dev/null 2>&1; then
        curl -fsSL https://raw.githubusercontent.com/nousresearch/hermes-agent/main/install.sh | bash || log_warn "No se pudo instalar hermes automáticamente"
      fi
      ;;
    antigravity|agy)
      if [ "$OS" = "linux" ] && command -v yay >/dev/null 2>&1; then
        yay -S --noconfirm antigravity-cli || log_warn "Fallo al instalar antigravity-cli vía yay"
      elif command -v npm >/dev/null 2>&1; then
        npm install -g antigravity-cli || true
      fi
      ;;
    herdr)
      if [ "$OS" = "linux" ] && command -v yay >/dev/null 2>&1; then
        yay -S --noconfirm herdr || true
      elif command -v curl >/dev/null 2>&1; then
        curl -fsSL https://herdr.dev/install.sh | bash || true
      fi
      ;;
  esac
}

for tool in pi claude opencode hermes agy herdr; do
  install_harness_binary "$tool" || true
done

# --- 2. Configurar Directorio Central de Tokens / Secrets ---
log_info "Configurando secretos centralizados en ~/.config/dotsfiles/ ..."
DOTSFILES_CONFIG_DIR="$HOME_DIR/.config/dotsfiles"
mkdir -p "$DOTSFILES_CONFIG_DIR"

if [ ! -f "$DOTSFILES_CONFIG_DIR/tokens.env" ]; then
  cp "$DOTS_DIR/secrets/tokens.env.example" "$DOTSFILES_CONFIG_DIR/tokens.env"
  chmod 600 "$DOTSFILES_CONFIG_DIR/tokens.env"
  log_info "Creado $DOTSFILES_CONFIG_DIR/tokens.env (completa tus claves allí)"
else
  log_info "$DOTSFILES_CONFIG_DIR/tokens.env ya existe. No se sobreescribe."
fi

if [ ! -f "$DOTSFILES_CONFIG_DIR/tokens.json" ]; then
  cp "$DOTS_DIR/secrets/tokens.json.example" "$DOTSFILES_CONFIG_DIR/tokens.json"
  chmod 600 "$DOTSFILES_CONFIG_DIR/tokens.json"
  log_info "Creado $DOTSFILES_CONFIG_DIR/tokens.json"
fi

# --- 3. Configurar ~/.agents (Fuente de la verdad compartida) ---
log_info "Enlazando ~/.agents a $DOTS_DIR/shared ..."
AGENTS_LINK="$HOME_DIR/.agents"
rm -rf "$AGENTS_LINK"
ln -s "$DOTS_DIR/shared" "$AGENTS_LINK"
log_success "~/.agents -> $DOTS_DIR/shared"

# --- 4. Desplegar Configuración de PI ---
log_info "Desplegando configuración de Pi Coding Agent..."
PI_DIR="$HOME_DIR/.pi/agent"
mkdir -p "$PI_DIR/agents" "$PI_DIR/extensions" "$PI_DIR/npm" "$PI_DIR/pi-subagents" "$PI_DIR/skills"

# Copiar configuraciones base
cp "$DOTS_DIR/harnesses/pi/agent/settings.json" "$PI_DIR/settings.json"
[ -f "$DOTS_DIR/harnesses/pi/agent/mcp.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/mcp.json" "$PI_DIR/mcp.json"
[ -f "$DOTS_DIR/harnesses/pi/agent/pi-slate.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/pi-slate.json" "$PI_DIR/pi-slate.json"
[ -f "$DOTS_DIR/harnesses/pi/agent/mcp-onboarding.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/mcp-onboarding.json" "$PI_DIR/mcp-onboarding.json"
[ -f "$DOTS_DIR/harnesses/pi/agent/npm/package.json" ] && cp "$DOTS_DIR/harnesses/pi/agent/npm/package.json" "$PI_DIR/npm/package.json"

# Copiar agentes de Pi
if [ -d "$DOTS_DIR/harnesses/pi/agent/agents" ]; then
  cp -r "$DOTS_DIR/harnesses/pi/agent/agents/"* "$PI_DIR/agents/" 2>/dev/null || true
fi

# Copiar extensiones de Pi
if [ -d "$DOTS_DIR/harnesses/pi/agent/extensions" ]; then
  cp -r "$DOTS_DIR/harnesses/pi/agent/extensions/"* "$PI_DIR/extensions/" 2>/dev/null || true
fi

# Instalar dependencias npm de Pi si no están instaladas
if [ -d "$PI_DIR/npm" ] && command -v npm >/dev/null 2>&1; then
  log_info "Instalando dependencias de extensiones de Pi..."
  (cd "$PI_DIR/npm" && npm install --silent 2>/dev/null || true)
fi

# --- 5. Desplegar Configuración de Claude Code ---
log_info "Desplegando configuración de Claude Code..."
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

# Rellenar CLAUDE.md apuntando a las reglas comunes
AGENTS_MD="$HOME_DIR/.agents/rules/AGENTS.md"
printf '# Global Claude Instructions\nImporting common rules and instructions from dotsfiles:\n@%s\n' "$AGENTS_MD" > "$CLAUDE_DIR/CLAUDE.md"

# Asegurar MCPs en Claude Code
if command -v claude >/dev/null 2>&1; then
  claude mcp add -s user playwright -- npx -y @playwright/mcp@latest --headless 2>/dev/null || true
fi

# --- 6. Desplegar Configuración de OpenCode ---
log_info "Desplegando configuración de OpenCode..."
OPENCODE_DIR="$HOME_DIR/.config/opencode"
mkdir -p "$OPENCODE_DIR/plugins" "$OPENCODE_DIR/skills"
if [ ! -f "$OPENCODE_DIR/opencode.jsonc" ]; then
  cp "$DOTS_DIR/harnesses/opencode/opencode.jsonc" "$OPENCODE_DIR/opencode.jsonc"
fi
[ -f "$DOTS_DIR/harnesses/opencode/tui.jsonc" ] && cp "$DOTS_DIR/harnesses/opencode/tui.jsonc" "$OPENCODE_DIR/tui.jsonc"
[ -f "$DOTS_DIR/harnesses/opencode/herdr-tui-session.js" ] && cp "$DOTS_DIR/harnesses/opencode/herdr-tui-session.js" "$OPENCODE_DIR/herdr-tui-session.js"
if [ -d "$DOTS_DIR/harnesses/opencode/plugins" ]; then
  cp -r "$DOTS_DIR/harnesses/opencode/plugins/"* "$OPENCODE_DIR/plugins/" 2>/dev/null || true
fi

# Configurar AGENTS.md en opencode
printf '> **Cross-Agent Parity**: follow the rule in `%s`.\n' "$AGENTS_MD" > "$OPENCODE_DIR/AGENTS.md"

# --- 7. Desplegar Configuración de Hermes ---
log_info "Desplegando configuración de Hermes..."
HERMES_DIR="$HOME_DIR/.hermes"
mkdir -p "$HERMES_DIR/skills"
if [ ! -f "$HERMES_DIR/config.yaml" ] && [ -f "$DOTS_DIR/harnesses/hermes/config.yaml" ]; then
  cp "$DOTS_DIR/harnesses/hermes/config.yaml" "$HERMES_DIR/config.yaml"
fi

# --- 8. Desplegar Configuración de Antigravity (agy / desktop) ---
log_info "Desplegando configuración de Antigravity (agy)..."
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

# --- 9. Desplegar Configuración de Herdr & herdr-sidebar ---
log_info "Desplegando configuración de Herdr y herdr-sidebar..."
HERDR_DIR="$HOME_DIR/.config/herdr"
mkdir -p "$HERDR_DIR"

# Copiar scripts auxiliares de dotsfiles (statusline, etc.)
DOTS_BIN_DIR="$HOME_DIR/.config/dotsfiles/bin"
mkdir -p "$DOTS_BIN_DIR"
if [ -d "$DOTS_DIR/bin" ]; then
  cp "$DOTS_DIR/bin/"* "$DOTS_BIN_DIR/" 2>/dev/null || true
  chmod +x "$DOTS_BIN_DIR/"*.sh 2>/dev/null || true
fi

# Copiar configuraciones de Herdr
cp "$DOTS_DIR/harnesses/herdr/config.toml" "$HERDR_DIR/config.toml"
cp "$DOTS_DIR/harnesses/herdr/plugins.json" "$HERDR_DIR/plugins.json"

# Desplegar estado persistente de herdr-sidebar (dock right, preview pane, nvim editor)
HERDR_SIDEBAR_STATE_DIR="$HOME_DIR/.local/state/herdr/plugins/herdr-sidebar"
mkdir -p "$HERDR_SIDEBAR_STATE_DIR"
if [ -d "$DOTS_DIR/harnesses/herdr/state" ]; then
  cp "$DOTS_DIR/harnesses/herdr/state/state.json" "$HERDR_SIDEBAR_STATE_DIR/state.json" 2>/dev/null || true
  cp "$DOTS_DIR/harnesses/herdr/state/editor-command.txt" "$HERDR_SIDEBAR_STATE_DIR/editor-command.txt" 2>/dev/null || true
fi

# Instalar plugins esenciales de Herdr si aún no están instalados
if command -v herdr >/dev/null 2>&1; then
  if ! herdr plugin list 2>/dev/null | grep -q "herdr-sidebar"; then
    log_info "Instalando plugin herdr-sidebar..."
    herdr plugin install alexarthurs/herdr-sidebar/plugins/herdr-sidebar -y 2>/dev/null || true
  fi
  if ! herdr plugin list 2>/dev/null | grep -q "usagebar"; then
    log_info "Instalando plugin herdr-agent-usage (usagebar)..."
    herdr plugin install senna-lang/herdr-agent-usage -y 2>/dev/null || true
  fi
  # Aplicar parches de usagebar (soporte para Antigravity y exclusión de agentes no utilizados)
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
    log_info "Instalando plugin herdr-auto-title..."
    herdr plugin install kryptamine/herdr-auto-title -y 2>/dev/null || true
    herdr plugin action invoke herdr.auto-title.restart 2>/dev/null || true
  fi
  if ! herdr plugin list 2>/dev/null | grep -q "local.agent-icons"; then
    log_info "Instalando plugin herdr-agent-icons..."
    herdr plugin install adihex/herdr-agent-icons -y 2>/dev/null || true
    herdr plugin action invoke local.agent-icons.install-font 2>/dev/null || true
  fi
fi

# Integraciones de Herdr automáticas si el comando herdr está disponible
if command -v herdr >/dev/null 2>&1; then
  log_info "Activando integraciones de Herdr en agentes instalados..."
  herdr integration install pi 2>/dev/null || true
  herdr integration install claude 2>/dev/null || true
  herdr integration install opencode 2>/dev/null || true
  herdr integration install hermes 2>/dev/null || true
  herdr integration install antigravity-cli 2>/dev/null || true
fi

# --- 10. Distribuir Skills Compartidas y Específicas a Cada Harness ---
log_info "Distribuyendo skills compartidas a cada harness..."

HARNESS_SKILL_DIRS=(
  "$HOME_DIR/.pi/agent/skills"
  "$HOME_DIR/.claude/skills"
  "$HOME_DIR/.config/opencode/skills"
  "$HOME_DIR/.hermes/skills"
  "$HOME_DIR/.gemini/config/skills"
  "$HOME_DIR/.gemini/antigravity-cli/skills"
)

# A) Enlazar todas las skills compartidas en cada harness
for s_dir in "$DOTS_DIR/shared/skills"/*; do
  [ -d "$s_dir" ] || continue
  skill_name="$(basename "$s_dir")"
  for target_dir in "${HARNESS_SKILL_DIRS[@]}"; do
    mkdir -p "$target_dir"
    link_or_copy "$DOTS_DIR/shared/skills/$skill_name" "$target_dir/$skill_name"
  done
done

# B) Enlazar skills individuales/específicas de cada harness si existen en dotsfiles
for harness in pi claude opencode hermes antigravity; do
  harness_custom_skills="$DOTS_DIR/harnesses/$harness/skills"
  if [ -d "$harness_custom_skills" ]; then
    case "$harness" in
      pi) target="$HOME_DIR/.pi/agent/skills" ;;
      claude) target="$HOME_DIR/.claude/skills" ;;
      opencode) target="$HOME_DIR/.config/opencode/skills" ;;
      hermes) target="$HOME_DIR/.hermes/skills" ;;
      antigravity) target="$HOME_DIR/.gemini/antigravity-cli/skills" ;;
    esac
    for s_dir in "$harness_custom_skills"/*; do
      [ -d "$s_dir" ] || continue
      skill_name="$(basename "$s_dir")"
      log_info "Instalando skill individual de $harness: $skill_name"
      link_or_copy "$s_dir" "$target/$skill_name"
    done
  fi
done

log_success "¡Instalación y sincronización completada exitosamente!"
log_info "Recuerda editar ~/.config/dotsfiles/tokens.env con tus credenciales y reiniciar tus terminales/agentes."
