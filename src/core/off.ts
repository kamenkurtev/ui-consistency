/**
 * The one switch that silences every channel this plugin speaks through.
 *
 * **It exists for the benchmark, and the benchmark is why it has to exist**
 * (#71). The OFF arm is written inside a harness with the plugin installed, so
 * its `PostToolUse` hook fires on every write the arm makes and hands it the
 * derived contract — the treatment, arriving through a door the benchmark did
 * not close. Deleting the pattern file from the OFF tree does not help: since
 * #38 a pattern is *derived on the edit already being made* where no approved
 * one covers the kind, which is the whole point of that work and is working
 * correctly. There was nothing in either prompt to remove.
 *
 * Two runs were performed with no valid OFF arm before this was noticed, and
 * the second arm's conformance was indistinguishable from the treatment's.
 *
 * Not a licence check and not a kill switch for users: it is off by default,
 * nothing reads it in normal operation, and a session that sets it gets a plugin
 * that says nothing — which is only ever what a measurement wants.
 */
export const SILENCED = (): boolean => {
  const value = process.env['UIC_OFF'];
  return value !== undefined && value !== '' && value.toLowerCase() !== '0' && value.toLowerCase() !== 'false';
};
