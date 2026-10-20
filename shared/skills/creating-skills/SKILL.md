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

| Scope            | Path                                                 | Usage                                                                          |
|------------------|------------------------------------------------------|--------------------------------------------------------------------------------|
| Canonical Global | `~/.agents/skills/<name>/SKILL.md`                   | Shared across ALL harnesses (`claude`, `opencode`, `pi`, `hermes`, `antigravity`) |
| Project-local    | `.agents/skills/<name>/SKILL.md` or `.hermes/skills/` | Scoped strictly to the active repository / workspace                           |

All global skills authored or generated MUST be placed in `~/.agents/skills/` (the canonical source of truth) so they are automatically mirrored/symlinked to all configured harnesses.

## Rules & Compression Standard

1. **Zero Redundancy (Strict Anti-Bloat)**:
   - Include ONLY necessary, actionable operational knowledge.
   - Do NOT pad with introductions, verbose narrative, or theoretical tutorials.
   - Synthesize structure, decision rules, and anti-patterns — never copy source documentation verbatim.
2. **Decompose into Separate Files**:
   - Keep `SKILL.md` lean (under 200–250 lines).
   - If reference documentation, API schemas, large examples, or cheatsheets are needed, extract them into separate files under `references/<topic>.md`.
   - Following Hermes Agent progressive disclosure, reference files cost zero tokens until loaded on demand.
3. **Patch, Don't Duplicate**:
   - Always check existing skills first (`list_skills`).
   - If a skill on that topic exists, edit or patch it directly. Never create a second skill for the same topic.
4. **Archive, Never Delete**:
   - Move obsolete skills to `./.archive/<name>/` rather than deleting.
5. **Keep Descriptions Concise**:
   - Under 100 characters, starting with "Use when...", describing triggering conditions in third person for routing efficiency.
6. **Cross-reference**:
   - Link to companion skills or `references/` files rather than duplicating content across files.

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
