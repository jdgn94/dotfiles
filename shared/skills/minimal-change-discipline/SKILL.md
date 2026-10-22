---
name: minimal-change-discipline
description: "Use before any code change: think the process through, then apply the smallest fix; no over-engineering."
---

# Minimal Change Discipline

## Overview

Understand the goal and the current code path first, then change only what the goal requires. Complexity is a cost paid on every future edit.

## When to Use

- Implementing a feature, fixing a bug, or refactoring.
- Reviewing a plan or diff for scope creep.
- Tempted to add an abstraction, config flag, dependency, or new file.

**When NOT to use**: mechanical formatting or lint fixes with no design choice, or an explicit request for a large redesign.

## Procedure

### 1. Think the process through (before editing)

Answer these in order; if any answer is unknown, investigate or ask before writing code.

1. **Goal**: the request in one sentence, plus its success criteria.
2. **Current behavior**: the files and functions involved — read them, never guess.
3. **Smallest edit**: the one change that achieves the goal, plus one larger alternative and why you rejected it.
4. **Proof**: the exact test, command, or check that shows it works.
5. **Out of scope**: what you will not touch.

### 2. Apply the smallest sufficient change

- Modify existing code before creating new modules, files, or layers.
- No abstraction until two real callers exist; no generic helper for one call site.
- No configuration, flag, or extension point for a single use.
- No new dependency when the standard library or an installed package covers it (see `dependency-guard`).
- No error handling for states the code cannot reach.

### 3. Stop at the goal

- No drive-by renames, reformatting, or "while I'm here" cleanups.
- No unrelated files in the same change.
- If the plan grows past the stated goal, stop and report the expansion before continuing.
- If the evidence does not argue for a change, **keep the base**: unearned adaptation costs context and buys nothing.

### 4. Verify

Run the project's tests, lint, and typecheck. If the goal has no test, add the smallest one that proves it (see `tdd-agent-workflow`).

## Pitfalls

| Over-engineering sign | Correct move |
| :--- | :--- |
| Interface with one implementation | Delete it and call the concrete code. |
| Utility wrapping three lines | Inline it. |
| Generic "engine" for one case | Write the case. |
| Rewriting a module to fix a bug | Patch the faulty path; simplify later only with green tests. |
| New file for a small function | Place it beside its caller. |

## Verification Checklist

- [ ] Goal and success criteria stated in one sentence.
- [ ] Current code path read before editing.
- [ ] Smallest option chosen and a larger alternative explicitly rejected.
- [ ] No new abstraction, dependency, config, or file without a concrete second use.
- [ ] Diff touches only files the goal requires.
- [ ] Tests, lint, and typecheck pass.
