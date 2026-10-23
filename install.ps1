# Requires -Version 7.0
<#
.SYNOPSIS
    Universal dotsfiles installer for Windows (PowerShell 7+).
    Deploys configurations, shared skills, centralized secrets, and harnesses.
    Only deploys configurations for harnesses that are actually installed on the system.
.DESCRIPTION
    Installs:
    - Centralized secrets in $HOME\.config\dotsfiles\
    - Symlinks / directory links for ~/.agents -> shared
    - Pi coding agent configuration & npm dependencies (if Pi is installed)
    - Pi-TUI-Plus (pi-plus CLI) build and global link
    - Claude Code configuration & rules directives (if Claude is installed)
    - OpenCode / OpenCode2 configuration, plugins & instructions (only for detected version)
    - Hermes configuration (if Hermes is installed)
    - Antigravity / agy configuration (if Antigravity is installed)
    - Herdr configuration & plugins (if Herdr is installed)
    - Distributes shared canonical skills only to installed harnesses
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

$PythonCmd = Get-Command python3 -ErrorAction SilentlyContinue
if (-not $PythonCmd) { $PythonCmd = Get-Command python -ErrorAction SilentlyContinue }

function Update-McpConfig {
    param(
        [Parameter(Mandatory=$true)][string]$Mode,
        [Parameter(Mandatory=$true)][string]$Path
    )
    if (-not $PythonCmd -or -not (Test-Path $Path)) { return }
    try {
        & $PythonCmd.Source (Join-Path $DOTS_DIR "scripts" "mcp-config.py") $Mode $Path | Out-Null
    } catch {
        Write-Warn "Could not merge MCP config at $Path"
    }
}

# --- 1. Detect Installed Harnesses ---
Write-Info "Detecting installed AI harnesses and multiplexers..."

$HasPi = (Get-Command pi -ErrorAction SilentlyContinue) -ne $null -or (Test-Path (Join-Path $DOTS_DIR "pi-tui-plus"))
$HasClaude = (Get-Command claude -ErrorAction SilentlyContinue) -ne $null
$HasOpenCode = $false
$OpenCodeCmd = $null

if (Get-Command opencode2 -ErrorAction SilentlyContinue) {
    $HasOpenCode = $true
    $OpenCodeCmd = "opencode2"
    Write-Success "OpenCode2 detected ($OpenCodeCmd)"
} elseif (Get-Command opencode -ErrorAction SilentlyContinue) {
    $HasOpenCode = $true
    $OpenCodeCmd = "opencode"
    Write-Success "OpenCode detected ($OpenCodeCmd)"
}

$HasHermes = (Get-Command hermes -ErrorAction SilentlyContinue) -ne $null
$HasAntigravity = (Get-Command agy -ErrorAction SilentlyContinue) -ne $null -or (Get-Command antigravity -ErrorAction SilentlyContinue) -ne $null -or (Test-Path (Join-Path $USER_HOME ".gemini"))
$HasHerdr = (Get-Command herdr -ErrorAction SilentlyContinue) -ne $null

if ($HasPi) { Write-Success "Pi Coding Agent / Pi-TUI-Plus detected" }
if ($HasClaude) { Write-Success "Claude Code detected" }
if ($HasHermes) { Write-Success "Hermes Agent detected" }
if ($HasAntigravity) { Write-Success "Antigravity detected" }
if ($HasHerdr) { Write-Success "Herdr multiplexer detected" }

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

