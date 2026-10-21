# Requires -Version 7.0
<#
.SYNOPSIS
    Universal dotsfiles installer for Windows (PowerShell 7+).
    Deploys configurations, shared skills, centralized secrets, and harnesses.
.DESCRIPTION
    Installs:
    - Centralized secrets in $HOME\.config\dotsfiles\
    - Symlinks / directory links for ~/.agents -> shared
    - Pi coding agent configuration & npm dependencies
    - Pi-TUI-Plus (pi-plus CLI) build and global link
    - Claude Code configuration & rules directives
    - OpenCode / OpenCode2 configuration, plugins & instructions
    - Hermes configuration
    - Antigravity / agy configuration
    - Herdr configuration & plugins
    - Distributes shared canonical skills to all harnesses
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# Ensure running in PowerShell 7+
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Error "This script requires PowerShell 7 or higher (pwsh). Current version: $($PSVersionTable.PSVersion)"
    exit 1
}

$DOTS_DIR = $PSScriptRoot
$USER_HOME = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::UserProfile)

function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }

Write-Info "Starting dotsfiles installation for Windows..."

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
        New-Item -ItemType SymbolicLink -Path $Destination -Target $Source -Force -ErrorAction Stop | Out-Null
        Write-Host "  -> Linked: $Destination -> $Source"
    } catch {
        Copy-Item -Path $Source -Destination $Destination -Recurse -Force
        Write-Host "  -> Copied: $Destination (symlinks not supported)"
    }
}

# --- 1. Native Installation of Harnesses via winget / npm / scoop ---
Write-Info "Checking and installing native harnesses..."

# Detect which OpenCode executable is present (opencode or opencode2)
$OpenCodeCmd = $null
if (Get-Command opencode2 -ErrorAction SilentlyContinue) {
    $OpenCodeCmd = "opencode2"
    Write-Success "Detected installed binary: opencode2"
} elseif (Get-Command opencode -ErrorAction SilentlyContinue) {
    $OpenCodeCmd = "opencode"
    Write-Success "Detected installed binary: opencode"
}

function Install-NativeTool {
    param([string]$Name)

    if (Get-Command $Name -ErrorAction SilentlyContinue) {
        Write-Success "$Name is already installed."
        return
    }

    Write-Info "Installing $Name..."
    switch ($Name) {
        'pi' {
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                npm install -g @earendil-works/pi-coding-agent
            } else {
                Write-Warn "npm not found; please install Node.js first for pi."
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
            if ($OpenCodeCmd) {
                Write-Success "$OpenCodeCmd is already installed."
            } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
                npm install -g opencode-ai
                $script:OpenCodeCmd = "opencode"
            }
        }
        'hermes' {
            if (Get-Command scoop -ErrorAction SilentlyContinue) {
                scoop install hermes
            } else {
                Write-Warn "Please install hermes for Windows according to official documentation or uv/pipx."
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
Write-Info "Configuring centralized secrets store..."
$DotsConfigDir = Join-Path $USER_HOME ".config" "dotsfiles"
if (-not (Test-Path $DotsConfigDir)) {
    New-Item -ItemType Directory -Path $DotsConfigDir -Force | Out-Null
}

$EnvFile = Join-Path $DotsConfigDir "tokens.env"
$JsonFile = Join-Path $DotsConfigDir "tokens.json"

if (-not (Test-Path $EnvFile)) {
    Copy-Item -Path (Join-Path $DOTS_DIR "secrets" "tokens.env.example") -Destination $EnvFile
    Write-Info "Created $EnvFile (fill your API credentials there)"
}

if (-not (Test-Path $JsonFile)) {
    Copy-Item -Path (Join-Path $DOTS_DIR "secrets" "tokens.json.example") -Destination $JsonFile
    Write-Info "Created $JsonFile"
}

# --- 3. Link ~/.agents (Canonical Single Source of Truth) ---
Write-Info "Linking ~/.agents to $DOTS_DIR\shared ..."
$AgentsTarget = Join-Path $USER_HOME ".agents"
$SharedSource = Join-Path $DOTS_DIR "shared"
Link-OrCopy -Source $SharedSource -Destination $AgentsTarget
Write-Success "~/.agents -> $SharedSource"

# --- 4. Deploy Pi Coding Agent Configuration ---
Write-Info "Deploying Pi Coding Agent configuration..."
$PiAgentDir = Join-Path $USER_HOME ".pi" "agent"
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "agents") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "extensions") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "npm") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "pi-subagents") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "skills") -Force | Out-Null

Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "settings.json") -Destination (Join-Path $PiAgentDir "settings.json") -Force
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "mcp.json")) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "mcp.json") -Destination (Join-Path $PiAgentDir "mcp.json") -Force
}
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "pi-slate.json")) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "pi-slate.json") -Destination (Join-Path $PiAgentDir "pi-slate.json") -Force
}
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "npm" "package.json")) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "npm" "package.json") -Destination (Join-Path $PiAgentDir "npm" "package.json") -Force
}

