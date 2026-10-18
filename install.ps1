# Requires -Version 7.0
<#
.SYNOPSIS
    Universal dotsfiles installer for Windows (PowerShell 7+).
    Deploys configurations, shared/individual skills, centralized secrets, and installs harnesses natively.
.DESCRIPTION
    Installs:
    - Centralized secrets in $HOME\.config\dotsfiles\
    - Symlinks / directory links for ~/.agents -> shared
    - Pi coding agent configuration & npm dependencies
    - Claude Code configuration & rules pointer
    - OpenCode configuration, plugins & instructions
    - Hermes configuration
    - Antigravity / agy configuration
    - Herdr configuration & integration hooks
    - Distributes shared and custom skills to all harnesses
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# Ensure running in PowerShell 7+
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Error "Este script requiere PowerShell 7 o superior (pwsh). Versión actual: $($PSVersionTable.PSVersion)"
    exit 1
}

$DOTS_DIR = $PSScriptRoot
$USER_HOME = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::UserProfile)

function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
Write-Info "Iniciando instalación de dotsfiles para Windows..."
function Write-Success { param([string]$Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }

function Link-OrCopy {
    param(
        [Parameter(Mandatory=$true)][string]$Source,
        [Parameter(Mandatory=$true)][string]$Destination
    )
    $parent = Split-Path -Parent $Destination
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    if (Test-Path $Destination) {
        Remove-Item -Path $Destination -Recurse -Force -ErrorAction SilentlyContinue
    }

    try {
        if (Test-Path -Path $Source -PathType Container) {
            # Directory symlink or junction
            New-Item -ItemType SymbolicLink -Path $Destination -Target $Source -Force -ErrorAction Stop | Out-Null
        } else {
            # File symlink or hardlink
            New-Item -ItemType SymbolicLink -Path $Destination -Target $Source -Force -ErrorAction Stop | Out-Null
        }
        Write-Host "  -> Enlace creado: $Destination -> $Source"
    } catch {
        # Fallback to copy if developer mode / privileges don't allow symlinks
        Copy-Item -Path $Source -Destination $Destination -Recurse -Force
        Write-Host "  -> Copiado: $Destination"
    }
}

# --- 1. Native Installation of Harnesses via winget / npm / choco / scoop ---
Write-Info "Comprobando e instalando harnesses nativos..."

function Install-NativeTool {
    param([string]$Name)

    if (Get-Command $Name -ErrorAction SilentlyContinue) {
        Write-Success "$Name ya se encuentra instalado."
        return
    }

    Write-Info "Instalando $Name..."
    switch ($Name) {
        'pi' {
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                npm install -g @earendil-works/pi-coding-agent
            } else {
                Write-Warn "npm no encontrado; instala Node.js primero para pi."
            }
        }
        'claude' {
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                npm install -g @anthropic-ai/claude-code
            } elseif (Get-Command winget -ErrorAction SilentlyContinue) {
                winget install Anthropic.ClaudeCode -e --silent
            }
        }
        'opencode' {
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                npm install -g opencode-ai
            }
        }
        'hermes' {
            if (Get-Command scoop -ErrorAction SilentlyContinue) {
                scoop install hermes
            } else {
                Write-Warn "Instala hermes para Windows según la documentación oficial o uv/pipx."
            }
        }
        'agy' {
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                npm install -g antigravity-cli
            }
        }
        'herdr' {
            if (Get-Command scoop -ErrorAction SilentlyContinue) {
                scoop install herdr
            } elseif (Get-Command winget -ErrorAction SilentlyContinue) {
                winget install herdr -e --silent
            }
        }
    }
}

foreach ($tool in @('pi', 'claude', 'opencode', 'hermes', 'agy', 'herdr')) {
    Install-NativeTool -Name $tool
}

# --- 2. Centralized Secrets in ~/.config/dotsfiles/ ---
Write-Info "Configurando almacén central de tokens y secretos..."
$DotsConfigDir = Join-Path $USER_HOME ".config" "dotsfiles"
if (-not (Test-Path $DotsConfigDir)) {
    New-Item -ItemType Directory -Path $DotsConfigDir -Force | Out-Null
}

$EnvFile = Join-Path $DotsConfigDir "tokens.env"
$JsonFile = Join-Path $DotsConfigDir "tokens.json"

if (-not (Test-Path $EnvFile)) {
    Copy-Item -Path (Join-Path $DOTS_DIR "secrets" "tokens.env.example") -Destination $EnvFile
    Write-Info "Creado $EnvFile (completa tus credenciales allí)"
}

if (-not (Test-Path $JsonFile)) {
    Copy-Item -Path (Join-Path $DOTS_DIR "secrets" "tokens.json.example") -Destination $JsonFile
    Write-Info "Creado $JsonFile"
}

# --- 3. Setup ~/.agents Shared Truth ---
Write-Info "Enlazando ~/.agents a shared..."
$SharedDir = Join-Path $DOTS_DIR "shared"
$AgentsTarget = Join-Path $USER_HOME ".agents"
Link-OrCopy -Source $SharedDir -Destination $AgentsTarget
Write-Success "$AgentsTarget enlazado a $SharedDir"

