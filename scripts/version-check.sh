#!/usr/bin/env bash
set -euo pipefail

# Does this working tree change what ships without moving the version?
#
# Read against `origin/main` and against the **working tree** on both sides: a
# bump you have made but not yet committed is a bump.
#
# It does not skip when HEAD is origin/main: that is every branch with nothing
# committed yet, which is exactly when the gate is run.

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

# The version is how an installed copy learns there is something new, and the
# changelog is how its user learns what. A version with no entry is a release
# nobody can read.
VERSION=${HERE#\"version\": \"}
VERSION=${VERSION%\"}
if ! awk -v v="$VERSION" '
  index($0, "## " v) == 1 && (length($0) == length(v) + 3 || substr($0, length(v) + 4, 1) == " ") { found = 1; next }
  found && /^## / { exit }
  found && /[^[:space:]]/ { said = 1; exit }
  END { exit !(found && said) }
' CHANGELOG.md 2>/dev/null; then
  echo "version $VERSION has no entry in CHANGELOG.md." >&2
  echo "Add a '## $VERSION' section saying what an installed user will notice." >&2
  exit 1
fi

echo "version moved: $THERE -> $HERE"
