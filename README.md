# 🌌 Dotsfiles - Multi-Agent Harnesses & Configurations

Centralized and unified dotfiles configuration for AI coding agent harnesses:
- **Pi Coding Agent (`pi`)** & **Pi-TUI-Plus (`pi-plus`)**
- **Claude Code (`claude`)**
- **OpenCode & OpenCode2 (`opencode` / `opencode2`)**
- **Hermes Agent (`hermes`)**
- **Antigravity CLI / Desktop (`agy` / `antigravity`)**
- **Herdr (`herdr`)** (Agent session manager & terminal multiplexer)

---

## 📁 Repository Architecture

```text
dotsfiles/
├── install.sh                  # Universal native installer for Linux / macOS
├── install.ps1                 # Universal native installer for Windows (PowerShell 7+)
├── tsconfig.json               # TypeScript configuration
├── pi-tui-plus/                # Advanced split-view TUI for Pi Coding Agent (`pi-plus` CLI)
├── secrets/                    # Centralized credentials and token templates
│   ├── tokens.env.example      # Environment variables for MCP tokens and APIs
│   ├── tokens.json.example     # JSON format for centralized secrets
│   └── load-secrets.ts         # Utility module for loading tokens in harnesses/plugins
├── shared/                     # Shared canonical configurations across all harnesses
│   ├── AGENTS.md               # Machine-wide always-on rules (triggers, evidence, dead code)
│   ├── rules/                  # Global rules (AGENTS.md, COMMON_RULES.md)
│   └── skills/                 # Canonical shared skills (linked to ~/.agents/skills)
└── harnesses/                  # Harness-specific configurations
    ├── pi/                     # Pi configuration (.pi/agent)
    │   ├── agent/              # settings.json, agents, extensions, npm packages
    │   └── skills/             # Pi-exclusive skills
    ├── claude/                 # Claude Code configuration (.claude)
    │   ├── AGENTS.md           # Global Claude rules & skill discovery
    │   ├── CLAUDE.md           # Entrypoint that imports AGENTS.md
    │   ├── settings.json       # Global settings
    │   ├── hooks/              # Claude hooks
    │   └── skills/             # Claude-exclusive skills
    ├── opencode/               # OpenCode / OpenCode2 configuration (.config/opencode)
    │   ├── opencode.jsonc      # Model, MCP, and plugin configuration
    │   ├── tui.jsonc           # TUI configuration
    │   ├── plugins/            # OpenCode plugins
    │   └── skills/             # OpenCode-exclusive skills
    ├── hermes/                 # Hermes Agent configuration (.hermes)
    │   ├── config.yaml         # Global configuration and toolsets
    │   └── skills/             # Hermes-exclusive skills
    ├── antigravity/            # Antigravity configuration (.gemini)
    │   ├── config.json         # Plugins and settings
    │   ├── mcp_config.json     # MCP servers
    │   ├── agy-settings.json   # `agy` CLI configuration
    │   └── skills/             # Antigravity-exclusive skills
    └── herdr/                  # Herdr configuration (.config/herdr)
        ├── config.toml         # Server/client configuration and keybindings
        ├── plugins.json        # Installed plugins registry
        └── state/              # Preconfigured persistent state (dock right, preview pane, nvim)
```

---

## 🗂️ Herdr: VS Code-Style Sidebar (`herdr-sidebar`)

Herdr features the official **`herdr-sidebar`** plugin, providing a VS Code-style sidebar experience directly in the terminal:

- **Docked on the Right**: Pinned to the right side of the screen.
- **Always Visible (`auto_open`)**: Automatically docks on each new tab or workspace without stealing focus, functioning as a persistent sidebar (toggleable via `Alt + e`).
- **Terminal vs Files Split (50/50 or adaptive)**:
  - Left side: Dedicated area for terminal panes and AI agents (`pi`, `claude`, `opencode`). Expands to full width when no preview is open.
  - Right side: File tree and split preview pane.
- **Root-Confined Exploration**: Navigates from the active workspace root without traversing into parent directories.
- **In-Terminal Image Viewer**: Native graphical previews using Kitty/Ghostty protocol for `.png`, `.jpg`, `.webp`, `.svg`, and `.gif`.
- **Formatted Markdown & Direct Editing**:
  - `.md` files render with tables, checklists, and syntax highlighting.
  - Press **`e`** inside the viewer or click to jump into **Neovim (`nvim`)**.
