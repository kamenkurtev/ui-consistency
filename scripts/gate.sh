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
#
# Its own script so a test can drive it. Every guard in this repository that was
# written without one has since been found not to fire, and this one was found
# not to fire the day it mattered.
echo "==> version"
bash "$(dirname "$0")/version-check.sh"

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
