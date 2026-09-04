import { useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Container } from '../components/Section';
import Reveal from '../components/Reveal';
import MaskText from '../components/MaskText';
import Starfield from '../components/Starfield';
import { STAR_KITS } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import { money, number } from '../lib/format';
import { scrollToY } from '../lib/scroll';

const KIT_IDS = STAR_KITS.map((k) => k.id);

/**
 * How much page the pinned scene owns. The viewport pins for (TRACK - 1)
 * screens, which is the distance the customer scrolls while the ceiling fills.
 * Three and a half screens gives each kit a comfortable beat without the pin
 * overstaying its welcome.
 */
const TRACK_VH = 340;

/**
 * Where each kit lives on the pinned scroll (0..1), and the short ramps between
 * them. The flat plateaus are where the number rests on a card's exact figure;
 * the ramps are where the ceiling visibly fills. Segment boundaries for the
 * active card sit in the middle of each ramp.
 */
const STOPS = [0, 0.3, 0.4, 0.63, 0.73, 1];
const DENSITIES = [
  STAR_KITS[0].stars,
  STAR_KITS[0].stars,
  STAR_KITS[1].stars,
  STAR_KITS[1].stars,
  STAR_KITS[2].stars,
  STAR_KITS[2].stars,
];
const SEGMENTS = [
  [0, 0.35],
  [0.35, 0.68],
  [0.68, 1],
];

/**
 * Act three: the ceiling, driven by the scroll.
 *
 * The section pins for three screens. As the customer scrolls, the fiber fills
 * in from 550 to 800 to 1,100 points, the number on the plate ticks up, and the
 * matching kit card lights. Nothing is clicked; the scroll *is* the comparison.
 * A tap on a card jumps the scroll to that kit's beat, so the scene also works
 * as a plain picker for anyone who does not want to ride it.
 *
 * Every per-frame value is a MotionValue read straight by the canvas and by a
 * motion.span, so the whole sequence runs without React rendering once.
 */