# Context7 is the only MCP in the default set that needs a credential.
$Context7Token = $env:CONTEXT7_API_KEY
if (-not $Context7Token) {
    $EnvMatch = Select-String -Path $EnvFile -Pattern '^export CONTEXT7_API_KEY=(.*)$' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($EnvMatch) {
        $Value = $EnvMatch.Matches[0].Groups[1].Value.Trim()
        if ($Value.Length -ge 2) {
            $First = $Value.Substring(0, 1)
            $Last = $Value.Substring($Value.Length - 1, 1)
            if (($First -eq '"' -and $Last -eq '"') -or ($First -eq "'" -and $Last -eq "'")) {
                $Value = $Value.Substring(1, $Value.Length - 2)
            }
        }
        $Context7Token = $Value
    }
}
if (-not $Context7Token -and (Test-Path $JsonFile)) {
    try {
        $JsonData = Get-Content -Raw -Path $JsonFile | ConvertFrom-Json
        if ($JsonData.tokens.CONTEXT7_API_KEY) { $Context7Token = $JsonData.tokens.CONTEXT7_API_KEY }
    } catch {
        # ignore malformed JSON; the installer will leave it untouched
    }
}
if (-not $Context7Token -and [Environment]::UserInteractive) {
    $SecureToken = Read-Host "Context7 API key (leave empty to skip)" -AsSecureString
    $Bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)
    try {
        $Context7Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Bstr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr)
    }
}
if ($Context7Token) {
    $env:CONTEXT7_API_KEY = $Context7Token
    $EscapedToken = $Context7Token.Replace('"', '\"')
    $EnvLines = @(Get-Content -Path $EnvFile -ErrorAction SilentlyContinue)
    $FoundToken = $false
    foreach ($Line in $EnvLines) {
        if ($Line -match '^export CONTEXT7_API_KEY=') { $FoundToken = $true; break }
    }
    $EnvLines = @($EnvLines | ForEach-Object {
        if ($_ -match '^export CONTEXT7_API_KEY=') {
            "export CONTEXT7_API_KEY=`"$EscapedToken`""
        } else {
            $_
        }
    })
    if (-not $FoundToken) { $EnvLines += "export CONTEXT7_API_KEY=`"$EscapedToken`"" }
    Set-Content -Path $EnvFile -Value $EnvLines -Encoding UTF8

    $JsonData = Get-Content -Raw -Path $JsonFile | ConvertFrom-Json
    if ($null -eq $JsonData.tokens) {
        $JsonData | Add-Member -NotePropertyName tokens -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $JsonData.tokens | Add-Member -NotePropertyName CONTEXT7_API_KEY -NotePropertyValue $Context7Token -Force
    $JsonData | ConvertTo-Json -Depth 100 | Set-Content -Path $JsonFile -Encoding UTF8
    Write-Success "Context7 API key stored in centralized tokens."
} else {
    Write-Info "Context7 API key not set; the Context7 MCP will need it later."
}

# Tavily is the web-search MCP; it needs a key too.
$TavilyToken = $env:TAVILY_API_KEY
if (-not $TavilyToken -and $PythonCmd) {
    $TavilyToken = & $PythonCmd.Source (Join-Path $DOTS_DIR "scripts" "token.py") get $EnvFile $JsonFile "TAVILY_API_KEY" 2>$null
}
if (-not $TavilyToken -and [Environment]::UserInteractive) {
    $SecureTavily = Read-Host "Tavily API key (leave empty to skip)" -AsSecureString
    $BstrTavily = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureTavily)
    try {
        $TavilyToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($BstrTavily)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BstrTavily)
    }
}
if ($TavilyToken) {
    $env:TAVILY_API_KEY = $TavilyToken
    if ($PythonCmd) {
        & $PythonCmd.Source (Join-Path $DOTS_DIR "scripts" "token.py") set $EnvFile $JsonFile "TAVILY_API_KEY" $TavilyToken | Out-Null
    }
    Write-Success "Tavily API key stored in centralized tokens."
} else {
    Write-Info "Tavily API key not set; the Tavily MCP will need it later."
}

# Make the shared token file visible to every harness launched from a new shell.
$ProfilePath = $PROFILE.CurrentUserAllHosts
if ($ProfilePath) {
    $ProfileDir = Split-Path -Parent $ProfilePath
    if ($ProfileDir -and -not (Test-Path $ProfileDir)) {
        New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
    }
    $HasTokenBlock = (Test-Path $ProfilePath) -and (Select-String -Path $ProfilePath -SimpleMatch ">>> dotsfiles tokens >>>" -Quiet)
    if (-not $HasTokenBlock) {
        $TokenBlock = @'
# >>> dotsfiles tokens >>>
$__dotsfilesTokens = Join-Path $HOME ".config/dotsfiles/tokens.json"
if (Test-Path $__dotsfilesTokens) {
    $__tokens = (Get-Content -Raw $__dotsfilesTokens | ConvertFrom-Json).tokens
    foreach ($__token in $__tokens.PSObject.Properties) {
        if ($__token.Value) { Set-Item -Path "Env:$($__token.Name)" -Value $__token.Value }
    }
}
# <<< dotsfiles tokens <<<
'@
        Add-Content -Path $ProfilePath -Value $TokenBlock -Encoding UTF8
        Write-Info "Added tokens.json loading to $ProfilePath"
    }
}

# --- 3. Link ~/.agents (Canonical Single Source of Truth) ---
Write-Info "Linking ~/.agents to $DOTS_DIR\shared ..."
$AgentsTarget = Join-Path $USER_HOME ".agents"
$SharedSource = Join-Path $DOTS_DIR "shared"
Link-OrCopy -Source $SharedSource -Destination $AgentsTarget
Write-Success "~/.agents -> $SharedSource"

# --- 4. Deploy Pi Coding Agent Configuration ---
if ($HasPi) {
    Write-Info "Deploying Pi Coding Agent configuration..."
    $PiAgentDir = Join-Path $USER_HOME ".pi" "agent"
    New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "agents") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "extensions") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "npm") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "pi-subagents") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $PiAgentDir "skills") -Force | Out-Null

    Copy-Item -Path (Join-Path $AgentsTarget "AGENTS.md") -Destination (Join-Path $PiAgentDir "AGENTS.md") -Force

    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "settings.json") -Destination (Join-Path $PiAgentDir "settings.json") -Force
    if (Test-Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "mcp.json")) {
        Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "pi" "agent" "mcp.json") -Destination (Join-Path $PiAgentDir "mcp.json") -Force
        Update-McpConfig "pi" (Join-Path $PiAgentDir "mcp.json")
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
                pnpm run build
            } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
                npm install --silent
                npm run build
            }
            npm link 2>$null
        } catch {
            Write-Warn "Non-critical warning during pi-tui-plus compilation"
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Info "Pi Coding Agent not installed; skipping Pi configuration."
}

