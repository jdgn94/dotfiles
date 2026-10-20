---
name: skill-authoring-rules
description: Use when creating, refactoring, or generating new agent skills to enforce English-only writing, modularity, concise steps, and scope boundaries.
---

# Skill Authoring Rules

Universal quality standard for authoring, maintaining, and modularizing skills across all harnesses, applicable equally to **global skills** (`~/.agents/skills/`) and **project-local skills** (`.agents/skills/`). Never use tool-specific directories like `.hermes/skills` or `.claude/skills`.

## Core Rules

1. **Strictly English**: All `SKILL.md` files, descriptions, instructions, variable names, and documentation must be authored in English, regardless of the user's conversational language.
2. **Zero Redundancy & Anti-Bloat (Compression Standard)**:
   - Eliminate fluff, conversational padding, theoretical treatises, and redundant explanations.
   - Include ONLY what is strictly necessary: actionable commands, concrete patterns, concise decision rules, and verified pitfalls.
   - Every paragraph must carry operational signal. If removing a sentence does not diminish execution accuracy, delete it.
3. **Single Responsibility & Progressive Disclosure (Hermes Pattern)**:
   - Each skill must cover a single cohesive capability or workflow.
   - **Do NOT build monolithic single-file skills**: Keep `SKILL.md` lean (under 200–250 lines) containing the core mental model, triggers, sequential steps, and pitfalls.
   - **Multi-File Decomposition**: When detailed schemas, reference documentation, large cheatsheets, or deep technical specs are required, split them into separate companion files under `references/<topic>.md` or `templates/`.
   - Reference files cost zero context tokens until specifically requested via progressive disclosure (`skill_view(name, path)`).
4. **Scope Boundaries**: If a workflow spans multiple distinct operational domains, decompose it into smaller composable companion skills and cross-reference them by name.

## Standard Skill Structure

Every skill directory must follow this directory layout:

```text
<skill-dir>/
├── SKILL.md               # Lean entrypoint (required, ≤250 lines)
├── references/            # Deep reference docs, schemas, spec sheets (optional)
│   └── <topic>.md
├── templates/             # File templates and output blueprints (optional)
└── scripts/               # Helper scripts executed by tools (optional)
```

### 1. Frontmatter
```yaml
---
name: kebab-case-name
description: Use when [specific trigger conditions and context]. Keep under 120 characters.
---
```
- `name`: Must match the directory name (`^[a-z0-9]+(-[a-z0-9]+)*$`, max 64 chars).
- `description`: Starts with "Use when..." and describes triggering conditions in third person. Keep concise (≤120 chars) for prompt-routing efficiency.

### 2. Body Layout
- **# Title**: Short, clear title.
- **## Overview**: 1-2 sentences summarizing the core capability.
- **## When to Use**: Concrete triggers, symptoms, and scenarios (plus when NOT to use).
- **## Procedure**: Step-by-step numbered instructions with exact commands or code snippets.
- **## Pitfalls & Gotchas**: High-signal failure modes and exact counter-measures.
- **## Verification**: Exact command or checklist to verify execution.

## Authoring & Compression Workflow

1. **Define Scope**: State the exact problem the skill solves. Reject out-of-scope additions.
2. **Compress Content**: Distill the workflow into its irreducible operational essence:
   - Synthesize structure, decision rules, and anti-patterns.
   - Never copy-paste entire documentation pages or source files into `SKILL.md`.
3. **Decompose if Large**:
   - If reference material exceeds 1 page, extract it to `references/<topic>.md`.
   - If two distinct tool flows exist, author two companion skills.
4. **Verify Frontmatter & Global Reach**: Ensure YAML frontmatter is valid and directory permissions allow cross-harness visibility.
