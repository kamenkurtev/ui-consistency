#!/usr/bin/env bash
# The manifests every harness reads, and what an installed copy carries.
#
# The version is carried by every file `scripts/bump.sh` moves, and only one of
# them is the one that matters: an installed copy updates when `plugin.json`
# says a new version exists. The others drift because nothing reads them at
# install time, so nothing complains.

set -euo pipefail
cd "${UIC_ROOT:-$(dirname "$0")/..}"

perl - <<'PERL'
use strict;
use warnings;
use JSON::PP;

sub raw { my ($f) = @_; open my $h, '<', $f or die "$f: $!\n"; local $/; my $t = <$h>; close $h; $t }
sub json { JSON::PP->new->utf8->decode(raw(shift)) }

my @fail;
my $plugin = json('.claude-plugin/plugin.json');
my $market = json('.claude-plugin/marketplace.json');
my ($entry) = grep { $_->{name} eq $plugin->{name} } @{ $market->{plugins} };
my @others = ('.codex-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json');

# The shipped version, the same everywhere.
my $version = $plugin->{version} // '';
push @fail, ".claude-plugin/plugin.json: version '$version' is not x.y.z" if $version !~ /^\d+\.\d+\.\d+$/;
push @fail, "marketplace.json: the entry carries " . ($entry->{version} // 'no version') . ", plugin.json $version"
  if ($entry->{version} // '') ne $version;
for my $file (@others) {
  my $v = json($file)->{version} // '';
  push @fail, "$file: version '$v', plugin.json $version" if $v ne $version;
}

# The plugin described the same way wherever it is listed: each place is read
# by a different harness's installer, and nothing reads more than one of them.
my $described = $plugin->{description} // '';
push @fail, "marketplace.json: the entry's description differs from plugin.json's" if ($entry->{description} // '') ne $described;
for my $file (@others, 'hooks/hooks.json') {
  push @fail, "$file: description differs from plugin.json's" if (json($file)->{description} // '') ne $described;
}

# One hook, at session start, through the wrapper that finds bash.
my $hooks = json('hooks/hooks.json')->{hooks};
my @events = sort keys %$hooks;
push @fail, "hooks/hooks.json: registers [@events]; only SessionStart" if "@events" ne 'SessionStart';
my $session = $hooks->{SessionStart}[0]{hooks}[0] // {};
push @fail, "hooks/hooks.json: SessionStart does not run run-hook.cmd session-start"
  if index($session->{command} // '', 'run-hook.cmd" session-start') < 0;
# Short on purpose: it prints a file, before anybody has asked for anything.
push @fail, "hooks/hooks.json: SessionStart timeout is over 5 seconds" if ($session->{timeout} // 99) > 5;
my $cursor = json('hooks/hooks-cursor.json')->{hooks}{sessionStart}[0]{command} // '';
push @fail, "hooks/hooks-cursor.json: sessionStart does not run run-hook.cmd session-start" if index($cursor, 'run-hook.cmd session-start') < 0;
for my $script ('hooks/run-hook.cmd', 'hooks/session-start') {
  push @fail, "$script: missing or not executable" unless -x $script;
}

# The licence LICENSE grants, in every manifest: each installer reads only its
# own, so a manifest without the field is a copy whose terms depend on which
# file was opened.
push @fail, "LICENSE: does not start 'MIT License'" if raw('LICENSE') !~ /\AMIT License/;
for my $file ('.claude-plugin/plugin.json', @others) {
  push @fail, "$file: licence is not MIT" if (json($file)->{license} // '') ne 'MIT';
}

# Every harness pointed at the same skills.
for my $file ('.codex-plugin/plugin.json', '.cursor-plugin/plugin.json') {
  push @fail, "$file: skills is not ./skills/" if (json($file)->{skills} // '') ne './skills/';
}

# The context file the harnesses without a hook read: the one Gemini's
# manifest names, and every file it includes with a line `@./<path>`. Not
# AGENTS.md: that is where an agent working in this repository looks for the
# repository's own rules. It must carry the skills and the order they fire in.
my $first = json('gemini-extension.json')->{contextFileName} // '';
my @context = ($first);
my $first_text = raw($first);
push @context, $1 while $first_text =~ /^@\.\/(\S+)$/mg;
push @fail, "gemini-extension.json: loads AGENTS.md" if grep { $_ eq 'AGENTS.md' } @context;
push @fail, "gemini-extension.json: what it loads does not name ui-consistency:finding-patterns"
  if index(join("\n", map { raw($_) } @context), 'ui-consistency:finding-patterns') < 0;

# An installed copy is the repository's files alone. Claude Code runs
# `npm ci` in any copy that carries a package.json and a lockfile, and
# claude.ai's organisation sync rejects a top-level bin/.
for my $path ('package.json', 'package-lock.json', 'bin') {
  push @fail, "$path: an installed copy would carry it" if -e $path;
}

if (@fail) {
  print STDERR "$_\n" for @fail;
  exit 1;
}
print "packaging: version $version and one description in every manifest; one hook; nothing to install\n";
PERL
