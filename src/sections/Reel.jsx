import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Container, SectionHead } from '../components/Section';
import { useLang } from '../i18n/LanguageContext';

/**
 * The reel: a curved wall of five vertical light-boxes, each cycling through
 * clips shot in the bay. Every clip the shop sent is portrait — phone footage
 * of real ceilings and real strips — so the wall is built for 9:16 instead of
 * cropping it into a landscape it was never shot for.
 *
 * Each panel is double-buffered: two <video> elements, the front one playing,
 * the back one holding the next clip fully loaded. A swap is a 0.9s opacity
 * crossfade; after it lands, the old front loads the clip after next. That
 * keeps the whole wall at ten video elements and only two clips in flight per
 * panel, however many clips a panel has in its rotation. Panels are staggered
 * so they never switch in unison.
 *
 * Playback is gated twice: the wall must be on screen, and the panel itself
 * must be in view — on a phone the wall is a swipeable strip, and decoding
 * five clips to show one and a half of them is how the page starts to drop
 * frames. Under prefers-reduced-motion the wall shows first frames, still.
 */

const PANELS = [
  { theme: 'stars', clips: ['clip-09', 'clip-22', 'clip-01', 'clip-13'] },
  { theme: 'flow', clips: ['clip-14', 'clip-15', 'clip-17', 'clip-18'] },
  { theme: 'interior', clips: ['clip-04', 'clip-24', 'clip-11', 'clip-03'] },
  { theme: 'flow', clips: ['clip-26', 'clip-27', 'clip-28', 'clip-12'] },
  { theme: 'ambient', clips: ['clip-16', 'clip-21', 'clip-02', 'clip-10'] },
];

const src = (id) => `/media/${id}.mp4`;

// How long a clip holds the panel: at least 3.2s (short clips loop), at most
// 6s (long clips are cut), otherwise its own length less the fade.
const holdFor = (duration) => Math.min(6, Math.max(3.2, (duration || 4) - 0.6));

