/**
 * What counts as a hardcoded colour or length, in one place.
 *
 * These four patterns and the two tests over them were written out twice — once
 * for JSX in `style.ts`, once for the template dialects in `template.ts`. They
 * had already drifted: `color(display-p3 …)` was a colour in a `.tsx` and not in
 * a `.vue`, because somebody widened one list and not the other (#184).
 *
 * That is the failure #148 moved the emoji test here to prevent, in the pair it
 * did not cover: two copies of the same judgement, and a change to one making
 * the dialects disagree with every test still green.
 */

/** `#fff`, `#ffff`, `#ffffff`, `#ffffffff`. */
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * A colour written as a function.
 *
 * Anchored at the start only: the value continues past the paren and the whole
 * of it is the colour. `color()` is included — it is the wide-gamut form and
 * was the half that had drifted.
 */
const COLOUR_FUNCTION = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;

/** An absolute unit written out. Relative units are not raw values. */
const ABSOLUTE_LENGTH = /^-?\d*\.?\d+(?:px|pt|pc|in|cm|mm)$/i;

/** Zero is zero in any unit, and no design system has a token for it. */
const ZERO_LENGTH = /^-?0*\.?0*(?:px|pt|pc|in|cm|mm)?$/i;

export const isColourValue = (value: string): boolean =>
  HEX.test(value) || COLOUR_FUNCTION.test(value);

export const isLengthValue = (value: string): boolean => ABSOLUTE_LENGTH.test(value);

export const isZeroLength = (value: string): boolean => ZERO_LENGTH.test(value);

export /**
 * Keys whose numeric value is raw wherever it appears.
 *
 * Only `fontSize`: no design system reads `fontSize: 12` off a scale, it is
 * twelve pixels in `sx` exactly as in `style`, and the widget case that
 * motivates this check is exactly that on a title.
 *
 * Layout dimensions — `width`, `height`, `top` and the rest — are deliberately
 * absent. Almost no design system has a width token, so a fixed width is a
 * layout decision rather than a bypassed one. Against Backstage they were 168
 * of 372 findings, nearly all of them legitimate.
 */
const SIZE_KEYS = new Set(['fontSize']);
export /**
 * Keys that are a multiplier or a ratio in `sx`, and pixels in `style`.
 *
 * `sx={{ borderRadius: 1 }}` is `theme.shape.borderRadius * 1` — the correct,
 * token-respecting form, for the same reason `mt: 2` is. `lineHeight` and
 * `letterSpacing` take unitless ratios, which are not pixel values at all.
 * Flagging these faulted idiomatic MUI, in the window where somebody was
 * deciding whether to keep the plugin (#68).
 */
const SCALED_IN_SX = new Set(['borderRadius', 'letterSpacing']);
export /**
 * Spacing keys, long-hand and MUI's shorthand.
 *
 * These are the reason this check needs a discriminator at all. In `sx` a bare
 * number here is a *theme multiplier* — `sx={{ mt: 2 }}` is the correct,
 * token-respecting form and appears on nearly every component in a real
 * codebase. Flagging it would bury the real findings under hundreds of false
 * ones and the check would be switched off, which costs more than every miss
 * it would have caught. In `style` the same number is plain pixels.
 */
const SPACING_KEYS = new Set([
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'gap',
  'rowGap',
  'columnGap',
  'spacing',
  'm',
  'mt',
  'mr',
  'mb',
  'ml',
  'mx',
  'my',
  'p',
  'pt',
  'pr',
  'pb',
  'pl',
  'px',
  'py',
]);

/**
 * Properties whose value the scale has something to say about.
 *
 * **Derived, not written again.** The first version of this was a fresh list of
 * kebab-case names, and it quietly dropped MUI's spacing shorthand — `sx={{ mt:
 * '2px' }}` stopped being a finding, which is the exact usage `SPACING_KEYS`
 * exists to catch. A fourth hand-written list of "properties the scale covers",
 * in the change whose whole subject is two lists drifting apart.
 *
 * Both spellings, because `fontSize` and `font-size` are one property and the
 * JSX and template checks were keeping separate lists of it (#195).
 *
 * `line-height` is in deliberately. A bare `1.5` is a ratio and stays out of
 * this — that is `UNITLESS`, and it governs numbers, not strings — but
 * `lineHeight: '12px'` is a length where a type scale almost always has one,
 * exactly as `fontSize: '12px'` is.
 *
 * Widths and heights stay out, as they always were: almost no design system has
 * a width token, and on Backstage they were 168 of 372 findings, nearly all
 * legitimate.
 */
const kebab = (key: string): string =>
  key.replace(/([A-Z])/gu, '-$1').replace(/^-/u, '').toLowerCase();

const LENGTH_PROPERTIES = new Set(
  [...SIZE_KEYS, ...SPACING_KEYS, ...SCALED_IN_SX, 'lineHeight'].flatMap((key) => [
    key,
    kebab(key),
  ]),
);

/** Does the scale have a token for this property's value? */
export const takesLength = (property: string): boolean =>
  LENGTH_PROPERTIES.has(property) || LENGTH_PROPERTIES.has(kebab(property));
