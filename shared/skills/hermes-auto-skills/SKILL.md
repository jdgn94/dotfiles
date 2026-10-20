---
name: hermes-auto-skills
description: Use when completing a non-trivial task, solving a tricky bug, discovering a reusable pattern or workaround, or when asked to learn, reflect, or generate/update a skill.
---

# Hermes Auto-Skills (Continuous Improvement)

Self-improvement and skill acquisition protocol inspired by Hermes Agent. Captures operational knowledge, non-obvious debugging breakthroughs, and reusable engineering patterns into modular skills.

## Overview

The Hermes Auto-Skills protocol ensures that solutions discovered in one session become immediately available across all future agent interactions and harness instances. Rather than re-solving tricky issues repeatedly, the agent reflects on its execution path, distills the essence, and commits or patches a skill.

## When to Use

Trigger auto-skill extraction when:
- A task required 5+ tool calls, trial-and-error, or multiple iterations to resolve.
- A tricky compiler, runtime, or environment error was diagnosed and fixed through a non-obvious workaround.
- A reusable architecture pattern, CLI workflow, or API integration was discovered.
- The user runs `/learn` or explicitly asks to save the approach as a skill.

### When NOT to Use
- Standard, well-documented conventions (e.g. basic git clone, standard npm install).
- Trivial one-line code edits or typos.
- Ephemeral, purely project-specific business logic that has zero applicability elsewhere.

## Hermes Reflection & Auto-Generation Protocol

Execute these steps sequentially when generating or refining a skill:

### 1. Episode Deconstruction
Ask:
- What was the core technical problem or objective?
- What was the deceptive symptom or false lead?
- What was the pivotal root cause discovered?
- What exact sequence of commands or code changes fixed the problem?

### 2. Generalization & De-identification
- Strip out project-specific tokens: usernames (`/home/juan`), specific commit SHAs, internal domain names, or transient temporary paths (`/tmp/...`).
- Replace them with clear variable placeholders (e.g. `<target-dir>`, `<package-name>`, `<config-path>`).
- Focus on the transferable principle, not the isolated incident.

### 3. Compressive Distillation (Hermes Anti-Bloat Standard)
- **High Signal-to-Noise**: Eliminate fluff, conversational preamble, narrative storytelling, and theoretical padding.
- **Synthesize Structure**: Extract decision rules, frameworks, concrete command patterns, and anti-patterns — never paste raw terminal transcripts or duplicate entire manual pages.
- **Irreducible Essence**: If deleting a line or paragraph does not diminish execution success, prune it.

### 4. Modular Separation (Progressive Disclosure)
Follow the Hermes Agent multi-tier loading pattern:
- **Keep `SKILL.md` Lean**: The root `SKILL.md` must stay under 200–250 lines. It acts as the primary orchestrator (mental model, trigger conditions, core procedure, pitfalls).
- **Extract Large References to Separate Files**: When a skill requires deep API schemas, complex templates, extensive cheat sheets, or multi-domain references:
  - Do NOT cram them into a single monolithic `SKILL.md`.
  - Author a dedicated file under `<skill-dir>/references/<topic>.md` or `<skill-dir>/templates/`.
  - Reference files cost zero context tokens until explicitly opened via progressive disclosure (`skill_view(name, path)`).
- **Scope Division**: If the learned knowledge solves two fundamentally separate engineering tasks, generate two companion skills and cross-reference them.

### 5. Check Existing Skills ("Patch, Don't Duplicate")
- Always call `list_skills` before creating a new skill.
- If a skill on the same domain or topic already exists (e.g., `condition-based-waiting`, `portal-file-chooser`):
  - Do NOT create a duplicate skill.
  - Review the existing `SKILL.md` and use `save_skill` with `mode: "patch"` to incorporate the new edge case, pitfall, or modular reference file.
- If the domain is distinct, proceed with `mode: "create"`.

### 6. Scope Placement (Global vs Project-Local)
- **Global Skills**: Write to `~/.agents/skills/<name>/SKILL.md` (the canonical cross-harness root). It automatically mirrors to Claude, Pi, OpenCode, Hermes, and Antigravity.
- **Project-Local Skills**: Write to `<repo-root>/.agents/skills/<name>/SKILL.md` (or `<repo-root>/.hermes/skills/`) when the operational workflow is strictly specific to the current repository.

### 7. Author the Compressed SKILL.md Document

The skill must be written in **strictly English** and adhere to the following schema:

```markdown
---
name: kebab-case-name
description: Use when [specific triggering conditions, symptoms, and context]. Keep under 120 chars.
---

# Title

## Overview
1-2 concise sentences summarizing the core purpose and value.

## When to Use
- Concrete symptoms, error messages, and trigger conditions.
- When NOT to use this skill.

## Key Patterns / Procedure
Numbered, actionable, sequential steps with concrete code/shell snippets.

## Pitfalls & Gotchas
- Common mistakes, false assumptions, or subtle bugs.
- Specific, verified counter-measures for each.

## Verification
Precise command, test, or checklist to confirm the solution works.
```

### 8. Persistence via `save_skill`
Call the `save_skill` tool with:
- `name`: lowercase-hyphenated string matching `^[a-z0-9]+(-[a-z0-9]+)*$`
- `description`: crisp trigger string starting with `Use when...` (under 120 chars)
- `content`: the markdown body
- `mode`: `"create"` (for new skills) or `"patch"` (when improving an existing skill)

## Verification
1. Verify the skill was written to `~/.agents/skills/<name>/SKILL.md`.
2. Confirm the symlink exists in `~/.pi/agent/skills/<name>`.
3. Test that the frontmatter passes YAML validation and description is concise.