# --- 4. Deploy Pi Configuration ---
Write-Info "Desplegando configuración de Pi Coding Agent..."
$PiAgentDir = Join-Path $USER_HOME ".pi" "agent"
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "agents") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "extensions") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "npm") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "pi-subagents") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "skills") -Force | Out-Null

Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "settings.json") -Destination (Join-Path $PiAgentDir "settings.json") -Force
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "pi-slate.json")) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "pi-slate.json") -Destination (Join-Path $PiAgentDir "pi-slate.json") -Force
}
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "npm" "package.json")) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "npm" "package.json") -Destination (Join-Path $PiAgentDir "npm" "package.json") -Force
}

# Agentes de Pi
$PiAgentsSrc = Join-Path $DOTS_DIR "harnesses" "pi" "agent" "agents"
if (Test-Path $PiAgentsSrc) {
    Copy-Item -Path "$PiAgentsSrc\*" -Destination (Join-Path $PiAgentDir "agents") -Recurse -Force
}

# Extensiones de Pi
$PiExtSrc = Join-Path $DOTS_DIR "harnesses" "pi" "agent" "extensions"
if (Test-Path $PiExtSrc) {
    Copy-Item -Path "$PiExtSrc\*" -Destination (Join-Path $PiAgentDir "extensions") -Recurse -Force
}

# Instalar dependencias npm de Pi
if ((Get-Command npm -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $PiAgentDir "npm"))) {
    Write-Info "Instalando paquetes npm de Pi..."
    Push-Location (Join-Path $PiAgentDir "npm")
    try {
        npm install --silent
    } catch {
        Write-Warn "Fallo no crítico en npm install de Pi"
    } finally {
        Pop-Location
    }
}

# --- 5. Deploy Claude Code Configuration ---
Write-Info "Desplegando configuración de Claude Code..."
$ClaudeDir = Join-Path $USER_HOME ".claude"
New-Item -ItemType Directory -Path (Join-Path $ClaudeDir "hooks") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $ClaudeDir "skills") -Force | Out-Null

if (-not (Test-Path (Join-Path $ClaudeDir "settings.json")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "claude" "settings.json"))) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "claude" "settings.json") -Destination (Join-Path $ClaudeDir "settings.json")
}

$AgentsMdPath = (Join-Path $AgentsTarget "rules" "AGENTS.md").Replace('\', '/')
$ClaudeMdContent = @"
# Global Claude Instructions
Importing common rules and instructions from dotsfiles:
@$AgentsMdPath
"@
Set-Content -Path (Join-Path $ClaudeDir "CLAUDE.md") -Value $ClaudeMdContent -Encoding UTF8

# --- 6. Deploy OpenCode Configuration ---
Write-Info "Desplegando configuración de OpenCode..."
$OpenCodeDir = Join-Path $USER_HOME ".config" "opencode"
New-Item -ItemType Directory -Path (Join-Path $OpenCodeDir "plugins") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OpenCodeDir "skills") -Force | Out-Null

if (-not (Test-Path (Join-Path $OpenCodeDir "opencode.jsonc")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "opencode" "opencode.jsonc"))) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "opencode" "opencode.jsonc") -Destination (Join-Path $OpenCodeDir "opencode.jsonc")
}
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "opencode" "tui.jsonc")) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "opencode" "tui.jsonc") -Destination (Join-Path $OpenCodeDir "tui.jsonc") -Force
}
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "opencode" "herdr-tui-session.js")) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "opencode" "herdr-tui-session.js") -Destination (Join-Path $OpenCodeDir "herdr-tui-session.js") -Force
}
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "opencode" "plugins")) {
    Copy-Item -Path "$DOTS_DIR\harnesses\opencode\plugins\*" -Destination (Join-Path $OpenCodeDir "plugins") -Recurse -Force
}
Set-Content -Path (Join-Path $OpenCodeDir "AGENTS.md") -Value "> **Cross-Agent Parity**: follow the rule in \`$AgentsMdPath\`." -Encoding UTF8

# --- 7. Deploy Hermes Configuration ---
Write-Info "Desplegando configuración de Hermes..."
$HermesDir = Join-Path $USER_HOME ".hermes"
New-Item -ItemType Directory -Path (Join-Path $HermesDir "skills") -Force | Out-Null
if (-not (Test-Path (Join-Path $HermesDir "config.yaml")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "hermes" "config.yaml"))) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "hermes" "config.yaml") -Destination (Join-Path $HermesDir "config.yaml")
}

# --- 8. Deploy Antigravity (agy) Configuration ---
Write-Info "Desplegando configuración de Antigravity (agy)..."
$GeminiConfig = Join-Path $USER_HOME ".gemini" "config"
$GeminiAgy = Join-Path $USER_HOME ".gemini" "antigravity-cli"
New-Item -ItemType Directory -Path (Join-Path $GeminiConfig "skills") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $GeminiConfig "hooks") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $GeminiAgy "skills") -Force | Out-Null

