# π+ Pi-TUI-Plus

Advanced Terminal User Interface for **Pi Coding Agent** featuring **Split-View** architecture, **real-time token and metrics monitoring**, **Git repository context**, **tool logs viewer**, **dynamic Agent hot-switching**, and native **OpenSpec & Graphify integration**.

Built on `@earendil-works/pi-tui` and `@earendil-works/pi-coding-agent`.

---

## ✨ Key Features

### 1. 🤖 Active Agent Visualization & Hot-Switching
- **Active Input Indicator**: The header of the input text box (`Active Input [Agent: <name>]`) visualizes which agent is currently active.
- **Dynamic Hot-Switching**: Instantly switch between installed agents with `Ctrl+A`, `Alt+A`, or `F2`.
- **Automatic Loadout Application**: Automatically updates tool allowlists, thinking level, and system prompt constraints when switching agents.
- **Multi-Scope Discovery**: Detects agents installed across User (`~/.pi/agent/agents`), Project (`.pi/agents`), and built-in subagents (`orchestrator`, `code-reviewer`, `security-auditor`, `spec-planner`, `test-engineer`, `build-error-resolver`, `code-simplifier`, `doc-updater`, `researcher`, `default`).

### 2. 📁 Project & Git Context on Input Box
- **Bottom-Left Project Badge**: The bottom border of the input box continuously displays the current project name and git branch (`📁 <project> ( <branch>)`).
- **Real-Time Git Tracking**: Automatically detects branch switches, uncommitted modifications, staged items, and untracked files.

### 3. 📐 OpenSpec & Graphify Integration (Tab 4: Specs & Graph)
- **OpenSpec Observability**: Live monitoring of active specifications (`openspec/specs/`), proposals/changes (`openspec/changes/`), and schema configuration (`spec-driven`).
- **Graphify Code Graph**: Live statistics for AST nodes, graph edges, community clusters, and top architectural hubs (god nodes).
- **CLI Commands Available**:
  ```bash
  openspec list --specs       # View active OpenSpec specifications
  openspec validate --specs   # Validate OpenSpec requirements and scenarios
  graphify extract . --code-only # Update AST code graph
  graphify cluster-only .     # Re-cluster and update GRAPH_REPORT.md
  ```

### 4. 📊 Real-Time Metrics & Tokens (Tab 1: Metrics)
- **Context Window Usage**: Visual percentage bar against the model's context ceiling (128k, 200k, 1M tokens).
- **Token Breakdown**: Input, Output, Cache Read, Cache Write, and Total.
- **Throughput & Latency**: Real-time generation speed (`tok/s`) and first-token latency (`ms`).
- **Estimated Cost**: Dynamic USD cost calculation based on active model pricing.
- **Turn Counter**: Conversation turn tracking.

### 5. 🔀 Split-View & Multi-Tab Sidebar
- **Split Layout**: Main chat viewport side-by-side with a 4-tab persistent sidebar.
- **Responsive Toggle**: Toggle full-screen chat with `Shift + Tab`.
- **Smooth Navigation**: Auto-scrolling on generation, with `PageUp` / `PageDown` history browsing.

### 6. ⚡ Tool Execution Viewer (Tab 3: Tool Logs)
- Chronological execution log of all tool calls (`read`, `bash`, `write`, `edit`, `web_search`, etc.).
- Status icons (`[✓]` success, `[✗]` error, `[⟳]` running).
- Execution timing in milliseconds (`durationMs`).
- Argument previews and output excerpts.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Tab` / `Ctrl + A` / `Alt + A` / `F2` | **Switch to next installed Agent** (`default` → `orchestrator` → `code-reviewer` → `security-auditor` → ...) |
| `Shift + Tab` / `Alt + Shift + A` | **Switch to previous Agent** |
| `Ctrl + T` | **Expand / Collapse Tasks (Todo) Panel** |
| `Alt + M` | **Expand / Collapse MCP Servers list** |
| `Alt + S` | **Expand / Collapse Skills list** |
| `Alt + B` | Show or hide the sidebar (toggle full-width chat) |
| `PageUp` | Scroll up chat history |
| `PageDown` | Scroll down chat history (resumes auto-scroll at bottom) |
| `Up / Down Arrow` | Navigate input prompt history |
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
