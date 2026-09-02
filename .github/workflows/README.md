# What runs on a pull request

One job: `scripts/gate.sh`, the same script the rules require before opening a
PR. Typecheck, build, a bundle that matches its source, the version bump, the
tests, and `claude plugin validate` where the CLI is available.

Three parts of the gate cannot run here and are stated rather than pretended:

- **`claude plugin validate`** is skipped when the CLI is absent, which it is
  on a runner. The manifest is still validated by `tests/packaging.test.ts`.
- **The agent-run half** — simplify, code review, security review — is in
  `.claude/rules/uic-gate.md` and is run by whoever opens the PR. A workflow
  cannot dispatch it, and pretending otherwise would be worse than the gap.
- **The real-repository run.** Every check in this repository has been wrong
  in a way its own fixtures could not see; the rules require validating against
  a real project before a PR, and that is a human step.
