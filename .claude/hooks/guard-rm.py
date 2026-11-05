#!/usr/bin/env python3
"""PreToolUse guard: rm/rmdir/unlink allowed only inside the project."""
import json, os, re, shlex, sys

data = json.load(sys.stdin)
cmd = data.get("tool_input", {}).get("command", "")
project = os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or data["cwd"])
cwd = os.path.realpath(data.get("cwd") or project)
git_dir = os.path.join(project, ".git")

def decide(decision, reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": reason}}))
    sys.exit(0)

if not re.search(r"\b(rm|rmdir|unlink)\b|-delete\b", cmd):
    sys.exit(0)  # not a deletion: normal rules apply

# Cases too dynamic to check statically: ask instead of guessing
if re.search(r"\bsudo\b|-delete\b|\bxargs\b|\bcd\b|[`$]", cmd):
    decide("ask", "Indirect or dynamic deletion, confirm manually.")

for segment in re.split(r"&&|\|\||[;|\n]", cmd):
    try:
        tokens = shlex.split(segment)
    except ValueError:
        decide("ask", "Could not parse the command.")
    if not tokens or os.path.basename(tokens[0]) not in {"rm", "rmdir", "unlink"}:
        continue
    for t in (t for t in tokens[1:] if not t.startswith("-")):
        path = os.path.realpath(os.path.join(cwd, os.path.expanduser(t)))
        if path == project or not path.startswith(project + os.sep):
            decide("deny", f"Deletion outside the project: {t} -> {path}")
        if path == git_dir or path.startswith(git_dir + os.sep):
            decide("deny", "Deletion inside .git is blocked.")