export default function Reel() {
  const { t } = useLang();
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const ambientRef = useRef(null);
  const [onScreen, setOnScreen] = useState(false);
  const [desktop, setDesktop] = useState(false);

  // The curve only makes sense when all five panels are side by side.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Nothing plays — or loads — until the wall is near the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries[entries.length - 1].isIntersecting),
      { rootMargin: '160px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = ambientRef.current;
    if (!v || reduced) return;
    if (onScreen) {
      if (!v.getAttribute('src')) {
        v.src = src('clip-22');
        v.load();
      }
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [onScreen, reduced]);

  // Columns drift against each other on scroll: the wall reads as a wall.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const driftA = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 34, reduced ? 0 : -34]);
  const driftB = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : -22, reduced ? 0 : 22]);

  return (
    <section id="reel" data-theme="dark" className="relative isolate overflow-hidden py-[clamp(5rem,12vh,9rem)]">
      {/* Ambient: one clip, blurred to a haze, so the wall sits in its own light. */}
      {!reduced && (
        <video
          ref={ambientRef}
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-60 blur-[40px] saturate-150"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
      )}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/60" />

      <Container>
        <SectionHead
          index={t.reel.index}
          label={t.reel.label}
          title={t.reel.title}
          italic={t.reel.titleItalic}
          lead={t.reel.lead}
        />
      </Container>

      <div ref={ref} className="mt-[clamp(2.5rem,7vh,4rem)]">
        {/* Mobile / tablet: a swipeable strip. Desktop: a curved five-panel wall. */}
        <div
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 sm:px-8 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-12"
          style={{ perspective: '1600px' }}
        >
          {PANELS.map((panel, i) => {
            const centre = i - 2;
            const curved = desktop && !reduced;
            return (
              <motion.div
                key={panel.theme + i}
                className="w-[64vw] shrink-0 snap-center sm:w-[44vw] lg:w-auto"
                style={{
                  y: i % 2 ? driftB : driftA,
                  // The outer pairs turn in toward the centre, the way a bank
                  // of screens in a showroom is angled at the viewer.
                  rotateY: curved ? centre * -7 : 0,
                  scale: curved ? 1 - Math.abs(centre) * 0.03 : 1,
                  opacity: curved ? 1 - Math.abs(centre) * 0.1 : 1,
                  transformStyle: 'preserve-3d',
                }}
              >
                <Panel
                  clips={panel.clips}
                  stagger={i * 1.3}
                  wallOnScreen={onScreen}
                  reduced={reduced}
                  label={t.reel.themes[panel.theme]}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Panel({ clips, stagger, wallOnScreen, reduced, label }) {
  const root = useRef(null);
  const a = useRef(null);
  const b = useRef(null);
  const [front, setFront] = useState('a');
  const [inView, setInView] = useState(false);
  const state = useRef({ i: 0, swapping: false, timer: 0, loaded: false });

  const playing = wallOnScreen && inView;
  const layer = (which) => (which === 'a' ? a.current : b.current);

  // The panel's own visibility. Inside the mobile strip this is what stops
  // the four off-screen panels from decoding for nobody.
  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[entries.length - 1].intersectionRatio > 0.2),
      { threshold: [0, 0.2, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Sources attach the first time the panel is actually looked at, so a
  // visitor who never scrolls this far never downloads a byte of video.
  useEffect(() => {
    if (!playing || state.current.loaded) return;
    state.current.loaded = true;
    const first = a.current;
    const second = b.current;
    if (!first || !second) return;
    first.src = src(clips[0]);
    second.src = src(clips[1 % clips.length]);
    first.load();
    second.load();
    // Offset each panel into its clip so the wall never starts in unison.
    first.addEventListener(
      'loadedmetadata',
      () => {
        if (first.duration) first.currentTime = stagger % Math.max(1, first.duration - 1);
      },
      { once: true },
    );
  }, [playing, clips, stagger]);

  // Play / pause the front layer with visibility.
  useEffect(() => {
    const v = layer(front);
    if (!v || !state.current.loaded) return;
    if (playing && !reduced) v.play().catch(() => {});
    else v.pause();
  }, [playing, front, reduced]);

  // Schedule the crossfade off the front video's own clock.
  useEffect(() => {
    if (reduced) return undefined;
    const v = layer(front);
    const back = layer(front === 'a' ? 'b' : 'a');
    if (!v || !back) return undefined;

    const onTime = () => {
      if (state.current.swapping || !playing) return;
      if (v.currentTime >= holdFor(v.duration)) swap();
    };

    const swap = async () => {
      state.current.swapping = true;
      try {
        back.currentTime = 0;
        await back.play();
      } catch {
        // Autoplay refused (rare, muted) — fall through; the swap still shows
        // the back layer's first frame, which beats a frozen panel.
      }
      setFront((f) => (f === 'a' ? 'b' : 'a'));
      // Once the fade has landed, give the retired layer the clip after next.
      state.current.timer = window.setTimeout(() => {
        state.current.i = (state.current.i + 1) % clips.length;
        const nextNext = clips[(state.current.i + 1) % clips.length];
        v.pause();
        v.src = src(nextNext);
        v.load();
        state.current.swapping = false;
      }, 950);
    };

    v.addEventListener('timeupdate', onTime);
    return () => {
      v.removeEventListener('timeupdate', onTime);
    };
  }, [front, playing, clips, reduced]);

  useEffect(() => () => window.clearTimeout(state.current.timer), []);

  const videoClass =
    'absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <div
      ref={root}
      className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-black shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]"
    >
      <video
        ref={a}
        className={`${videoClass} ${front === 'a' ? 'opacity-100' : 'opacity-0'}`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
      <video
        ref={b}
        className={`${videoClass} ${front === 'b' ? 'opacity-100' : 'opacity-0'}`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />

      {/* Glass: a soft top sheen and a bottom grade for the label. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgb(255 255 255 / 0.06), transparent 22%, transparent 70%, rgb(0 0 0 / 0.75))',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-4">
        <span className="label-mono text-white/70">{label}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden="true" />
      </div>
    </div>
  );
}
