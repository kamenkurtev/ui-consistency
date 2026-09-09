#!/usr/bin/env bash
set -euo pipefail

# Does this working tree change what ships without moving the version?
#
# Read against `origin/main` and against the **working tree** on both sides: a
# bump you have made but not yet committed is a bump, and a gate that says
# otherwise sends you round a pointless loop. The first version of this check
# did exactly that.
#
# ~~Skip the whole thing when HEAD is origin/main, because there is nothing to
# compare.~~ **Withdrawn: HEAD is origin/main on every branch that has not been
# committed yet**, which is when this is run — `uic-pr.md` step 1 is *run the
# gate*, before either review, and a person checking the gate is green has not
# usually committed. Every one of those runs reported green on the one thing
# this check exists for. What "nothing to compare" actually means is *no
# shipped file differs*, and the diff below already says that.

SHIPPED='src/ bin/ hooks/ skills/ .claude-plugin/'

if ! git rev-parse --verify --quiet origin/main >/dev/null; then
  # No network, a fresh clone, a detached head. A gate that cannot run offline
  # is a gate that gets skipped.
  echo "no origin/main to compare against; skipping the version check"
  exit 0
fi

# shellcheck disable=SC2086
CHANGED=$(git diff --name-only origin/main -- $SHIPPED)
if [ -z "$CHANGED" ]; then
  echo "nothing shipped changed; no bump needed"
  exit 0
fi

HERE=$(grep -o '"version": "[^"]*"' .claude-plugin/plugin.json || true)
THERE=$(git show origin/main:.claude-plugin/plugin.json 2>/dev/null | grep -o '"version": "[^"]*"' || true)

if [ "$HERE" = "$THERE" ]; then
  echo "this branch changes what ships but leaves the version at $THERE." >&2
  echo "Anyone who has already installed the plugin will not receive it." >&2
  echo "  npm run bump          # patch" >&2
  echo "  npm run bump minor    # new capability" >&2
  exit 1
fi

echo "version moved: $THERE -> $HERE"
