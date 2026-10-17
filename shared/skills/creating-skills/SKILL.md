---
name: creating-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment. Trigger after complex tasks (5+ tool calls), tricky bug fixes, reusable component creation, or when the agent suggests saving an approach as a skill.
---

# Creating Skills

Skills capture reusable techniques, patterns, and workflows. They serve as reference guides for future sessions and grow with the project.

## When to Create a Skill

Create a skill when:
- A complex task required 5+ tool calls to complete
- A tricky error required a non-obvious solution
- A workflow or pattern was discovered that will be reused
- A reusable component, pattern, or integration was built

Do NOT create skills for:
- One-off solutions
- Standard practices that are already well-documented
- Project-specific conventions (put those in the project's context skill)

## SKILL.md Format

### Frontmatter (REQUIRED)

```yaml
---
name: skill-name
description: Use when [specific triggering conditions, symptoms, and context]. Keep under 1024 chars. Describe WHEN to use, NOT what it does.
---
```

- `name`: lowercase-hyphenated, ≤64 chars, matches directory name. Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`
- `description`: starts with "Use when...", describes triggering conditions only. NEVER summarize workflow here — it causes agents to skip the skill body. Write in third person.

### Body Structure

```markdown
## Overview
Core purpose in 1-2 sentences.

## When to Use
Specific triggers, symptoms, and scenarios.
Also: when NOT to use this skill.

## Procedure / Pattern
Step-by-step or before/after code examples.

## Pitfalls
Common mistakes and how to avoid them.

## Verification
How to confirm the skill works correctly.
```

## Location

| Scope | Path |
|-------|------|
| Project (cross-tool) | `.agents/skills/<name>/SKILL.md` |
| Global (opencode) | `~/.config/opencode/skills/<name>/SKILL.md` |

Project skills go in `.agents/skills/` so they are usable by any Agent-Skills-compatible tool (opencode, Claude, Codex, etc.). Global opencode-only skills go in `~/.config/opencode/skills/`.

## Rules

1. **Patch, don't duplicate** — if a skill is outdated or incomplete, edit it directly. Never create a second skill for the same topic.
2. **Archive, never delete** — move obsolete skills to `./.archive/<name>/` rather than deleting. They can be restored if needed.
3. **Keep descriptions short** — the description appears in the skill index. Keep it under 60 characters for routing efficiency (Hermes standard).
4. **Test before deploying** — verify the skill is discoverable and the frontmatter is valid before considering it done.
5. **Cross-reference** — link to related skills by name rather than duplicating content.

## Example

```markdown
---
name: condition-based-waiting
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently
---

# Condition-Based Waiting

## Overview
Replace fixed-time waits with polling on conditions to eliminate race conditions.

## When to Use
- Tests pass locally but fail in CI
- Tests use `setTimeout`/`sleep` before assertions
- UI interactions need waiting for elements

## Procedure
1. Identify the condition being waited for
2. Replace `await sleep(1000)` with `await waitFor(() => element.isVisible, {timeout: 5000})`
3. Verify with deterministic assertions

## Pitfalls
- Polling too fast drains CPU — use exponential backoff
- Infinite loops without timeouts — always set a max duration
```
