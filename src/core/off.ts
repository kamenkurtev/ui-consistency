/**
 * `UIC_OFF` silences the plugin for a session, with nothing to uninstall.
 *
 * Any measurement comparing work with and without this plugin needs it: an
 * "off" arm written in a harness that has the plugin installed still receives
 * the session instructions unless this is set.
 */
export const SILENCED = (): boolean => {
  const value = process.env['UIC_OFF'];
  return value !== undefined && value !== '' && value.toLowerCase() !== '0' && value.toLowerCase() !== 'false';
};
