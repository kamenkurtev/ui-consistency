#!/usr/bin/env bash
set -euo pipefail

echo "==> typecheck"
npm run typecheck

# The build comes before the tests, not after: part of the suite runs the
# built binary as a subprocess, and testing yesterday's bundle would pass
# while today's is broken.
echo "==> build"
if [ -f src/cli/index.ts ]; then
  npm run build
else
  # The CLI arrives with the core. Until then there is nothing to bundle, and
  # a gate that cannot pass is a gate nobody runs.
  echo "no CLI entry yet; skipping build"
fi

# The bundle ships in git, so a stale one is shipped code that does not match
# the source it was built from.
if [ -n "$(git status --porcelain bin/ 2>/dev/null)" ]; then
  echo "bin/ is stale — the build changed it. Commit the rebuilt bundle:" >&2
  git status --short bin/ >&2
  exit 1
fi

# An installed plugin updates when plugin.json names a new version, not when
# the code changes. Shipping behaviour without a bump reaches nobody who
# already installed it, and nothing fails to say so — which is why this is a
# gate and not a note in the rules. It happened twice in one day before it was.
echo "==> version"
SHIPPED='src/ bin/ hooks/ skills/ .claude-plugin/'
if ! git rev-parse --verify --quiet origin/main >/dev/null; then
  # No network, a fresh clone, a detached head. A gate that cannot run offline
  # is a gate that gets skipped.
  echo "no origin/main to compare against; skipping the version check"
elif [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
  echo "on origin/main; nothing to compare"
else
  # Against the working tree rather than HEAD, on both sides: a bump you have
  # made but not yet committed is a bump, and a gate that says otherwise sends
  # you round a pointless loop. The first version of this check did exactly
  # that.
  # shellcheck disable=SC2086
  CHANGED=$(git diff --name-only origin/main -- $SHIPPED)
  if [ -z "$CHANGED" ]; then
    echo "nothing shipped changed; no bump needed"
  else
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
  fi
fi

echo "==> tests"
npm run test

echo "==> plugin validate"
if [ ! -f .claude-plugin/plugin.json ]; then
  # Packaging is a later issue. Until the manifest exists there is nothing to
  # validate, and failing here would block the work that must come first.
  echo "no plugin manifest yet; skipping plugin validate"
elif command -v claude >/dev/null 2>&1; then
  claude plugin validate .
else
  echo "claude CLI not found; skipping plugin validate"
fi

echo "gate passed"
