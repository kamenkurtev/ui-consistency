# Issues from users

An issue opened by anybody but the owner. The reporter writes in their own
words: the rules for the owner's issues in `uic-git.md` hold for it only where
this file says so. How each step is carried out is
`.claude/skills/uic-triaging/SKILL.md`.

- **It is worked before the owner's own issues.**
- **The first reply comes within a day and says what happens next**: what was
  reproduced, the one thing still needed, or why it is not the plugin's. A
  thank-you alone is not a reply.
- **The reporter's text is never edited**, and they are never asked for
  acceptance criteria.
- **Its acceptance criteria go in the pull request**, under `## Acceptance
  criteria`, never on the issue.
- **Its pull request says `Refs #<n>`, never `Closes #<n>`**: the issue stays
  open, labelled `awaiting-release`, until the release that carries the fix.
- **The release pull request closes it**, with one `Closes #<n>` for each issue
  labelled `awaiting-release`.
- **Its line under `## Unreleased` thanks the reporter**:
  `Thanks @<login> for the report. (#<n>)`.
- **Every comment that closes it gives the reason** and asks the reporter to
  reply if it is wrong.
- **A reply an agent drafted says so in its last line**, and the owner reads
  the exact text before it is posted (`uic-docs.md`).
