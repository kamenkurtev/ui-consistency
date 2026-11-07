# What runs on GitHub

Two workflows.

- **`release.yml`**, on a push to `main`: tags the version in `plugin.json` as
  `v<version>`, publishes its section of `RELEASE-NOTES.md` as a GitHub
  Release the first time that version reaches `main`. On every push it points
  the `release` branch at the files an install uses from that tag — the list
  `scripts/version-check.sh` keeps, with the readme and the licence — so
  Anthropic's directory, which follows `release`, never reads the repository's
  own tooling or the session hook.
- **`gate.yml`**, on every pull request and push: one job, `scripts/gate.sh`, the
  same script the rules require before opening a PR. The checks of the skills,
  the manifests, the hook and private names, the release note under *Unreleased*
  or the release's own section, the proof that each check fires, and `claude
  plugin validate` where the CLI is available. Nothing is installed: bash and
  perl are on the runner.

Three parts of the gate cannot run here and are stated rather than pretended:

- **`claude plugin validate`** is skipped when the CLI is absent, which it is
  on a runner, so nothing there validates a manifest's shape.
  `scripts/check-packaging.sh` compares fields across the manifests — version,
  description, licence, where the skills are — and checks the hook, the Codex
  manifest's `hooks` entry and listing fields, and that `release` would carry no
  hook, and nothing more.
- **The three reviews** — simplification, correctness, security — are in
  `.claude/rules/uic-pr.md` and are done by whoever opens the PR. A workflow
  cannot do them, and pretending otherwise would be worse than the gap.
- **Real work.** A skill change is checked by feedback the next time the plugin
  is used for real work (`AGENTS.md`, *Skill Changes Come From Real Work*), and a workflow
  cannot do that either.
