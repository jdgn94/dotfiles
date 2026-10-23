#!/usr/bin/env python3
"""Merge the shared MCP server set into a harness configuration.

The four servers are kept identical across harnesses; only the config shape
differs. Existing servers (graphify, fetch, github, notion, etc.) are preserved.
"""

import json
import os
import sys

CONTEXT7_URL = "https://mcp.context7.com/mcp"


def _stdio(command: str, args: list[str]) -> dict:
    return {"command": command, "args": args}


def _wrapper(name: str) -> str:
    return os.path.expanduser(f"~/.config/dotsfiles/bin/{name}")


def _tavily_stdio() -> dict:
    if os.name != "nt":
        return {"command": _wrapper("tavily-mcp.sh"), "args": [], "env": {}}
    return {
        "command": "npx",
        "args": ["-y", "tavily-mcp"],
        "env": {"TAVILY_API_KEY": "${TAVILY_API_KEY}"},
    }


def _opencode_servers() -> dict:
    return {
        "context7": {
            "type": "remote",
            "url": CONTEXT7_URL,
            "enabled": True,
            "headers": {"Authorization": "Bearer {env:CONTEXT7_API_KEY}"},
        },
        "memory": {
            "type": "local",
            "command": ["npx", "-y", "@modelcontextprotocol/server-memory"],
            "enabled": True,
        },
        "playwright": {
            "type": "local",
            "command": ["npx", "-y", "@playwright/mcp@latest", "--headless"],
            "enabled": True,
        },
        "browsermcp": {
            "type": "local",
            "command": ["npx", "-y", "@browsermcp/mcp@latest"],
            "enabled": True,
        },
        "tavily": {
            "type": "local",
            "command": [_wrapper("tavily-mcp.sh")]
            if os.name != "nt"
            else ["npx", "-y", "tavily-mcp"],
            "enabled": True,
            **(
                {"environment": {"TAVILY_API_KEY": "{env:TAVILY_API_KEY}"}}
                if os.name == "nt"
                else {}
            ),
        },
        "osv": {
            "type": "local",
            "command": ["npx", "-y", "@cyanheads/osv-advisory-mcp-server"],
            "enabled": True,
        },
    }


def _json_servers(with_env: bool = False) -> dict:
    servers = {
        "context7": {
            "url": CONTEXT7_URL,
            "headers": {"Authorization": "Bearer ${CONTEXT7_API_KEY}"},
        },
        "memory": _stdio("npx", ["-y", "@modelcontextprotocol/server-memory"]),
        "playwright": _stdio("npx", ["-y", "@playwright/mcp@latest", "--headless"]),
        "browsermcp": _stdio("npx", ["-y", "@browsermcp/mcp@latest"]),
        "tavily": _tavily_stdio(),
        "osv": _stdio("npx", ["-y", "@cyanheads/osv-advisory-mcp-server"]),
    }
    if with_env:
        for server in servers.values():
            server.setdefault("env", {})
    return servers


def _antigravity_servers() -> dict:
    servers = _json_servers(with_env=True)
    if os.name != "nt":
        # Antigravity's remote-header handling is inconsistent; use the same
        # authenticated mcp-remote bridge that the installer deploys.
        servers["context7"] = {
            "command": os.path.expanduser("~/.config/dotsfiles/bin/context7-mcp.sh"),
            "args": [],
            "env": {},
        }
    return servers


def _merge_json(path: str, root_key: str, servers: dict) -> None:
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except FileNotFoundError:
        data = {}

    target = data.setdefault(root_key, {})
    target.update(servers)

    with open(path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def _merge_hermes(path: str) -> None:
    try:
        import yaml
    except ImportError:
        raise SystemExit("PyYAML is required to update Hermes' config.yaml")

    with open(path, encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}

    target = data.setdefault("mcp_servers", {})
    target.update(_json_servers())

    with open(path, "w", encoding="utf-8") as handle:
        yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: mcp-config.py <opencode|pi|antigravity|hermes> <path>")
    mode, path = sys.argv[1], sys.argv[2]

    if mode == "opencode":
        _merge_json(path, "mcp", _opencode_servers())
    elif mode == "pi":
        _merge_json(path, "mcpServers", _json_servers())
    elif mode == "antigravity":
        _merge_json(path, "mcpServers", _antigravity_servers())
    elif mode == "hermes":
        _merge_hermes(path)
    else:
        raise SystemExit(f"unknown mode: {mode}")


if __name__ == "__main__":
    main()
