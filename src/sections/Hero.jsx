import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import Starfield from '../components/Starfield';
import { Container } from '../components/Section';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import { INTRO } from '../lib/intro';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Act one: the ceiling, at full size, before a single word about price.
 *
 * The page opens black. The sky comes up one point at a time (Starfield's
 * ignition cue), and only once it is lit does anything else arrive — the
 * brand in the top bar, then the headline word by word, the lead, the
 * buttons, the scroll hint. The schedule lives in src/lib/intro.js and is
 * shared with the nav, so the two can never fall out of step. A slow zoom-out
 * on the sky runs underneath the whole sequence.
 *
 * The sky is a live canvas rather than a photo, which matters twice — the
 * client has no photography yet, and a still image of a starlight ceiling
 * loses the only thing that sells it, which is that the points move.
 */
export default function Hero() {
  const { t } = useLang();
  const { requestBooking } = useBooking();
  const reduced = useReducedMotion();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // The sky drifts a little slower than the copy: the ceiling stays with you
  // for a beat while the words leave. Disabled entirely for reduced motion.
  const skyY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '16%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-10%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, reduced ? 1 : 0]);

  // Zoom-through. As the reader scrolls off the hero the headline grows toward
  // them and softens, so leaving the sky feels like moving *through* it rather
  // than past it. The blur is a filter on a viewport-sized block of display
  // type — cheap on a laptop GPU, not on a phone — so it is desktop-only and
  // the phone keeps just the scale.
  const contentScale = useTransform(scrollYProgress, [0, 0.7], [1, reduced ? 1 : 1.3]);
  const blurPx = useTransform(scrollYProgress, [0.08, 0.6], [0, reduced ? 0 : 12]);
  const blurFilter = useMotionTemplate`blur(${blurPx}px)`;
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // The hero paints its own black plate instead of borrowing the body's. The
  // background morph starts turning the page white while the hero's last third
  // is still on screen, and a starfield over grey looks like a bug — so the
  // whole sky dissolves on the same curve and hands over cleanly.
  const skyOpacity = useTransform(scrollYProgress, [0.3, 0.92], [1, reduced ? 1 : 0]);

  /**
   * Entrance props for one element of the hero, on its cue from INTRO.
   *
   * Under prefers-reduced-motion this returns nothing at all, so the element
   * renders in its final state on first paint — a visitor who has asked the
   * OS to stop animations must never be made to wait for a button they
   * cannot see.
   */
  const enter = (delay, y = 12) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.85, ease: EASE },
        };

  return (
    <section
      id="top"
      ref={ref}
      data-theme="dark"
      className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pt-[var(--nav-h)]"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 -z-20 bg-black"
        style={{ opacity: skyOpacity }}
      />

      {/* Oversized by 20% top and bottom so the parallax drift never exposes a
          starless strip at either edge. The slow settle from 1.08 to 1 is the
          camera easing back as the ceiling comes up. */}
      <motion.div
        className="absolute inset-x-0 -bottom-[20%] -top-[20%] -z-10"
        style={{ y: skyY, opacity: skyOpacity }}
        initial={{ scale: reduced ? 1 : 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Starfield density={900} shooting={2} seed={7} ignite={INTRO.stars} />

        {/* Vignette: pulls the eye to the centre and guarantees text contrast
            even where the sky happens to be dense. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 45%, transparent 20%, rgb(0 0 0 / 0.5) 78%, rgb(0 0 0 / 0.8) 100%)',
          }}
        />
        <div className="grain pointer-events-none absolute inset-0" />
      </motion.div>

      <motion.div
        style={{
          y: contentY,
          opacity: contentOpacity,
          scale: contentScale,
          filter: desktop ? blurFilter : undefined,
        }}
      >
        <Container className="flex flex-col items-center text-center">
          {/* Tighter tracking on small screens: `ch` units ignore the mono
              tracking, so a max-width folded this into four lines at 375px. */}
          <motion.span
            className="label-mono t-fg-muted text-balance [letter-spacing:0.14em] sm:[letter-spacing:0.24em]"
            {...enter(INTRO.eyebrow)}
          >
            {t.hero.eyebrow}
          </motion.span>

          <h1 className="type-mega t-fg mt-6 flex flex-wrap items-baseline justify-center gap-x-[0.28em] text-balance">
            <Word delay={INTRO.title}>{t.hero.titleA}</Word>
            <Word delay={INTRO.title + INTRO.titleStagger} className="ital">
              {t.hero.titleB}
            </Word>
          </h1>

          <motion.p
            className="type-lead t-fg-strong mt-7 max-w-[46ch] text-pretty"
            {...enter(INTRO.lead, 14)}
          >
            {t.hero.lead}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
            {...enter(INTRO.cta, 14)}
          >
            <button
              type="button"
              onClick={() => requestBooking([])}
              className="btn-invert w-full rounded-full px-8 py-4 text-[0.95rem] font-medium sm:w-auto"
            >
              {t.hero.primary}
            </button>
            <a
              href="#work"
              className="btn-ghost w-full rounded-full px-8 py-4 text-center text-[0.95rem] font-medium sm:w-auto"
            >
              {t.hero.secondary}
            </a>
          </motion.div>
        </Container>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3"
        {...enter(INTRO.hint, 0)}
        aria-hidden="true"
      >
        <span className="label-mono t-fg-faint">{t.hero.scroll}</span>
        <span
          className="relative block h-10 w-px overflow-hidden"
          style={{ backgroundColor: 'rgb(var(--fg) / 0.15)' }}
        >
          <span
            className="animate-scroll-hint absolute inset-x-0 top-0 block h-4"
            style={{ backgroundColor: 'rgb(var(--fg) / 0.8)' }}
          />
        </span>
      </motion.div>
    </section>
  );
}

/**
 * Headline words rise out of an overflow mask. line-height must stay >= 1 in
 * here or the mask clips the descenders of the display face.
 */
function Word({ children, delay = 0, className = '' }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{children}</span>;

  return (
    <span className="inline-block overflow-hidden pb-[0.06em] leading-[1]">
      <motion.span
        className={`inline-block ${className}`}
        initial={{ y: '110%' }}
        animate={{ y: '0%' }}
        transition={{ delay, duration: 1.1, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}
