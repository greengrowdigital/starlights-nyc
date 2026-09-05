/**
 * The opening sequence, as one schedule shared by everything that takes part.
 *
 * Page load is black. The ceiling lights — one point at a time, in no
 * particular order, the way fiber comes up when the illuminator warms. Only
 * then does the brand appear in the top bar, then the links, then the
 * headline word by word, the lead, the buttons, and last the scroll hint.
 * Every component reads its cue from here, so the choreography is edited in
 * one place and the parts can never drift out of step.
 *
 * Seconds from mount. `stars` is the ignition window: the first point lights
 * at `delay`, the last at `delay + spread`, each fading on over ~0.7s.
 */
const FULL = {
  stars: { delay: 0.35, spread: 1.5 },
  brand: 1.55,
  nav: 1.8,
  navStagger: 0.06,
  eyebrow: 2.15,
  title: 2.3,
  titleStagger: 0.12,
  lead: 2.65,
  cta: 2.8,
  hint: 3.15,
};

/**
 * Second and later loads in the same tab. The customer has seen the show;
 * make them wait three seconds for the button again and it stops being a
 * show. Stars come up almost at once and everything else follows quickly.
 */
const SHORT = {
  stars: { delay: 0, spread: 0.35 },
  brand: 0.1,
  nav: 0.2,
  navStagger: 0.04,
  eyebrow: 0.3,
  title: 0.36,
  titleStagger: 0.08,
  lead: 0.5,
  cta: 0.6,
  hint: 0.85,
};

const KEY = 'starlights.intro';

function pick() {
  if (typeof window === 'undefined') return FULL;
  try {
    const seen = window.sessionStorage.getItem(KEY);
    window.sessionStorage.setItem(KEY, '1');
    return seen ? SHORT : FULL;
  } catch {
    return FULL;
  }
}

/** Resolved once per page load so every participant sees the same cues. */
export const INTRO = pick();
