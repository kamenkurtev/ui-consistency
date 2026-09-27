#!/usr/bin/env bash
# What a session is told, run the way a harness runs it: through
# hooks/run-hook.cmd, in each harness's environment, answering in the one shape
# that harness reads.

set -euo pipefail
cd "${UIC_ROOT:-$(dirname "$0")/..}"

fail=0
say() { echo "$*" >&2; fail=1; }

expected=$(cat hooks/session-context.md)

# Short, because it is paid for on every session: a standing text that grows
# without anybody noticing is the same failure as a scan.
chars=$(printf '%s' "$expected" | LC_ALL=en_US.UTF-8 wc -m | tr -d ' ')
[ "$chars" -lt 1400 ] || say "hooks/session-context.md: $chars characters, not under 1,400"

# <environment, or -> <the one key the answer carries>
while read -r line; do
  key=${line##* }
  environment=${line% *}
  [ "$environment" = - ] && environment=
  # shellcheck disable=SC2086
  out=$(env -i PATH="$PATH" HOME="${HOME:-/}" $environment hooks/run-hook.cmd session-start </dev/null) \
    || { say "[$environment] the hook exited non-zero"; continue; }
  verdict=$(OUT="$out" KEY="$key" EXPECTED="$expected" perl -MJSON::PP -e '
    my $d = eval { JSON::PP->new->utf8->decode($ENV{OUT}) } or do { print "not JSON"; exit };
    my @keys = sort keys %$d;
    if (@keys != 1 || $keys[0] ne $ENV{KEY}) { print "answers with [@keys], not [$ENV{KEY}]"; exit }
    my $text = $ENV{KEY} eq "hookSpecificOutput" ? $d->{hookSpecificOutput}{additionalContext} : $d->{$ENV{KEY}};
    if ($ENV{KEY} eq "hookSpecificOutput" && ($d->{hookSpecificOutput}{hookEventName} // "") ne "SessionStart") { print "no hookEventName SessionStart"; exit }
    utf8::encode($text) if defined $text;
    print(defined $text && $text eq $ENV{EXPECTED} ? "ok" : "does not carry hooks/session-context.md");
  ')
  [ "$verdict" = ok ] || say "[${environment:-no harness}] $verdict"
done <<'CASES'
CLAUDE_PLUGIN_ROOT=/plugin hookSpecificOutput
CURSOR_PLUGIN_ROOT=/plugin additional_context
CURSOR_PLUGIN_ROOT=/plugin CLAUDE_PLUGIN_ROOT=/plugin additional_context
CLAUDE_PLUGIN_ROOT=/plugin COPILOT_CLI=1 additionalContext
- additionalContext
CASES

[ "$fail" = 0 ] || exit 1
echo "hook: $chars characters, one shape per harness, through run-hook.cmd"
