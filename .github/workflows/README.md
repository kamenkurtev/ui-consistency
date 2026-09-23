# What runs on a pull request

One job: `scripts/gate.sh`, the same script the rules require before opening a
PR. Typecheck, build, a bundle that matches its source, the version bump, the
tests, and `claude plugin validate` where the CLI is available.

Three parts of the gate cannot run here and are stated rather than pretended:

- **`claude plugin validate`** is skipped when the CLI is absent, which it is
  on a runner, so nothing there validates a manifest's shape.
  `tests/packaging.test.ts` compares fields across the manifests — version,
  description, licence, where the skills are — and nothing more.
- **The three reviews** — simplification, correctness, security — are in
  `.claude/rules/uic-pr.md` and are done by whoever opens the PR. A workflow
  cannot do them, and pretending otherwise would be worse than the gap.
- **The run on real projects.** The skills are validated on real projects, not
  fixtures, and a workflow cannot do that either.