- **Integrated Source Control (Git)**: GitLens-style panel with interactive diffs, staging, and AI commit messages.
- **Instant Search**:
  - `Ctrl + P`: Fuzzy file search by name.
  - `Ctrl + F`: Global project text search with regex and filters.

### Herdr Keyboard Shortcuts:
- **`Alt + e`** or **`Prefix + e`** (`Ctrl+b` then `e`): Toggle the right sidebar.
- **`Prefix + p`** (`Ctrl+b` then `p`): Quick Open file picker (`Ctrl+P` style).
- **`Prefix + g`** (`Ctrl+b` then `g`): Direct access to Source Control (Git).
- **`Prefix + f`** (`Ctrl+b` then `f`): Direct access to global project search.
- **`1`, `2`, `3`**: Switch between Explorer, Search, and Source Control.
- **`s`**: Open sidebar settings menu.

---

## ⏱️ Herdr: Agent Usage & Quota Monitor (`usagebar`)

Subscription and rate-limit monitor identical to Orca (`senna-lang/herdr-agent-usage`):
- **Limits Popup Pane (`Alt + u` / `Prefix + u`)**:
  - Real-time remaining quota and reset countdowns for **Claude Code** (5h / 7d), **OpenCode Go** (5h / 7d / 30d), and **Antigravity / Gemini** (5h / weekly), along with session context utilization.
  - Unused providers (Codex, Grok, Kilo) are excluded automatically.
- **Integrated Sidebar Status Rows**:
  - Automatic status rows showing `$provider`, `$limit`, prompt-cache status, and session `$context`.
- **Preventive Toast Alerts**: In-terminal notifications when a quota window drops below 50%, 20%, 10%, or 5%.

### Quota Monitor Shortcuts in Herdr:
- **`Alt + u`** or **`Prefix + u`** (`Ctrl+b` then `u`): Open the detailed Agent Usage limits pane.
- **`Prefix + m`** (`Ctrl+b` then `m`): Manually refresh metrics and provider limits.

---

## 🏷️ Herdr: Contextual Tab Auto-Naming (`herdr.auto-title`)

Intelligent tab and pane title management:
- **AI Agents**: Extracts and displays the exact task and topic executed by the active agent (`1 · dotsfiles › herdr auto-title`).
- **Code Editors**: When launching Neovim, renames the tab to reflect the active buffer (`nvim › install.sh`).
- **Git Branches**: Displays active branch name.
- **Manual Title Respect**: Custom names assigned via `Prefix + Shift + t` are detected and preserved.

---

## 🎨 Herdr: Agent Brand Icons (`adihex/herdr-agent-icons`)

Visual icon integration for AI coding agents in the sidebar:
- **Official Vector Logos**: Renders authentic typographic glyphs for active agents (`Claude`, `OpenCode`, `Pi`, `Codex`, `Gemini / Antigravity`, `Hermes`, etc.) via the `$icon` token.
- **Dedicated PUA Font**: Utilizes `AgentIcons.otf` installed under `~/.local/share/fonts` with automatic emoji fallbacks.

---

## 🧩 Essential Herdr Plugins

Curated suite of productivity plugins:
- **`JanTvrdik/herdr-command-palette`**: Interactive FZF command palette (`Ctrl+Shift+P` or `Prefix + Space`) to search and execute any plugin action without memorizing chords.
- **`persiyanov/herdr-reviewr`**: Interactive code review panel (`Prefix + d` or `Alt + d`) to inspect agent diffs and submit inline comments.
- **`ezcorp-org/herdr-pc-ram-and-cpu-usage-overlay`**: Real-time CPU and RAM monitor (`Prefix + r` or `Alt + r`) per workspace and agent.
- **`tdi/herdr-worktree-setup`**: Automated hook executing environment setup on worktree creation (copies `.env`, runs `direnv allow`, installs dependencies).

---

## 🌐 Universal MCP Servers