# --- 5. Deploy Claude Code Configuration ---
if ($HasClaude) {
    Write-Info "Deploying Claude Code configuration..."
    $ClaudeDir = Join-Path $USER_HOME ".claude"
    New-Item -ItemType Directory -Path (Join-Path $ClaudeDir "hooks") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $ClaudeDir "skills") -Force | Out-Null

    if (-not (Test-Path (Join-Path $ClaudeDir "settings.json")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "claude" "settings.json"))) {
        Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "claude" "settings.json") -Destination (Join-Path $ClaudeDir "settings.json")
    }

    New-Item -ItemType Directory -Path (Join-Path $ClaudeDir "rules") -Force | Out-Null
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "claude" "AGENTS.md") -Destination (Join-Path $ClaudeDir "AGENTS.md") -Force
    Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "claude" "CLAUDE.md") -Destination (Join-Path $ClaudeDir "CLAUDE.md") -Force
    Link-OrCopy -Source (Join-Path $ClaudeDir "AGENTS.md") -Destination (Join-Path $ClaudeDir "rules" "AGENTS.md")

    # Load project AGENTS.md beside CLAUDE.md; CLAUDE.md stays the entrypoint.
    $ClaudeSettingsPath = Join-Path $ClaudeDir "settings.json"
    if (-not (Test-Path $ClaudeSettingsPath)) {
        Set-Content -Path $ClaudeSettingsPath -Value "{}" -Encoding UTF8
    }
    $ClaudeSettings = Get-Content -Raw -Path $ClaudeSettingsPath | ConvertFrom-Json
    if ($null -eq $ClaudeSettings.pluginConfigs) {
        $ClaudeSettings | Add-Member -NotePropertyName pluginConfigs -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $PluginKey = "cc-plugin-agents-md@builtin"
    if ($null -eq $ClaudeSettings.pluginConfigs.$PluginKey) {
        $ClaudeSettings.pluginConfigs | Add-Member -NotePropertyName $PluginKey -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $AgentPlugin = $ClaudeSettings.pluginConfigs.$PluginKey
    if ($null -eq $AgentPlugin.options) {
        $AgentPlugin | Add-Member -NotePropertyName options -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $AgentPlugin.options | Add-Member -NotePropertyName instructionFiles -NotePropertyValue "claude-md-and-agents-md" -Force
    $ClaudeExcludes = @($ClaudeSettings.claudeMdExcludes) | Where-Object { $_ -and $_ -notin @("**/CLAUDE.md", "**/CLAUDE.local.md") }
    if ($ClaudeExcludes.Count -gt 0) {
        $ClaudeSettings | Add-Member -NotePropertyName claudeMdExcludes -NotePropertyValue $ClaudeExcludes -Force
    } else {
        $ClaudeSettings.PSObject.Properties.Remove("claudeMdExcludes")
    }
    $ClaudeSettings | ConvertTo-Json -Depth 100 | Set-Content -Path $ClaudeSettingsPath -Encoding UTF8

    claude mcp add -s user playwright -- npx -y @playwright/mcp@latest --headless 2>$null
    claude mcp add -s user memory -- npx -y @modelcontextprotocol/server-memory 2>$null
    claude mcp add -s user fetch -- uvx mcp-server-fetch 2>$null
    claude mcp add-json -s user context7 '{"type":"http","url":"https://mcp.context7.com/mcp","headers":{"Authorization":"Bearer ${CONTEXT7_API_KEY}"}}' 2>$null
    claude mcp add -s user browsermcp -- npx -y @browsermcp/mcp@latest 2>$null
    claude mcp add -s user tavily -e 'TAVILY_API_KEY=${TAVILY_API_KEY}' -- npx -y tavily-mcp 2>$null
    claude mcp add -s user osv -- npx -y @cyanheads/osv-advisory-mcp-server 2>$null
} else {
    Write-Info "Claude Code not installed; skipping Claude configuration."
}

# --- 6. Deploy OpenCode Configuration (Only for detected version) ---
if ($HasOpenCode -and $OpenCodeCmd) {
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

    foreach ($Cmd in @("opencode", "opencode2")) {
        $Cfg = Join-Path $USER_HOME ".config" $Cmd "opencode.jsonc"
        if (Test-Path $Cfg) { Update-McpConfig "opencode" $Cfg }
    }
} else {
    Write-Info "Neither OpenCode nor OpenCode2 installed; skipping OpenCode configuration."
}

# --- 7. Deploy Hermes Configuration ---
if ($HasHermes) {
    Write-Info "Deploying Hermes Agent configuration..."
    $HermesDir = Join-Path $USER_HOME ".hermes"
    New-Item -ItemType Directory -Path (Join-Path $HermesDir "skills") -Force | Out-Null
    if (-not (Test-Path (Join-Path $HermesDir "config.yaml")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "hermes" "config.yaml"))) {
        Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "hermes" "config.yaml") -Destination (Join-Path $HermesDir "config.yaml")
    }
    Update-McpConfig "hermes" (Join-Path $HermesDir "config.yaml")

    # Hermes injects SOUL.md globally every turn; point it at the canonical rules.
    $HermesSoul = Join-Path $HermesDir "SOUL.md"
    $SoulHasBlock = (Test-Path $HermesSoul) -and (Select-String -Path $HermesSoul -SimpleMatch "dotsfiles:begin" -Quiet)
    if (-not $SoulHasBlock) {
        $AgentsMdWin = (Join-Path $AgentsTarget "AGENTS.md").Replace('\', '/')
        Add-Content -Path $HermesSoul -Value "`n<!-- dotsfiles:begin -->`nMachine-wide rules: read and follow $AgentsMdWin before any non-trivial task.`n<!-- dotsfiles:end -->" -Encoding UTF8
    }
} else {
    Write-Info "Hermes Agent not installed; skipping Hermes configuration."
}

# --- 8. Deploy Antigravity (agy) Configuration ---
if ($HasAntigravity) {
    Write-Info "Deploying Antigravity (agy) configuration..."
    $GeminiConfig = Join-Path $USER_HOME ".gemini" "config"
    $GeminiAgy = Join-Path $USER_HOME ".gemini" "antigravity-cli"
    New-Item -ItemType Directory -Path (Join-Path $GeminiConfig "skills") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $GeminiConfig "hooks") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $GeminiAgy "skills") -Force | Out-Null

    # Antigravity discovers global rules in ~/.gemini and ~/.gemini/config.
    Copy-Item -Path (Join-Path $AgentsTarget "AGENTS.md") -Destination (Join-Path $GeminiConfig "AGENTS.md") -Force
    Copy-Item -Path (Join-Path $AgentsTarget "AGENTS.md") -Destination (Join-Path $USER_HOME ".gemini" "AGENTS.md") -Force

    if (-not (Test-Path (Join-Path $GeminiConfig "mcp_config.json")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "antigravity" "mcp_config.json"))) {
        Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "antigravity" "mcp_config.json") -Destination (Join-Path $GeminiConfig "mcp_config.json")
    }
    Update-McpConfig "antigravity" (Join-Path $GeminiConfig "mcp_config.json")
    if (-not (Test-Path (Join-Path $GeminiAgy "settings.json")) -and (Test-Path (Join-Path $DOTS_DIR "harnesses" "antigravity" "agy-settings.json"))) {
        Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "antigravity" "agy-settings.json") -Destination (Join-Path $GeminiAgy "settings.json")
    }
} else {
    Write-Info "Antigravity not installed; skipping Antigravity configuration."
}

