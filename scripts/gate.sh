#!/usr/bin/env bash
# Everything a pull request needs. Bash and perl, both of which come with git;
# nothing to install.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> skills"
bash scripts/check-skills.sh

echo "==> packaging"
bash scripts/check-packaging.sh

echo "==> hook"
bash scripts/check-hook.sh

echo "==> private names"
bash scripts/check-private-names.sh

# An installed plugin updates when plugin.json names a new version, not when
# its files change. Shipping without a bump reaches nobody who already
# installed it, and nothing fails to say so — which is why this is a gate and
# not a note in the rules. It happened twice in one day before it was.
echo "==> version"
bash scripts/version-check.sh

# Every guard in this repository written without a proof that it fires has
# since been found not to. Each check above is run here on a copy with a
# planted defect, and on one without.
echo "==> the checks catch what they are for"
bash scripts/test-checks.sh

echo "==> plugin validate"
if command -v claude >/dev/null 2>&1; then
  claude plugin validate .
else
  echo "claude CLI not found; skipping plugin validate"
fi

echo "gate passed"
