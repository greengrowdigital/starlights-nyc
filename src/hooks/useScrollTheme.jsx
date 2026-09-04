import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * The background morph.
 *
 * Every section declares `data-theme="dark" | "light" | "smoke"`. This hook
 * measures where those sections sit, then on every frame of scroll writes an
 * interpolated `--bg` / `--fg` pair onto <html>. Because the value is computed
 * per frame rather than transitioned by CSS, the page reads as one continuous
 * surface that is slowly turning over, instead of a stack of bands snapping
 * between two colors.
 *
 * Two deliberate choices:
 *  - The colour is written imperatively (no React state per frame), so a
 *    scroll never re-renders the tree. Only the discrete pole (dark vs light)
 *    is published to React, and that changes a handful of times per page.
 *  - The blend happens inside a band at the START of each section, not across
 *    the boundary. A section owns its colour for the whole of its height and
 *    only the first half-viewport of the NEXT one does the crossfade — which
 *    is what keeps the hero pure black while you are still reading it.
 */

const THEMES = {
  dark: { bg: [0, 0, 0], fg: [255, 255, 255], pole: 'dark' },
  light: { bg: [255, 255, 255], fg: [10, 10, 11], pole: 'light' },
  smoke: { bg: [242, 242, 244], fg: [10, 10, 11], pole: 'light' },
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Smoothstep keeps the handover from having a visible "start" and "stop".
const smooth = (t) => t * t * (3 - 2 * t);

const ThemeContext = createContext({ pole: 'dark' });

export function ScrollThemeProvider({ children }) {
  const [pole, setPole] = useState('dark');
  const poleRef = useRef('dark');
  const stopsRef = useRef([]);
  const docHeightRef = useRef(0);
  const metaRef = useRef(null);
  // Lets the measuring effect repaint immediately after the geometry changes,
  // without the two effects having to be merged.
  const applyRef = useRef(null);

  // Measure section boundaries. Re-runs on resize and whenever the document
  // height changes (fonts landing, the booking flow growing a step, etc.).
  useLayoutEffect(() => {
    const measure = () => {
      const nodes = Array.from(document.querySelectorAll('[data-theme]'));
      stopsRef.current = nodes.map((el) => {
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        return {
          top,
          height: rect.height,
          theme: THEMES[el.dataset.theme] || THEMES.dark,
        };
      });
      // Cached here so the per-frame handler never reads layout during scroll.
      docHeightRef.current = document.documentElement.scrollHeight;

      // Recolour straight away. Sections move for reasons that are not scrolls —
      // fonts landing, the booking flow growing a step, the language toggle
      // reflowing a headline — and without this the page keeps painting the
      // colour that belonged to the old geometry until you next touch the wheel.
      if (applyRef.current) applyRef.current();
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, []);

  useEffect(() => {
    metaRef.current = document.querySelector('meta[name="theme-color"]');
    const root = document.documentElement;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const stops = stopsRef.current;
      if (!stops.length) return;

      const vh = window.innerHeight;
      // The colour follows a line halfway down the viewport: what you are
      // actually looking at, not what the top edge happens to touch.
      const ref = window.scrollY + vh * 0.5;

      // That reference line stops half a viewport short of the document end,
      // so the LAST section can never reach the far side of a full-width band
      // and the page would finish on a half-faded grey. `maxRef` is the highest
      // value `ref` can ever take; bands get clamped to what is reachable.
      const docHeight = docHeightRef.current || document.documentElement.scrollHeight;
      const maxRef = Math.max(docHeight - vh * 0.5, vh * 0.5);
      const atBottom = window.scrollY + vh >= docHeight - 2;

      let i = 0;
      while (i < stops.length - 1 && ref >= stops[i + 1].top) i += 1;
      // A final section shorter than half a viewport would otherwise never
      // become current at all.
      if (atBottom) i = stops.length - 1;

      const current = stops[i];
      const previous = i > 0 ? stops[i - 1] : null;

      let bg = current.theme.bg;
      let fg = current.theme.fg;
      let activePole = current.theme.pole;

      if (previous) {
        // Crossfade over the opening slice of this section, capped so a short
        // section — or one pinned against the end of the document — still
        // finishes arriving before it runs out of scroll.
        const reach = maxRef - current.top;
        const band = Math.max(Math.min(vh * 0.55, current.height * 0.55, reach), 1);
        const t = atBottom ? 1 : smooth(clamp01((ref - current.top) / band));
        bg = [
          lerp(previous.theme.bg[0], current.theme.bg[0], t),
          lerp(previous.theme.bg[1], current.theme.bg[1], t),
          lerp(previous.theme.bg[2], current.theme.bg[2], t),
        ];
        fg = [
          lerp(previous.theme.fg[0], current.theme.fg[0], t),
          lerp(previous.theme.fg[1], current.theme.fg[1], t),
          lerp(previous.theme.fg[2], current.theme.fg[2], t),
        ];
        activePole = t > 0.5 ? current.theme.pole : previous.theme.pole;
      }

      const bgStr = `${Math.round(bg[0])} ${Math.round(bg[1])} ${Math.round(bg[2])}`;
      root.style.setProperty('--bg', bgStr);
      root.style.setProperty(
        '--fg',
        `${Math.round(fg[0])} ${Math.round(fg[1])} ${Math.round(fg[2])}`,
      );

      if (activePole !== poleRef.current) {
        poleRef.current = activePole;
        root.dataset.pole = activePole;
        setPole(activePole);
        if (metaRef.current) {
          metaRef.current.setAttribute(
            'content',
            activePole === 'dark' ? '#000000' : '#ffffff',
          );
        }
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    applyRef.current = apply;
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      applyRef.current = null;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const value = useMemo(() => ({ pole }), [pole]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