# Pi agents
$PiAgentsSrc = Join-Path $DOTS_DIR "harnesses" "pi" "agent" "agents"
if (Test-Path $PiAgentsSrc) {
    Copy-Item -Path "$PiAgentsSrc\*" -Destination (Join-Path $PiAgentDir "agents") -Recurse -Force
}

# Pi extensions
$PiExtSrc = Join-Path $DOTS_DIR "harnesses" "pi" "agent" "extensions"
if (Test-Path $PiExtSrc) {
    Copy-Item -Path "$PiExtSrc\*" -Destination (Join-Path $PiAgentDir "extensions") -Recurse -Force
}

# Install Pi npm dependencies
if ((Get-Command npm -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $PiAgentDir "npm"))) {
    Write-Info "Installing Pi extension packages..."
    Push-Location (Join-Path $PiAgentDir "npm")
    try {
        npm install --silent
    } catch {
        Write-Warn "Non-critical warning on Pi npm install"
    } finally {
        Pop-Location
    }
}

# Build and install pi-tui-plus
$PiTuiPlusDir = Join-Path $DOTS_DIR "pi-tui-plus"
if (Test-Path $PiTuiPlusDir) {
    Write-Info "Building and linking pi-tui-plus (pi-plus CLI)..."
    Push-Location $PiTuiPlusDir
    try {
        if (Get-Command pnpm -ErrorAction SilentlyContinue) {
            pnpm install --silent
            pnpm run build --silent
        } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
            npm install --silent
            npm run build --silent
        }
        npm link 2>$null
    } catch {
        Write-Warn "Non-critical warning during pi-tui-plus compilation"
    } finally {
        Pop-Location
    }
}

# --- 5. Deploy Claude Code Configuration ---
Write-Info "Deploying Claude Code configuration..."
$ClaudeDir = Join-Path $USER_HOME ".claude"
New-Item -ItemType Directory -Path (Join-Path $ClaudeDir "hooks") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $ClaudeDir "skills") -Force | Out-Null

if (-not (Test-Path (Join-Path $ClaudeDir "settings.json")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "claude" "settings.json"))) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "claude" "settings.json") -Destination (Join-Path $ClaudeDir "settings.json")
}

$ClaudeMdSrc = Join-Path $DOTS_DIR "harnesses" "claude" "CLAUDE.md"
if (Test-Path $ClaudeMdSrc) {
    Copy-Item -Path $ClaudeMdSrc -Destination (Join-Path $ClaudeDir "CLAUDE.md") -Force
} else {
    $AgentsMdPath = (Join-Path $AgentsTarget "rules" "AGENTS.md").Replace('\', '/')
    $ClaudeMdContent = @"
# Global Claude Instructions
Importing common rules and instructions from dotsfiles:
@$AgentsMdPath
"@
    Set-Content -Path (Join-Path $ClaudeDir "CLAUDE.md") -Value $ClaudeMdContent -Encoding UTF8
}

if (Get-Command claude -ErrorAction SilentlyContinue) {
    claude mcp add -s user playwright -- npx -y @playwright/mcp@latest --headless 2>$null
    claude mcp add -s user memory -- npx -y @modelcontextprotocol/server-memory 2>$null
    claude mcp add -s user fetch -- uvx mcp-server-fetch 2>$null
}

# --- 6. Deploy OpenCode Configuration (Only for detected version) ---
if ($OpenCodeCmd) {
    Write-Info "Deploying configuration for $OpenCodeCmd..."
    $OpenCodeDir = Join-Path $USER_HOME ".config" $OpenCodeCmd
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
    $AgentsMdPath = (Join-Path $AgentsTarget "rules" "AGENTS.md").Replace('\', '/')
    Set-Content -Path (Join-Path $OpenCodeDir "AGENTS.md") -Value "> **Cross-Agent Parity**: follow the rule in \`$AgentsMdPath\`." -Encoding UTF8
}

# --- 7. Deploy Hermes Configuration ---
Write-Info "Deploying Hermes Agent configuration..."
$HermesDir = Join-Path $USER_HOME ".hermes"
New-Item -ItemType Directory -Path (Join-Path $HermesDir "skills") -Force | Out-Null
if (-not (Test-Path (Join-Path $HermesDir "config.yaml")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "hermes" "config.yaml"))) {
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "hermes" "config.yaml") -Destination (Join-Path $HermesDir "config.yaml")
}

