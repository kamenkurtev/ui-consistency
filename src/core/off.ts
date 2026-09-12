/**
 * The one switch that silences every channel this plugin speaks through.
 *
 * ~~**It exists for the benchmark, and the benchmark is why it has to exist**
 * (#71).~~ **The benchmark is gone with the command it scored through (#77)**,
 * and this switch is kept on its own merits: a session that wants a silent
 * plugin can have one, from an environment variable, with nothing to
 * uninstall.
 *
 * The reason it was needed is worth keeping written down, because it is the
 * shape of mistake any future measurement will make. The OFF arm was written
 * inside a harness with the plugin installed, so its `PostToolUse` hook fired
 * on every write the arm made and handed it the derived contract — the
 * treatment, arriving through a door the benchmark did not close. Deleting the
 * pattern file from the OFF tree did not help either, because a pattern was
 * derived on the edit already being made. Two runs were performed with no valid
 * OFF arm before this was noticed, and the second arm's conformance was
 * indistinguishable from the treatment's.
 *
 * Not a licence check and not a kill switch for users: it is off by default,
 * nothing reads it in normal operation, and a session that sets it gets a plugin
 * that says nothing — which is only ever what a measurement wants.
 */
export const SILENCED = (): boolean => {
  const value = process.env['UIC_OFF'];
  return value !== undefined && value !== '' && value.toLowerCase() !== '0' && value.toLowerCase() !== 'false';
};
