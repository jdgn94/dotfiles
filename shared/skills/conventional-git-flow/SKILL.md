---
name: conventional-git-flow
description: Use when creating git branches, staging changes, authoring conventional commits, or opening pull requests to ensure consistent repository history and structured change logs.
---

# Conventional Git Flow

Standardized Git lifecycle management following Conventional Commits and branch isolation standards.

## Overview

Manage source control operations cleanly: create descriptive topic branches, perform atomic staging of related changes, author semantic commit messages, and draft clear pull request summaries.

## When to Use

- Starting work on a new feature, bug fix, or chore.
- Staging and committing incremental changes.
- Writing git commit messages adhering to standard specifications.
- Preparing pull requests or code review summaries.

## Procedure

1. **Verify Working Tree Status**:
   - Run `git status` to ensure working directory is clean and up to date with upstream.
2. **Branch Naming**:
   - Create focused branches with prefix and short kebab-case description:
     - `feat/<short-description>` (new capabilities)
     - `fix/<short-description>` (bug fixes)
     - `refactor/<short-description>` (structural code changes)
     - `chore/<short-description>` (dependencies, tooling, dotfiles)
3. **Atomic Staging**:
   - Stage only related files for a single logical change (`git add <paths>`).
   - Never use blanket `git add .` if unrelated edits, scratch notes, or temporary files exist.
4. **Conventional Commit Formatting**:
   - Author commit messages following the specification:
     ```text
     <type>(<scope>): <concise-imperative-summary>

     [optional body explaining motivation and trade-offs]

     [optional footer: Closes #123 / BREAKING CHANGE: ...]
     ```
   - Standard types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
5. **Pull Request Summary**:
   - Provide concise PR descriptions containing:
     - **What**: Summary of the changes.
     - **Why**: Context or issue solved.
     - **Testing**: Exact verification steps and commands run.

## Verification Checklist

- [ ] Branch name adheres to `<type>/<kebab-case-description>`.
- [ ] No extraneous files or secrets are staged.
- [ ] Commit subject uses lowercase imperative mood, max 72 characters.
- [ ] Pull request summary outlines changes and test proof.