# --- 9. Deploy Herdr Configuration & Plugins ---
if ($HasHerdr) {
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

    herdr plugin install senna-lang/herdr-agent-usage -y 2>$null
    herdr plugin install kryptamine/herdr-auto-title -y 2>$null
    herdr plugin action invoke herdr.auto-title.restart 2>$null
    herdr plugin install adihex/herdr-agent-icons -y 2>$null
    herdr plugin action invoke local.agent-icons.install-font 2>$null
    herdr plugin install JanTvrdik/herdr-command-palette -y 2>$null
    herdr plugin install persiyanov/herdr-reviewr -y 2>$null
    herdr plugin install tdi/herdr-worktree-setup -y 2>$null
    herdr plugin install ezcorp-org/herdr-pc-ram-and-cpu-usage-overlay -y 2>$null

    if ($HasPi) { herdr integration install pi 2>$null }
    if ($HasClaude) { herdr integration install claude 2>$null }
    if ($HasOpenCode) { herdr integration install opencode 2>$null }
    if ($HasHermes) { herdr integration install hermes 2>$null }
    if ($HasAntigravity) { herdr integration install antigravity-cli 2>$null }
} else {
    Write-Info "Herdr not installed; skipping Herdr configuration."
}

# --- 9b. Deploy Neovim (NvChad + neo-tree) and lazygit ---
$NvimDir = Join-Path $USER_HOME ".config" "nvim"
if (Get-Command nvim -ErrorAction SilentlyContinue) {
    Write-Info "Deploying Neovim / NvChad configuration..."
    if ((Test-Path (Join-Path $NvimDir "init.lua")) -and -not (Test-Path (Join-Path $NvimDir ".dotsfiles-managed"))) {
        $NvimBackup = "$NvimDir.bak.$(Get-Date -Format yyyyMMddHHmmss)"
        Move-Item -Path $NvimDir -Destination $NvimBackup
        Write-Info "Backed up existing Neovim config to $NvimBackup"
    }
    New-Item -ItemType Directory -Path $NvimDir -Force | Out-Null
    Copy-Item -Path "$DOTS_DIR\harnesses\nvim\*" -Destination $NvimDir -Recurse -Force
    Set-Content -Path (Join-Path $NvimDir ".dotsfiles-managed") -Value "" -Encoding UTF8
    if (-not (Get-Command tree-sitter -ErrorAction SilentlyContinue) -and (Get-Command npm -ErrorAction SilentlyContinue)) {
        try { npm install -g tree-sitter-cli 2>$null } catch { Write-Warn "tree-sitter CLI install failed; Treesitter parsers may need it." }
    }
    if (-not (Test-Path (Join-Path $USER_HOME ".local" "share" "nvim" "lazy" "lazy.nvim"))) {
        try { nvim --headless "+Lazy! sync" +qa 2>$null } catch { Write-Warn "Open nvim once to finish plugin installation." }
    }
}