export default function Starlight() {
  const { t, s, lang } = useLang();
  const { requestBooking } = useBooking();
  const reduced = useReducedMotion();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  // Star count follows the scroll through the ramps above, then a gentle
  // spring so the plate's number rolls rather than jumps.
  const rawDensity = useTransform(scrollYProgress, STOPS, DENSITIES);
  // Tuned so the number lands on the card's exact figure within about a second
  // of the scroll stopping — a softer spring left it reading "799" for a beat.
  const sprungDensity = useSpring(rawDensity, { stiffness: 95, damping: 24, mass: 0.55 });
  const density = reduced ? rawDensity : sprungDensity;
  const countText = useTransform(density, (v) => number(Math.round(v), lang));

  // The only React state in the scene changes three times per scroll-through.
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = p < SEGMENTS[0][1] ? 0 : p < SEGMENTS[1][1] ? 1 : 2;
    if (next !== active) setActive(next);
  });

  const selected = STAR_KITS[active];

  // Jump the pinned scroll to the middle of a kit's beat.
  const goTo = (index) => {
    const track = trackRef.current;
    if (!track) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const range = track.offsetHeight - window.innerHeight;
    const [a, b] = SEGMENTS[index];
    scrollToY(top + range * ((a + b) / 2));
  };

  return (
    <section id="ceiling" data-theme="dark" className="relative isolate">
      {/* .pin-track / .pin-scene unpin themselves on very short landscape
          viewports (see index.css) where a 100svh scene cannot hold the kits. */}
      <div ref={trackRef} className="pin-track" style={{ height: `${TRACK_VH}svh` }}>
        <div className="pin-scene sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-[var(--nav-h)]">
          <Container>
            {/* ---- Compact header ---- */}
            <header className="max-w-3xl">
              <Reveal>
                <div className="flex items-center gap-3">
                  <span className="label-mono t-fg-faint tnum">{t.starlight.index}</span>
                  <span className="t-surface-2 h-px w-8" aria-hidden="true" />
                  <span className="label-mono t-fg-muted">{t.starlight.label}</span>
                </div>
              </Reveal>
              <MaskText
                as="h2"
                text={t.starlight.title}
                italic={t.starlight.titleItalic}
                delay={0.06}
                amount={0.3}
                className="type-display t-fg mt-4"
              />
            </header>

            <div className="mt-5 grid gap-4 lg:mt-7 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
              {/* ---- The ceiling ---- */}
              <Reveal delay={0.1} amount={0.2}>
                <div className="relative">
                  <div className="spot-warm pointer-events-none absolute inset-x-0 -inset-y-16 -z-10" />

                  <div className="t-line relative aspect-[2/1] overflow-hidden rounded-[var(--radius-hero)] border bg-black lg:aspect-[16/9]">
                    {/* The headliner itself, seen from the seats: the fiber
                        stops at the trim edge, so the sky is clipped to the
                        panel's own outline and the surround stays suede-black. */}
                    <div className="headliner-panel absolute inset-0">
                      <Starfield density={DENSITIES[0]} densityValue={density} shooting={0} seed={21} />
                      {/* Suede edge: the fiber thins toward the trim. */}
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            'radial-gradient(ellipse 92% 96% at 50% 50%, transparent 62%, rgb(0 0 0 / 0.55) 100%)',
                          boxShadow: 'inset 0 0 50px 10px rgb(0 0 0 / 0.75)',
                        }}
                      />
                      {/* Sunroof: the fiber runs around it, not through it. */}
                      <div className="headliner-sunroof pointer-events-none absolute" />
                    </div>

                    {/* Trim line and fittings — the parts of a roof you would
                        actually see looking up. */}
                    <div className="headliner-trim pointer-events-none absolute" aria-hidden="true" />
                    <div className="headliner-console pointer-events-none absolute" aria-hidden="true">
                      <span />
                      <span />
                    </div>
                    <div className="headliner-handle pointer-events-none absolute left-[7%] top-[46%]" aria-hidden="true" />
                    <div className="headliner-handle pointer-events-none absolute right-[7%] top-[46%]" aria-hidden="true" />
                    <div className="headliner-dome pointer-events-none absolute" aria-hidden="true" />

                    {/* Live count, bottom-left, inside the trim line — the way a
                        spec plate reads. Caption opposite it, so neither sits
                        under the map lights at the top. */}
                    <div className="absolute bottom-[11%] left-[8%] flex items-baseline gap-2">
                      <motion.span className="tnum text-[1.75rem] font-semibold leading-none text-white sm:text-[2.5rem]">
                        {countText}
                      </motion.span>
                      <span className="label-mono text-white/60">{t.starlight.starsLabel}</span>
                    </div>

                    <span className="label-mono absolute bottom-[12%] right-[8%] hidden text-white/60 sm:block">
                      {t.starlight.previewCaption}
                    </span>
                  </div>
                </div>
              </Reveal>

              {/* ---- The kits ---- */}
              <div className="flex flex-col gap-2.5 lg:justify-center">
                <Reveal delay={0.12} amount={0.2} className="hidden lg:block">
                  <p className="type-lead t-fg-muted mb-3 text-pretty text-[1.05rem]">
                    {t.starlight.lead}
                  </p>
                </Reveal>

                {STAR_KITS.map((item, i) => (
                  <KitCard
                    key={item.id}
                    item={item}
                    copy={s(item)}
                    lang={lang}
                    active={i === active}
                    progress={scrollYProgress}
                    segment={SEGMENTS[i]}
                    label={t.starlight.selected}
                    installed={t.common.installed}
                    onSelect={() => goTo(i)}
                    delay={0.14 + i * 0.06}
                  />
                ))}
              </div>
            </div>

            {/* ---- Note + CTA ---- */}
            <Reveal delay={0.2} amount={0.2}>
              <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between lg:mt-6">
                <p className="t-fg-faint hidden max-w-[52ch] text-[0.8125rem] leading-relaxed text-pretty sm:block">
                  {t.starlight.note}
                </p>
                <button
                  type="button"
                  onClick={() => requestBooking([selected.id], KIT_IDS)}
                  className="btn-invert w-full shrink-0 rounded-full px-7 py-3.5 text-[0.9rem] font-medium sm:w-auto"
                >
                  {t.starlight.cta}
                </button>
              </div>
            </Reveal>
          </Container>
        </div>
      </div>
    </section>
  );
}

/**
 * One kit. Its bottom edge carries a hairline that fills across exactly the
 * stretch of scroll this kit owns — a progress bar for its beat — so the
 * customer can feel how far into the sequence they are without a rail.
 */
function KitCard({ item, copy, lang, active, progress, segment, label, installed, onSelect, delay }) {
  const fill = useTransform(progress, segment, [0, 1]);

  return (
    <Reveal delay={delay} amount={0.2} y={18}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-[var(--radius-card)] border px-5 py-3.5 text-left transition-all duration-500 lg:py-4"
        style={{
          borderColor: active ? 'rgb(var(--fg) / 0.5)' : 'rgb(var(--fg) / 0.14)',
          backgroundColor: active ? 'rgb(var(--fg) / 0.07)' : 'transparent',
        }}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2.5">
            <span className="type-title t-fg text-[1.15rem] lg:text-[1.3rem]">{copy.name}</span>
            <span
              className="label-mono shrink-0 rounded-full px-2 py-1 text-[0.58rem] transition-opacity duration-500"
              style={{
                backgroundColor: 'rgb(var(--fg))',
                color: 'rgb(var(--bg))',
                opacity: active ? 1 : 0,
              }}
              aria-hidden={!active}
            >
              {label}
            </span>
          </span>
          <span className="t-fg-muted mt-1 hidden text-[0.8125rem] leading-snug text-pretty md:block">
            {copy.note}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end">
          <span className="tnum t-fg text-[1.15rem] font-semibold leading-none lg:text-[1.3rem]">
            {money(item.price, lang)}
          </span>
          <span className="label-mono t-fg-faint mt-1.5 text-[0.58rem]">{installed}</span>
        </span>

        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left"
          style={{ backgroundColor: 'rgb(var(--fg) / 0.55)', scaleX: fill }}
        />
      </button>
    </Reveal>
  );
}
