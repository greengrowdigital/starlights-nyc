import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenis, scrollToEl } from '../lib/scroll';

/**
 * Mounts Lenis for the life of the page.
 *
 * lerp 0.09 is the glide: low enough that a flick keeps travelling for a
 * beat, high enough that the page never feels like it is swimming behind the
 * wheel. Touch is left native. Under prefers-reduced-motion nothing is
 * mounted at all — the page scrolls exactly as the OS says it should.
 *
 * In-page anchors are routed through Lenis too. Left alone, a click on
 * `#ceiling` would hard-jump the native scroll position while Lenis was still
 * easing toward the old one, and the two would visibly fight.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });
    setLenis(lenis);

    let frame = 0;
    const raf = (time) => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    };
    frame = window.requestAnimationFrame(raf);

    const onClick = (event) => {
      const anchor = event.target.closest && event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      // The nav is fixed; land just below it.
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      scrollToEl(target, { offset: -navH * rem });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `#${id}`);
      }
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      window.cancelAnimationFrame(frame);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
