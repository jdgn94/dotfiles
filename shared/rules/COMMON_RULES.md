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
