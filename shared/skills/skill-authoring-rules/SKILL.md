---
name: skill-authoring-rules
description: Use when creating, refactoring, or generating new agent skills to enforce English-only writing, modularity, concise steps, and scope boundaries.
---

# Skill Authoring Rules

Universal quality standard for authoring, maintaining, and modularizing skills across the harness.

## Core Rules

1. **Strictly English**: All `SKILL.md` files, descriptions, instructions, variable names, and documentation must be authored in English, regardless of the user's conversational language.
2. **Concise & Direct**: Eliminate fluff and verbose prose. State procedures in clear, numbered, sequential steps without sacrificing technical precision or completeness.
3. **Single Responsibility (Small Footprint)**: Each skill must cover a single cohesive capability or workflow. Avoid monolithic skills.
4. **Decomposition Threshold**: If a skill covers multiple distinct operational domains, exceeds ~250 lines, or tries to solve more than one major problem, split it into smaller, composable skills and cross-reference them.

## Standard Skill Structure

Every skill directory must contain a `SKILL.md` with:

### 1. Frontmatter
```yaml
---
name: kebab-case-name
description: Use when [specific trigger conditions and context]. Keep under 1024 characters.
---
```
- `name`: Must match the directory name (`^[a-z0-9]+(-[a-z0-9]+)*$`, max 64 chars).
- `description`: Starts with "Use when..." and describes triggering conditions in third person.

### 2. Body Layout
- **# Title**: Short title.
- **## Overview**: 1-2 sentences summarizing the core goal.
- **## When to Use**: Concrete triggers, symptoms, and scenarios.
- **## Procedure**: Step-by-step numbered instructions.
- **## Output / Deliverables**: Precise schema, template, or format requirements.
- **## Verification**: Checklist or command to confirm successful execution.

## Authoring Workflow

1. **Define Scope**: State the single problem the skill solves. If scope expands, stop and split.
2. **Draft Trigger**: Write a specific `description` that informs the model exactly when to route to this skill.
3. **Step-by-Step Procedure**: Write imperative instructions (e.g., "1. Inspect...", "2. Parse...", "3. Generate...").
4. **Keep Dependencies Explicit**: Reference bundled scripts or companion skills using relative paths or skill names.
5. **Validate**: Ensure valid YAML frontmatter, valid markdown syntax, and discoverability in the global skill directories.
