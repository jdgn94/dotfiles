# π+ Pi-TUI-Plus

Advanced Terminal User Interface for **Pi Coding Agent** featuring **Split-View** architecture, **real-time token and metrics monitoring**, **Git repository context**, **tool logs viewer**, **dynamic Agent hot-switching**, and native **OpenSpec & Graphify integration**.

Built on `@earendil-works/pi-tui` and `@earendil-works/pi-coding-agent`.

---

## ✨ Key Features

### 1. 🤖 Primary Agents vs Specialized Subagents
- **Primary Agent Hot-Switcher**: Cycling with `Shift + Tab` only toggles between primary agents (`default` and `orchestrator`). Subagents are excluded from the hot-switcher.
- **Interactive `/agent` Modal**: Sending `/agent` opens a two-section interactive selector:
  - **Primary Agents**: Selecting one immediately sets it as active.
  - **Specialized Subagents**: Selecting one pre-fills the input box with `/agent <subagent> ` so you can type your prompt directly.
- **Function-Based Agent Coloring**: Every agent is assigned a unique role color (e.g. Red for `security-auditor`, Yellow for `code-reviewer`, Mauve for `spec-planner`, Cyan for `orchestrator`).
- **Dynamic Input Box Border**: The input box border illuminates in the exact color of the currently selected agent.
- **Direct Delegation**: Run tasks on any subagent with `/agent <name> <prompt>` (e.g. `/agent code-reviewer Check git diff for bugs`).

### 2. 📁 Right-Sidebar Git & Live Observability
- **Git Context & Diff Stats**: Live repository path, branch, and uncommitted file list with `+add -del` metrics.
- **Real-Time Plan & Tasks**: Collapsible live checklist in the right sidebar tracking current task, progress, and completed tasks (`Ctrl+Y`).
- **Context & Cache Efficiency**: Aligned token usage and prompt cache hit ratio.
- **Live Tool Inspector**: Last tool executions with timing and success/failure indicators.
- **Attached Image Preview**: Instant TrueColor half-block ANSI image preview when cursor is over an image file.

### 3. 📐 OpenSpec & Graphify Integration
- **OpenSpec**: Live specs and change proposals count.
- **Graphify**: Live AST nodes, edges, communities, and architectural hubs.
- **CLI Commands Available**:
  ```bash
  openspec list --specs       # View active OpenSpec specifications
  openspec validate --specs   # Validate OpenSpec requirements and scenarios
  graphify extract . --code-only # Update AST code graph
  graphify cluster-only .     # Re-cluster and update GRAPH_REPORT.md
  ```

### 4. 🎮 Animated Tetris Startup Logo
- Random 50/50 chance between word **"PI"** and symbol **"π"**.
- Built from literal canonical 4-block tetrominoes dropping in parallel from the base to the crest.
- Self-terminates on completion for 0% CPU consumption.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Shift + Tab` / `Tab` | **Switch to next installed Agent** (`default` → `orchestrator` → `code-reviewer` → ...) |
| `Ctrl + T` | **Cycle Thinking Effort** (`off` → `minimal` → `low` → `medium` → `high` → `max`) |
| `Ctrl + Y` | **Expand / Collapse Plan & Tasks** in right sidebar |
| `F3` / `Alt + M` / `Ctrl + O` | **Expand / Collapse MCP Servers list** |
| `F4` / `Alt + S` / `Ctrl + K` | **Expand / Collapse Skills list** |
| `Alt + B` | Show or hide the sidebar (toggle full-width chat) |
| `/` (Slash) | Open **Slash Commands Autocomplete Popup** (navigate with `Up`/`Down`, `Tab` to complete) |
| `PageUp` | Scroll up chat history |
| `PageDown` | Scroll down chat history (resumes auto-scroll at bottom) |
| `Up / Down Arrow` | Navigate input prompt history (or commands list when `/` active) |
| `Ctrl + C` | Cancel active response generation or exit cleanly |

---

## 🚀 Installation & Usage

The executable `pi-plus` is linked globally on your system:

```bash
# Run from any project or repository:
pi-plus
```

Or from this project directory:

```bash
cd /home/juan/Projects/pi-tui-plus
pnpm start
```

### Build & Development

```bash
pnpm install  # Install dependencies using pnpm
pnpm dev      # Auto-refresh / Hot-reload development mode (tsx watch)
pnpm build    # Compile TypeScript to ./dist
pnpm watch    # Continuous watch compilation
```

---

## 🏗️ Architecture

```text
/home/juan/Projects/pi-tui-plus/
├── src/
│   ├── cli.ts                         # Executable CLI entrypoint
│   ├── state/
│   │   ├── agent-manager.ts           # Pi SDK session & dynamic agent hot-switching
│   │   ├── git-watcher.ts             # Real-time git repository monitoring
│   │   ├── metrics-tracker.ts         # Token counting, velocity & cost calculator
│   │   ├── spec-graph-watcher.ts      # OpenSpec and Graphify status watcher
│   │   └── tool-logger.ts             # Tool execution recorder & status tracker
│   └── ui/
│       ├── theme.ts                   # TrueColor palettes & ANSI helpers
│       ├── app-layout.ts              # Split-view orchestrator & keyboard routing
│       └── components/
│           ├── header.ts              # Top bar (model, thinking, cwd)
│           ├── chat-view.ts           # Boxed message streaming viewport
│           ├── sidebar.ts             # 4-Tab sidebar (Metrics, Git, Logs, Specs & Graph)
│           ├── input-box.ts           # Active agent display, project/branch badge & editor
│           └── status-bar.ts          # Bottom bar with agent, status, and shortcuts
├── openspec/                          # OpenSpec specification and change proposals
│   ├── config.yaml
│   ├── specs/
│   │   └── terminal-user-interface/
│   │       └── spec.md
│   └── changes/
├── graphify-out/                      # Graphify AST code graph & clustering
│   ├── graph.json
│   ├── graph.html
│   └── GRAPH_REPORT.md
├── package.json
└── tsconfig.json
```
