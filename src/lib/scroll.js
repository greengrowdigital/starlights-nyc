/**
 * One place that knows how the page scrolls.
 *
 * Lenis gives the wheel inertia — scrolling glides to a stop instead of
 * snapping — while leaving the browser's scroll position as the source of
 * truth, so sticky sections, IntersectionObserver, Framer's useScroll and the
 * background morph all keep working untouched. Touch stays native: phones
 * already have inertial scrolling and fighting it feels worse, not better.
 *
 * Everything that needs to move the page programmatically (nav links, "Book
 * this ceiling", the confirmation screen) goes through scrollToEl, so the
 * fallback when Lenis is absent — reduced motion, or a browser that failed to
 * construct it — is the same call with native behaviour.
 */

let lenis = null;

export const getLenis = () => lenis;

export function setLenis(instance) {
  lenis = instance;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Scroll an element into view.
 * `offset` is added to the target's top (negative = leave room above it).
 */
export function scrollToEl(target, { offset = 0, immediate = false, block = 'start' } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const reduced = prefersReducedMotion();

  if (lenis && !reduced) {
    const extra =
      block === 'center'
        ? -(window.innerHeight - el.getBoundingClientRect().height) / 2
        : 0;
    lenis.scrollTo(el, { offset: offset + extra, immediate, duration: 1.15 });
    return;
  }

  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block });
}

export function scrollToY(y, { immediate = false } = {}) {
  const reduced = prefersReducedMotion();
  if (lenis && !reduced) {
    lenis.scrollTo(y, { immediate, duration: 1.15 });
    return;
  }
  window.scrollTo({ top: y, behavior: reduced || immediate ? 'auto' : 'smooth' });
}

/** Freeze / release the page — used by the loader and the mobile sheet. */
export function lockScroll() {
  if (lenis) lenis.stop();
}

export function unlockScroll() {
  if (lenis) lenis.start();
}