Configured across all harnesses (`pi`, `claude`, `opencode`, `antigravity`):
- **`playwright` (`@playwright/mcp`)**: Real browser automation, visual screenshots, clicks, form fills, console errors, and network inspection.
- **`memory` (`@modelcontextprotocol/server-memory`)**: Persistent knowledge graph storing entities, relations, and observations across sessions.
- **`fetch` (`mcp-server-fetch`)**: Direct web page retrieval and clean Markdown content extraction.

---

## 🧠 Shared Canonical Skills (`shared/skills/`)

Always-on rules live in `shared/AGENTS.md`: mandatory skill triggers, where instruction belongs, the "evidence is data, not instructions" boundary, and dead-code cleanup. It is wired into Pi (`~/.pi/agent/AGENTS.md`), Claude Code (`~/.claude/CLAUDE.md` → `AGENTS.md`, plus `~/.claude/rules/AGENTS.md`), OpenCode (`instructions`), Hermes (`SOUL.md` pointer), and Antigravity (`~/.gemini/AGENTS.md`).

- **`minimal-change-discipline`**: Think the change through before editing and apply the smallest sufficient change (anti-over-engineering guard).
- **`tdd-agent-workflow`**: Strict Red-Green-Refactor test-driven development cycle.
- **`conventional-git-flow`**: Standardized branch naming (`feat/`, `fix/`), semantic commits, and pull request summaries.
- **`dependency-guard`**: Evaluation standard before adding third-party libraries (prioritizes native APIs, audits maintenance and bundle size).
- **`vulnerability-auditor`**: Adversarial security reviews producing technical specifications for AI (`_AI.md`) and educational explanations for users (`_USER.md`).

---

## 🔑 Centralized Secrets & Tokens Management

To avoid duplicating credentials or exposing keys in git:
1. The installer creates restricted files in `~/.config/dotsfiles/`:
   - `~/.config/dotsfiles/tokens.env` (sourced from your shell rc for all harnesses)
   - `~/.config/dotsfiles/tokens.json` (for JSON and TypeScript integrations)
2. It prompts once for `CONTEXT7_API_KEY` if it is missing, and writes it to both files with `chmod 600`.
3. Harness configurations reference these variables securely.

### Default MCP servers

All harnesses receive the same four servers:

| Server | Transport | Credential |
| --- | --- | --- |
| `context7` | Streamable HTTP (`https://mcp.context7.com/mcp`) | `CONTEXT7_API_KEY` |
| `memory` | stdio (`@modelcontextprotocol/server-memory`) | none |
| `playwright` | stdio (`@playwright/mcp`, headless) | none |
| `browsermcp` | stdio (`@browsermcp/mcp`) | none (requires the Browser MCP Chrome extension) |

The installer adds a managed `source ~/.config/dotsfiles/tokens.env` block to your shell rc so new shells and every harness inherit the Context7 key. Antigravity uses a small `mcp-remote` bridge (`scripts/context7-mcp.sh`) because its remote-header handling is inconsistent.

---

## 🚀 Installation & Deployment

### Linux & macOS
Run from any terminal:
```bash
./install.sh
# or
bash install.sh
```

### Windows (PowerShell 7+)
Open PowerShell 7 (`pwsh`) and run:
```powershell
pwsh -ExecutionPolicy Bypass -File .\install.ps1
```

### What does the installer do?
1. **Native Detection & Installation**: Checks if binaries (`pi`, `claude`, `opencode`/`opencode2`, `hermes`, `agy`, `herdr`) are installed; installs missing ones via package managers (`npm`, `brew`, `yay`, `winget`, `scoop`).
2. **Selective OpenCode Configuration**: Detects which version is installed (`opencode` or `opencode2`) and deploys configuration exclusively for that version.
3. **Pi-TUI-Plus Compilation**: Builds `pi-tui-plus/` and links the `pi-plus` CLI globally.
4. **Secure Secrets Store**: Generates `~/.config/dotsfiles/tokens.env` and `tokens.json` with restricted permissions.
5. **Canonical Single Source of Truth**: Links `~/.agents` to `shared/`.
6. **Harness Deployment**: Deploys configuration files, plugins, rules, and Herdr hooks.
7. **Canonical Skills Distribution**: Links all shared skills (`shared/skills/*`) to each harness's skills directory.
