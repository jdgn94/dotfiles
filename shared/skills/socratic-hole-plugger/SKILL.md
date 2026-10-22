---
name: socratic-hole-plugger
description: Use when planning a feature, refactoring architecture, tackling an ambiguous problem, or needing to think outside the box to surface hidden edge cases and plug logical holes before writing code.
---

# Socratic Hole Plugger

Disrupt linear thinking and surface hidden assumptions, critical failure modes, and architectural loopholes before writing code. Inspired by the direct, anti-fluff cognitive style of `i-have-adhd`.

## Overview

Software bugs and rework stem from unexamined assumptions: assumed network availability, unhandled concurrent access, invisible error states, or unbounded inputs. The Socratic Hole Plugger acts as an adversarial thinking partner that interrogates the problem space from divergent angles, forcing clarity and closing loopholes upfront. Once the decisions are settled, apply `minimal-change-discipline` to implement only what was agreed.

## When to Use

- Planning a non-trivial architectural change or new feature.
- Tackling an ambiguous or underspecified task.
- Reviewing a proposal before executing implementation steps.
- When an approach feels "too simple" and likely misses edge cases.

### When NOT to Use
- Obvious syntax fixes or minor typo corrections.
- Standard boilerplate code following a settled, well-documented pattern.
- When the user explicitly requests immediate raw execution without questions.

## Inquiry Protocol

When invoked, execute these four mental passes:

### 1. Invert the Assumptions
Ask:
- What must be true for this to work? What happens when that prerequisite is false?
- What happens if the process crashes, disconnects, or is terminated mid-operation?
- What happens at the extremes (0 items, 1 item, 100,000 items, negative inputs, null/empty payloads)?

### 2. Identify the Deceptive Simplicity
- Where is state being implicitly shared?
- Is there a race condition or Time-of-Check to Time-of-Use (TOCTOU) gap?
- Could this operation lock a resource, block the main event loop, or exhaust handles/memory?

### 3. Concrete Choice Formulation (A vs. B)
Never ask open-ended philosophical questions. Frame decisions as 2–3 concrete, actionable trade-offs:
- *Option A:* Fast, in-memory, but lost on process restart.
- *Option B:* Persistent, durable, but requires atomic file I/O or database writes.

### 4. Output Shaping (Strict Anti-Fluff Rules)

1. **Lead Directly with the Questions**: No pleasantries, no "Great idea!", no preamble.
2. **Cap to 3–5 Numbered Questions**: Keep cognitive load small. Each question must target a specific architectural decision or edge case.
3. **Present Concrete Trade-offs**: Give clear options with recommendations highlighted.
4. **End with the Immediate Next Action**: State what will happen once the choice is made.

## Output Template

```markdown
### 🔍 Hole-Plugging Analysis: [Feature / Problem Name]

#### Critical Decision Points & Edge Cases:

1. **[Failure Mode / Concurrency]**: What happens when [edge condition occurs]?
   - *Option A (Recommended)*: [Mitigation mechanism with trade-off].
   - *Option B*: [Alternative approach].

2. **[State & Durability]**: Where should [state/data] survive across [reboot / crash / reload]?
   - *Option A*: [Ephemeral in-memory].
   - *Option B (Recommended)*: [Persistent atomic storage].

3. **[Degradation & Fallback]**: If [external service / tool] fails or times out:
   - *Option A (Recommended)*: [Graceful degraded mode].
   - *Option B*: [Fail fast and notify].

**Next Step**: Confirm preferred options (e.g. `1A, 2B, 3A`) to begin implementation.
```
