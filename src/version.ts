/**
 * The shipped plugin version, in the source, so the bundle carries it.
 *
 * `bin/uic.mjs` is a single esbuild bundle that runs from wherever the user
 * installed it; reading `package.json` at runtime would resolve against *their*
 * project and report their version, or nothing. Moved by `npm run bump` along
 * with the three manifests, and a test fails if they ever disagree.
 */
export const VERSION = '0.14.107';
