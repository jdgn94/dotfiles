# Global Claude Code Instructions & Skills Directives

Importing shared cross-agent rules and parity standards:
@~/.agents/AGENTS.md
@~/.agents/rules/AGENTS.md
@~/.agents/rules/COMMON_RULES.md

## Model Delegation (Claude Code only)

When the active model is **Opus** or **Fable**:

- Any task that requires **writing or editing code, files, configuration, or implementation commands** must be delegated to the `sonnet-coder` subagent. It runs Sonnet with `effort: high`.
- Give the subagent the complete task, relevant paths, constraints, and verification requirements. Then review its report and ensure the checks were actually run.
- The powerful model keeps research, architecture, planning, review, and explanation.
- The powerful model may write or edit directly **only when the user explicitly asks it to do so** (for example: "you write it", "do not delegate", "use Opus/Fable for this edit").

When the active model is Sonnet or another non-powerful model, implement normally.

## 🧠 Skills Integration: Read First, Standard Paths Only

You operate in a unified multi-agent environment where all skills are shared identically across Claude, Pi, OpenCode, Hermes, and Antigravity.

### 1. Active Skill Locations (Strict Canonical Paths)
- **Global Skills Directory**: `~/.agents/skills/` (e.g. `~/.agents/skills/<skill-name>/SKILL.md`)
- **Project-Local Skills Directory**: `.agents/skills/` at the active repository root (e.g. `.agents/skills/<skill-name>/SKILL.md`)
- **PROHIBITED PATHS**: NEVER look for, create, or save skills in `.claude/skills` or `.hermes/skills`. Only use `.agents/skills/<name>/`.

### 2. Mandatory Skill Discovery & Execution ("Read First")
- **At the start of any session or non-trivial task**, check available skills in `.agents/skills/` and `~/.agents/skills/`.
- When a task matches the trigger description of an installed skill (such as `tdd-agent-workflow`, `conventional-git-flow`, `dependency-guard`, `vulnerability-auditor`, `creating-skills`, `hermes-auto-skills`, `computer-use`, etc.):
  1. **Read the `SKILL.md` file FIRST** using the `read` or file viewing tool before taking action.
  2. Follow the exact procedures, decision rules, and pitfalls specified in the skill.
  3. If the skill contains modular reference documents (e.g. `references/<topic>.md`), read only the specific reference file needed for the task (progressive disclosure).

### 3. Skill Authoring & Auto-Generation Directives
Whenever you create, update, or auto-generate a skill:
- **Exact Path Placement**:
  - Project-specific skills: Write ONLY to `.agents/skills/<name>/SKILL.md`.
  - Global / general-purpose skills: Write ONLY to `~/.agents/skills/<name>/SKILL.md`.
- **Zero Redundancy & Anti-Bloat (Compression Standard)**:
  - Eliminate introductions, fluff, narrative commentary, and verbose padding.
  - Keep `SKILL.md` under 200–250 lines with high-density operational steps.
  - If deep schemas, extensive cheatsheets, or multi-topic reference guides are needed, split them into separate files under `.agents/skills/<name>/references/<topic>.md` (progressive disclosure).
  - Description must be concise (≤120 characters) and start with `Use when...`.
- **Patch, Don't Duplicate**:
  - Check existing skills first. If a skill on that topic exists, update or refactor it in place.