$LazygitDir = Join-Path $USER_HOME ".config" "lazygit"
New-Item -ItemType Directory -Path $LazygitDir -Force | Out-Null
Copy-Item -Path (Join-Path $DOTS_DIR "harnesses" "lazygit" "config.yml") -Destination (Join-Path $LazygitDir "config.yml") -Force
if (-not (Get-Command lazygit -ErrorAction SilentlyContinue)) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        try { winget install --id JesseDuffield.lazygit -e --silent 2>$null } catch { Write-Warn "Install lazygit manually." }
    } else {
        Write-Warn "lazygit not installed; install it manually."
    }
}

# --- 9c. Install Agent Reach CLI ---
if (Get-Command uv -ErrorAction SilentlyContinue) {
    if (-not (Get-Command agent-reach -ErrorAction SilentlyContinue)) {
        Write-Info "Installing Agent Reach CLI..."
        uv tool install "https://github.com/Panniantong/Agent-Reach/archive/main.zip" 2>$null
    }
    if (-not (Get-Command yt-dlp -ErrorAction SilentlyContinue)) {
        uv tool install yt-dlp 2>$null
    }
    if (Get-Command agent-reach -ErrorAction SilentlyContinue) {
        agent-reach install --env=auto 2>$null
    }
}

# --- 10. Distribute Shared Canonical Skills to Installed Harnesses ---
Write-Info "Distributing shared canonical skills to installed harnesses..."

$HarnessSkillDirs = @()
if ($HasPi) { $HarnessSkillDirs += (Join-Path $USER_HOME ".pi" "agent" "skills") }
if ($HasClaude) { $HarnessSkillDirs += (Join-Path $USER_HOME ".claude" "skills") }
if ($HasOpenCode -and $OpenCodeCmd) { $HarnessSkillDirs += (Join-Path $USER_HOME ".config" $OpenCodeCmd "skills") }
if ($HasHermes) { $HarnessSkillDirs += (Join-Path $USER_HOME ".hermes" "skills") }
if ($HasAntigravity) {
    $HarnessSkillDirs += (Join-Path $USER_HOME ".gemini" "config" "skills")
    $HarnessSkillDirs += (Join-Path $USER_HOME ".gemini" "antigravity-cli" "skills")
}

$SharedSkillsDir = Join-Path $DOTS_DIR "shared" "skills"
if ((Test-Path $SharedSkillsDir) -and ($HarnessSkillDirs.Count -gt 0)) {
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