# --- 8. Deploy Antigravity (agy) Configuration ---
Write-Info "Deploying Antigravity (agy) configuration..."
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

# --- 9. Deploy Herdr Configuration & Plugins ---
Write-Info "Deploying Herdr configuration and plugins..."
$HerdrDir = Join-Path $USER_HOME ".config" "herdr"
New-Item -ItemType Directory -Path $HerdrDir -Force | Out-Null

$DotsBinDir = Join-Path $USER_HOME ".config" "dotsfiles" "bin"
New-Item -ItemType Directory -Path $DotsBinDir -Force | Out-Null
if (Test-Path (Join-Path $DOTS_DIR "bin")) {
    Copy-Item -Path "$DOTS_DIR\bin\*" -Destination $DotsBinDir -Recurse -Force -ErrorAction SilentlyContinue
}

Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "herdr" "config.toml") -Destination (Join-Path $HerdrDir "config.toml") -Force
Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "herdr" "plugins.json") -Destination (Join-Path $HerdrDir "plugins.json") -Force

# Deploy persistent state for herdr-sidebar
$SidebarStateDir = Join-Path $USER_HOME ".local" "state" "herdr" "plugins" "herdr-sidebar"
New-Item -ItemType Directory -Path $SidebarStateDir -Force | Out-Null
if (Test-Path (Join-Path $DOTS_DIR "harnesses" "herdr" "state")) {
    Copy-Item -Path "$DOTS_DIR\harnesses\herdr\state\*" -Destination $SidebarStateDir -Recurse -Force
}

if (Get-Command herdr -ErrorAction SilentlyContinue) {
    Write-Info "Installing Herdr plugins and integrations..."
    herdr plugin install alexarthurs/herdr-sidebar/plugins/herdr-sidebar -y 2>$null
    herdr plugin install senna-lang/herdr-agent-usage -y 2>$null
    herdr plugin install kryptamine/herdr-auto-title -y 2>$null
    herdr plugin action invoke herdr.auto-title.restart 2>$null
    herdr plugin install adihex/herdr-agent-icons -y 2>$null
    herdr plugin action invoke local.agent-icons.install-font 2>$null
    herdr plugin install JanTvrdik/herdr-command-palette -y 2>$null
    herdr plugin install persiyanov/herdr-reviewr -y 2>$null
    herdr plugin install tdi/herdr-worktree-setup -y 2>$null
    herdr plugin install ezcorp-org/herdr-pc-ram-and-cpu-usage-overlay -y 2>$null
    herdr integration install pi 2>$null
    herdr integration install claude 2>$null
    if ($OpenCodeCmd) {
        herdr integration install opencode 2>$null
    }
    herdr integration install hermes 2>$null
    herdr integration install antigravity-cli 2>$null
}

# --- 10. Distribute Shared Canonical Skills ---
Write-Info "Distributing shared canonical skills to harnesses..."

$HarnessSkillDirs = @(
    (Join-Path $USER_HOME ".pi" "agent" "skills"),
    (Join-Path $USER_HOME ".claude" "skills"),
    (Join-Path $USER_HOME ".hermes" "skills"),
    (Join-Path $USER_HOME ".gemini" "config" "skills"),
    (Join-Path $USER_HOME ".gemini" "antigravity-cli" "skills")
)
if ($OpenCodeCmd) {
    $HarnessSkillDirs += (Join-Path $USER_HOME ".config" $OpenCodeCmd "skills")
}

# Shared skills
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

Write-Success "Windows installation completed successfully!"
Write-Info "Remember to define your API tokens in $JsonFile or $EnvFile."
