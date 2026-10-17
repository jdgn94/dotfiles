---
name: cross-agent-parity
description: Use when installing or creating a skill or plugin globally, when the user asks to install a skill/plugin for any agent, or when checking that a skill/plugin exists across all configured agents. Trigger keywords: install skill, install plugin, global skill, add skill, cross-agent, parity.
---

# Cross-Agent Parity

## Overview

Ensures every global skill or plugin is available (or has a confirmed equivalent) in every configured AI agent: opencode, Claude Code, Hermes Agent, Antigravity (GUI), and Antigravity CLI. Prevents installing a skill for one agent while the others silently miss it. Runs auto-detection before every parity pass to catch newly installed or uninstalled agents.

## When to Use

- The user asks to install a skill or plugin globally.
- The user asks to create a new global skill.
- The user asks to check or verify skill/plugin availability across agents.
- You are about to place a SKILL.md into any global skill directory (`~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`, `~/.hermes/skills`, `~/.gemini/config/skills`, `~/.gemini/antigravity-cli/skills`).

## Procedure

1. Identify the item (skill or plugin) and the agent it comes from.
2. Run `~/.agents/bin/agents-detect.sh` and compare its output with the registry in `~/.agents/AGENTS.md`:
   - If it lists an agent NOT in the registry, that agent is newly installed: propose adding its configuration (registry row, skill symlinks, instruction-file wiring) and confirm with the user before continuing.
   - If it omits an agent that IS in the registry, that agent was uninstalled: propose removing its configuration and confirm before continuing.
3. Read the registry in `~/.agents/AGENTS.md` and the current state in `~/.agents/.parity-manifest.json`.
4. For each configured agent except the source one:
   - Check whether the item already exists (same name in its skill directory, plugin config, or MCP config).
   - If it exists, record `kind: exact` and continue.
   - If not, search for up to THREE alternatives:
     - (a) equivalent skill: `skills find <term>`, skills.sh, agentskills.io, web search.
     - (b) equivalent plugin: the agent's marketplace / ecosystem.
     - (c) MCP server: MCP registries, web search.
5. Present a comparison table per agent with the three alternatives:

| Agent | Option | Type | Source | What it does | Trade-offs |
|---|---|---|---|---|---|
| claude-code | A | skill | skills.sh/@org | ... | ... |
| claude-code | B | plugin | marketplace | ... | ... |
| claude-code | C | MCP | mcp registry | ... | ... |

6. Ask the user to choose ONE option per agent (or "none"). Do NOT install without confirmation.
7. Install the chosen option:
   - Skill: place the SKILL.md (canonical in `~/.agents/skills/`, symlink or copy into the agent's global skill directory), or run `npx skills add <source> --agent <name> -g`.
   - Plugin: add it to the agent's plugin config (see registry table).
   - MCP: add it to the agent's MCP config.
8. Update `~/.agents/.parity-manifest.json` with the chosen option plus the three proposed alternatives.
9. Verify: confirm the file exists, the frontmatter is valid, and the agent can see the skill/plugin.

## Pitfalls

- Installing for only one agent — always iterate over every configured agent.
- Skipping auto-detection — run `agents-detect.sh` first so newly installed/uninstalled agents are caught.
- Installing without user confirmation — the user explicitly requires approval.
- Placing a skill only in `~/.config/opencode/skills/` — other agents never see it.
- Claude Code does NOT read `~/.agents/skills/`; it needs `~/.claude/skills/`. opencode reads both.
- Antigravity GUI skills live in `~/.gemini/config/skills/`; Antigravity CLI skills live in `~/.gemini/antigravity-cli/skills/`. Do not confuse the two.
- Editing the canonical copy through a symlink is fine, but always keep `~/.agents/skills/` as the source of truth.
- Forgetting to update the manifest — future parity checks depend on it.
- Hermes' `~/.hermes/skills/` also holds its curated skill hub; do not remove or rename existing entries.

## Verification

- `~/.agents/skills/cross-agent-parity/SKILL.md` exists and each agent's symlink resolves.
- The manifest lists the item with `kind: exact` or `kind: equivalent` per agent.
- Restart opencode: the skill appears in the available skill list.