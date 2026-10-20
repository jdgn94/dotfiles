# Common Agent Instructions & Rules

1. **Safety & Permissions**:
   - Do not overwrite critical files without backups.
   - Do not execute destructive commands (e.g. `rm -rf /`, `mkfs`, raw database truncations) without explicit consent.
   - Keep secrets, private tokens, and passwords in the centralized secret store (`~/.config/dotsfiles/tokens.env` or `tokens.json`), never commit them directly to Git.

2. **Skill Parity & Modularity**:
   - Follow the cross-agent parity rule defined in `AGENTS.md`.
   - Global skills are shared via `~/.agents/skills/`.
   - Harness-specific skills reside in each harness's individual configuration directory.

3. **Code Style & Practices**:
   - Provide concise, actionable responses.
   - Specify file paths clearly.
   - Adhere to the language idioms and type safety requirements of the respective project.

4. **Universal Skill Generation & Anti-Bloat Standards**:
   - Applies globally to all harnesses (`claude`, `opencode`, `pi`, `hermes`, `agy`) and to both project-local and global skills.
   - **Zero Redundancy / Lean Core**: Exclude unnecessary prose, conversational filler, and redundant explanations. Include only high-density, actionable operational knowledge.
   - **Hermes Progressive Disclosure**: Keep `SKILL.md` lean (core mental model, triggers, concise numbered steps, pitfalls).
   - **Multi-File Separation**: When reference documentation, large schemas, cheatsheets, or multi-step domain workflows are involved, do NOT cram them into a single monolithic file. Split them into modular companion files (e.g., `references/<topic>.md`) or distinct composable skills.
   - **Patch, Don't Duplicate**: Check existing skills first (`list_skills`). Update, expand, or refactor existing skills rather than authoring overlapping duplicates.
