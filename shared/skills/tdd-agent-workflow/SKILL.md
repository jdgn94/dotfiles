---
name: tdd-agent-workflow
description: Use when implementing new features, writing bug fixes, or modifying business logic to enforce a strict Red-Green-Refactor test-driven cycle before writing implementation code.
---

# Test-Driven Development (TDD) Workflow

Enforce disciplined, automated test verification by writing minimal failing assertions before authoring or modifying production code.

## Overview

Prevent hallucinated implementations, regression bugs, and scope creep by strictly adhering to the Red-Green-Refactor cycle. Every behavioral change must begin with an automated test demonstrating the required behavior or reproducing the reported bug.

## When to Use

- Adding new features, endpoints, or data transformations.
- Fixing reported bugs or edge cases.
- Refactoring existing internal logic without changing external contracts.
- Modifying security, parsing, or validation rules.

## Procedure

1. **Discover Test Infrastructure**:
   - Inspect existing project tooling (`vitest`, `jest`, `pytest`, `cargo test`, `go test`).
   - Run the test suite once to verify the baseline is green before touching code.
2. **Phase 1 — RED (Write Failing Test)**:
   - Identify the target interface or function.
   - Author a focused, minimal unit or integration test defining expected inputs and outputs.
   - Run the runner to confirm the test fails for the expected reason (not syntax/import error).
3. **Phase 2 — GREEN (Minimal Implementation)**:
   - Author only the minimal code required to satisfy the failing test.
   - Avoid premature optimizations, speculative features, or unrequested abstractions.
   - Run the test runner to confirm the test passes cleanly.
4. **Phase 3 — REFACTOR (Clean & Harden)**:
   - Eliminate code duplication, improve naming, and adhere to project idioms.
   - Add boundary cases (null, empty, negative, max limits).
   - Re-run all tests to guarantee zero regressions.

## Output / Deliverables

- Dedicated test file or updated test suite.
- Clean production implementation passing all test assertions.
- Verification log showing the transition from failing to passing.

## Verification Checklist

- [ ] Baseline test suite passes before starting.
- [ ] New test fails prior to implementation (Red verified).
- [ ] Minimal implementation satisfies the test (Green verified).
- [ ] Full project test suite passes with zero regressions.
