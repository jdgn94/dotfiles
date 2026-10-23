#!/usr/bin/env python3
"""Read or upsert a token in the centralized dotsfiles token files."""

import json
import os
import re
import shlex
import sys

NAME_RE = re.compile(r"^[A-Z0-9_]+$")


def _read_env(path: str, name: str) -> str:
    try:
        match = re.search(rf"^export {name}=(.*)$", open(path).read(), re.M)
    except FileNotFoundError:
        return ""
    if not match:
        return ""
    value = match.group(1).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value


def _read_json(path: str, name: str) -> str:
    try:
        data = json.load(open(path))
    except (FileNotFoundError, json.JSONDecodeError):
        return ""
    return (data.get("tokens") or data).get(name, "")


def get(env_path: str, json_path: str, name: str) -> str:
    return _read_env(env_path, name) or _read_json(json_path, name)


def set_value(env_path: str, json_path: str, name: str, value: str) -> None:
    line = f"export {name}={shlex.quote(value)}"

    try:
        lines = open(env_path).read().splitlines()
    except FileNotFoundError:
        lines = []
    found = False
    for index, existing in enumerate(lines):
        if existing.startswith(f"export {name}="):
            lines[index] = line
            found = True
    if not found:
        lines.append(line)
    with open(env_path, "w") as handle:
        handle.write("\n".join(lines) + "\n")
    os.chmod(env_path, 0o600)

    try:
        with open(json_path) as handle:
            data = json.load(handle)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {}
    data.setdefault("tokens", {})[name] = value
    with open(json_path, "w") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    os.chmod(json_path, 0o600)


def main() -> None:
    if len(sys.argv) < 5:
        raise SystemExit(
            "usage: token.py <get|set> <env-file> <json-file> <NAME> [value]"
        )
    action, env_path, json_path, name = sys.argv[1:5]
    if not NAME_RE.match(name):
        raise SystemExit(f"invalid token name: {name}")

    if action == "get":
        print(get(env_path, json_path, name))
    elif action == "set":
        if len(sys.argv) != 6:
            raise SystemExit("set requires a value")
        set_value(env_path, json_path, name, sys.argv[5])
    else:
        raise SystemExit(f"unknown action: {action}")


if __name__ == "__main__":
    main()
