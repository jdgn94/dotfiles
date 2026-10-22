# Cross-Agent Skill & Plugin Parity

Global rules for keeping skills and plugins available across every AI coding agent configured on this machine. This file is the canonical source of truth. It is referenced by the `cross-agent-parity` skill and wired into each agent's global instructions.

This directory is a version-controlled dotfiles repo (see `README.md`). `~/.agents` is a symlink pointing here, so every `~/.agents/...` path below resolves to this repository. Machine-local state (`.parity-manifest.json`, `.skill-lock.json`) is git-ignored and regenerated per machine by `install.sh`.

Always-on rules (skill triggers, instruction placement, evidence boundary) live one level up in `~/.agents/AGENTS.md`; this file defines the parity procedure those rules invoke.

## Rule

When installing OR creating ANY skill or plugin GLOBALLY, regardless of which agent the request originates from, you MUST ensure parity across every configured agent. Never install globally for a single agent alone.

For each configured agent:

1. Check whether the exact skill/plugin already exists for that agent.
2. If it does not exist, find up to THREE reasonable alternatives, in this priority order:
   - (a) An equivalent SKILL.md skill (agentskills.io, skills.sh, `skills find`).
   - (b) An equivalent plugin from that agent's ecosystem/marketplace.
   - (c) An MCP server that provides equivalent tools.
3. Present the alternatives in a comparison table (one row per alternative: Option, Type, Source, What it does, Trade-offs).
4. Wait for the user to confirm which alternative to install (or to skip) for EACH agent. Do NOT install without confirmation.
5. Install/register the chosen alternative for that agent.
6. Record the outcome in `~/.agents/.parity-manifest.json`, including the three proposed alternatives for traceability.
7. Verify the skill/plugin loads in that agent.

Never skip an agent silently. If no reasonable alternative exists, state that clearly and ask whether to create an equivalent skill or skip.

## Agent Registry

Only agents actually installed are listed here. `Skill path` is where global SKILL.md files must be placed. `Plugin / MCP config` is where plugins and MCP servers are registered.

| Agent            | detection      | Global skill path                    | Plugin / MCP config                          | Notes                                                      |
|------------------|----------------|--------------------------------------|----------------------------------------------|------------------------------------------------------------|
| opencode         | `opencode`     | `~/.config/opencode/skills/`         | `~/.config/opencode/opencode.jsonc`          | plugins: npm; mcp: `mcp` key                               |
| opencode2        | `opencode2`    | `~/.config/opencode2/skills/`        | `~/.config/opencode2/opencode.jsonc`         | alias / wrapper for opencode                               |
| claude-code      | `claude`       | `~/.claude/skills/`                  | `~/.claude.json` (mcpServers)                | plugins: marketplaces in `~/.claude/plugins/`              |
| hermes-agent     | `hermes`       | `~/.hermes/skills/`                  | `~/.hermes/config.yaml`                      | skills dir may also hold curated hub                       |
| antigravity      | `antigravity`  | `~/.gemini/config/skills/`           | `~/.gemini/config/mcp_config.json`           | GUI app; rule delivered via skills                         |
| antigravity-cli  | `agy`          | `~/.gemini/antigravity-cli/skills/`  | `~/.gemini/antigravity-cli/settings.json`    | plugins in `~/.gemini/antigravity-cli/plugins/`            |

Canonical skill storage lives in `~/.agents/skills/`. Every installed agent gets a symlink from its own global skill directory back to the canonical copy.

To add an agent: run `~/.agents/bin/agents-detect.sh`, add a row above with its detection command and global skill path, create its skill directory, symlink the canonical skills into it, and wire the rule into its global instruction file if it has one.

## Auto-Detection

When the user asks to install a skill, MCP server, or plugin (or asks you to check agent coverage), run `~/.agents/bin/agents-detect.sh` BEFORE applying parity. It prints every installed agent and its global skill directory.

- If the output lists an agent that is NOT in the registry above, that agent is newly installed: propose its configuration (registry row, skill symlinks, and instruction-file wiring) and confirm with the user before adding it.
- If the output omits an agent that IS in the registry, that agent was uninstalled: propose removing its configuration and confirm before cleaning up.

## How the rule reaches each agent

- opencode: `instructions` entry in `~/.config/opencode/opencode.jsonc` plus a pointer in `~/.config/opencode/AGENTS.md`.
- claude-code: `~/.claude/CLAUDE.md` points to `~/.claude/AGENTS.md`, which imports `~/.agents/AGENTS.md`; `~/.claude/rules/AGENTS.md` points to the same file.
- hermes-agent: delivered via the `cross-agent-parity` skill symlinked into `~/.hermes/skills/`.
- antigravity: delivered via the `cross-agent-parity` skill symlinked into `~/.gemini/config/skills/`.
- antigravity-cli: delivered via the `cross-agent-parity` skill symlinked into `~/.gemini/antigravity-cli/skills/`.
- Any agent without a global instructions file still receives the rule through the `cross-agent-parity` skill installed in its global skill directory.

## Related Files

- Automation skill: `~/.agents/skills/cross-agent-parity/SKILL.md` (canonical copy, symlinked into every agent's global skill directory).
- Parity manifest: `~/.agents/.parity-manifest.json`.