if (-not (Test-Path (Join-Path $GeminiConfig "mcp_config.json")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "antigravity" "mcp_config.json"))) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "antigravity" "mcp_config.json") -Destination (Join-Path $GeminiConfig "mcp_config.json")
}
if (-not (Test-Path (Join-Path $GeminiAgy "settings.json")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "antigravity" "agy-settings.json"))) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "antigravity" "agy-settings.json") -Destination (Join-Path $GeminiAgy "settings.json")
}

# --- 9. Deploy Herdr Configuration & herdr-sidebar ---
Write-Info "Desplegando configuración de Herdr y herdr-sidebar..."
$HerdrDir = Join-Path $USER_HOME ".config" "herdr"
New-Item -ItemType Directory -Path $HerdrDir -Force | Out-Null

# Copiar scripts auxiliares de dotsfiles
$DotsBinDir = Join-Path $USER_HOME ".config" "dotsfiles" "bin"
New-Item -ItemType Directory -Path $DotsBinDir -Force | Out-Null
if (Test-Path (Join-Path $DOTS_DIR "bin")) {
    Copy-Item -Path "$DOTS_DIR\bin\*" -Destination $DotsBinDir -Recurse -Force -ErrorAction SilentlyContinue
}

Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "herdr" "config.toml") -Destination (Join-Path $HerdrDir "config.toml") -Force
Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "herdr" "plugins.json") -Destination (Join-Path $HerdrDir "plugins.json") -Force

# Desplegar estado persistente de herdr-sidebar
$SidebarStateDir = Join-Path $USER_HOME ".local" "state" "herdr" "plugins" "herdr-sidebar"
New-Item -ItemType Directory -Path $SidebarStateDir -Force | Out-Null
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "herdr" "state")) {
    Copy-Item -Path "$DOTS_DIR\harnesses\herdr\state\*" -Destination $SidebarStateDir -Recurse -Force
}

if (Get-Command herdr -ErrorAction SilentlyContinue) {
    Write-Info "Instalando e integrando plugins de Herdr..."
    herdr plugin install alexarthurs/herdr-sidebar/plugins/herdr-sidebar -y 2>$null
    herdr plugin install senna-lang/herdr-agent-usage -y 2>$null
    herdr plugin install kryptamine/herdr-auto-title -y 2>$null
    herdr plugin action invoke herdr.auto-title.restart 2>$null
    herdr integration install pi 2>$null
    herdr integration install claude 2>$null
    herdr integration install opencode 2>$null
    herdr integration install hermes 2>$null
    herdr integration install antigravity-cli 2>$null
}

# --- 10. Distribute Shared & Individual Skills ---
Write-Info "Distribuyendo skills compartidas a cada harness..."

$HarnessSkillDirs = @(
    (Join-Path $USER_HOME ".pi" "agent" "skills"),
    (Join-Path $USER_HOME ".claude" "skills"),
    (Join-Path $USER_HOME ".config" "opencode" "skills"),
    (Join-Path $USER_HOME ".hermes" "skills"),
    (Join-Path $USER_HOME ".gemini" "config" "skills"),
    (Join-Path $USER_HOME ".gemini" "antigravity-cli" "skills")
)

# A) Shared skills
$SharedSkillsDir = Join-Path $DOTS_DIR "shared" "skills"
if (Test-Path $SharedSkillsDir) {
    Get-ChildItem -Path $SharedSkillsDir -Directory | ForEach-Object {
        $skillName = $_.Name
        $src = $_.FullName
        foreach ($targetDir in $HarnessSkillDirs) {
            Link-OrCopy -Source $src -Destination (Join-Path $targetDir $skillName)
        }
    }
}

# B) Individual / Harness-specific skills
$harnessMap = @{
    'pi' = (Join-Path $USER_HOME ".pi" "agent" "skills");
    'claude' = (Join-Path $USER_HOME ".claude" "skills");
    'opencode' = (Join-Path $USER_HOME ".config" "opencode" "skills");
    'hermes' = (Join-Path $USER_HOME ".hermes" "skills");
    'antigravity' = (Join-Path $USER_HOME ".gemini" "antigravity-cli" "skills")
}

foreach ($harness in $harnessMap.Keys) {
    $customSkillsDir = Join-Path $DOTS_DIR "harnesses" $harness "skills"
    if (Test-Path $customSkillsDir) {
        $target = $harnessMap[$harness]
        Get-ChildItem -Path $customSkillsDir -Directory | ForEach-Object {
            Write-Info "Instalando skill individual de $harness: $($_.Name)"
            Link-OrCopy -Source $_.FullName -Destination (Join-Path $target $_.Name)
        }
    }
}

Write-Success "¡Instalación en Windows completada exitosamente!"
Write-Info "Recuerda definir tus claves en $JsonFile o $EnvFile."
