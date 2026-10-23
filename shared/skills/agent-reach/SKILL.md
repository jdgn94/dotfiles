---
name: agent-reach
description: Use when researching the internet or reading content from X/Twitter, Reddit, YouTube, Bilibili, XiaoHongShu, LinkedIn, V2EX, RSS, or any web page. Uses Tavily for search and the agent-reach CLI for platform access.
---

# Agent Reach

`agent-reach` is the CLI/router for internet content. Web search in this setup is handled by the **Tavily MCP**, not Exa.

## Before acting

1. Run `agent-reach doctor --json` before using a multi-backend or login-backed platform (X, Reddit, Bilibili, Facebook, Instagram, XiaoHongShu).
2. Say which platform and backend you are using.
3. On failure, follow the doctor/reference instructions; do not guess commands.
4. Read-only by default: never post, like, comment, or follow.
5. Never print cookies or tokens. Keep temporary files in `/tmp` and persistent data in `~/.agent-reach/`.

## Routing

| Task | Use |
| --- | --- |
| Web search | Tavily MCP: `tavily_search`, `tavily_extract`, `tavily_research` |
| Any URL | `curl -s "https://r.jina.ai/URL"` or Tavily extract |
| YouTube | `yt-dlp --write-sub --write-auto-sub --skip-download -o "/tmp/%(id)s" "URL"` |
| GitHub | `gh search repos "query" --sort stars --limit 10`, `gh repo view owner/repo` |
| V2EX | `curl -s "https://www.v2ex.com/api/topics/hot.json"` |
| Bilibili | `bili search "query" --type video -n 5` |
| X/Twitter | `agent-reach doctor --json`, then `twitter search "query" -n 10` when a backend is active |
| Reddit / Facebook / Instagram / XiaoHongShu | `agent-reach doctor --json`, then `opencli ...` or `rdt ...` as doctor indicates |
| RSS / Atom | `agent-reach` or feedparser |
| Optional channels | `agent-reach install --system --channels=...` only after the user approves |

## Setup

The installer installs the CLI with `uv tool install` from the upstream archive and runs `agent-reach install --env=auto` (read-only). To unlock optional channels, ask the user first, then run `agent-reach install --system --channels=opencli,...`.

Upstream: https://github.com/Panniantong/Agent-Reach
