import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import Section, { SectionHead } from '../components/Section';
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal';
import ScrollScale from '../components/ScrollScale';
import { FLOW, FLOW_INCLUDES } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import { money } from '../lib/format';

// Names come from the dictionary (t.flow.colors[id]) — they are both the
// visible caption and the buttons' accessible names.
const SWATCHES = [
  { id: 'flow', color: null },
  { id: 'red', color: '#ff2d55' },
  { id: 'amber', color: '#ff9f0a' },
  { id: 'green', color: '#30d158' },
  { id: 'blue', color: '#0a84ff' },
  { id: 'violet', color: '#bf5af2' },
  { id: 'white', color: '#f4f6ff' },
];

const SPECTRUM =
  'linear-gradient(110deg, #ff2d55, #ff9f0a, #30d158, #0a84ff, #bf5af2, #ff2d55)';

/**
 * Act five: the only place on the site allowed to use colour.
 *
 * Everything else is black, white and one warm star. That restraint is what
 * makes this section land — when the spectrum finally arrives it reads as the
 * product doing something, not as decoration. Tapping a swatch drives the
 * cabin above it, which is exactly what the app in the customer's hand does.
 */
export default function FlowSeries() {
  const { t, s, lang } = useLang();
  const { requestBooking } = useBooking();
  const reduced = useReducedMotion();
  const [swatch, setSwatch] = useState(SWATCHES[0]);

  const isFlow = swatch.color === null;
  const glow = swatch.color || '#0a84ff';

  // One style object drives the dash, both doors and both footwells, so the
  // cabin always changes as a single installed system.
  const lightStyle = isFlow
    ? { backgroundImage: SPECTRUM, boxShadow: `0 0 46px 10px rgb(120 140 255 / 0.4)` }
    : { backgroundColor: glow, boxShadow: `0 0 46px 10px ${glow}66` };

  // Power-on sequence. Real ambient kits do not switch colour instantly — the
  // controller runs the new colour down the dash strip, then the doors catch,
  // then the footwells. Keying on the swatch id restarts the sequence on every
  // tap, and `powerOn(delay)` is what each zone plays when it catches.
  const powerOn = (delay) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0.25 },
          animate: { opacity: 1 },
          transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
        };

  return (
    <Section id="flow" theme="dark">
      <SectionHead
        index={t.flow.index}
        label={t.flow.label}
        title={t.flow.title}
        italic={t.flow.titleItalic}
        lead={t.flow.lead}
      />

      {/* ---- The cabin ---- */}
      <ScrollScale className="mt-[clamp(2.5rem,6vh,4rem)]">
        <div
          className="t-line relative overflow-hidden rounded-[var(--radius-hero)] border bg-black"
          style={{ aspectRatio: '16 / 9' }}
        >
          <div className="grain pointer-events-none absolute inset-0 z-10" />

          {/* Dash — the long horizontal run across the top. */}
          <motion.div
            key={`dash-${swatch.id}`}
            className={`absolute left-[8%] right-[8%] top-[24%] h-[3px] rounded-full ${isFlow ? 'animate-flow' : ''}`}
            style={lightStyle}
            {...powerOn(0)}
          />

          {/* The tracer: a bright head that runs the new colour down the dash
              before the strip settles — the tell that this is a system, not
              a paint job. */}
          {!reduced && (
            <motion.span
              key={`tracer-${swatch.id}`}
              aria-hidden="true"
              className="absolute top-[24%] h-[3px] w-[9%] -translate-y-px rounded-full"
              style={{
                background: isFlow
                  ? 'linear-gradient(90deg, transparent, #fff)'
                  : `linear-gradient(90deg, transparent, #fff)`,
                boxShadow: `0 0 18px 4px ${isFlow ? '#ffffff' : glow}`,
                mixBlendMode: 'screen',
              }}
              initial={{ left: '-2%', opacity: 0 }}
              animate={{ left: ['-2%', '92%'], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.95, ease: [0.4, 0, 0.2, 1] }}
            />
          )}

          {/* Doors — two raking runs down the sides. */}
          <motion.div
            key={`door-l-${swatch.id}`}
            className={`absolute bottom-[26%] left-[6%] h-[3px] w-[26%] origin-left rotate-[14deg] rounded-full ${isFlow ? 'animate-flow' : ''}`}
            style={lightStyle}
            {...powerOn(0.55)}
          />
          <motion.div
            key={`door-r-${swatch.id}`}
            className={`absolute bottom-[26%] right-[6%] h-[3px] w-[26%] origin-right -rotate-[14deg] rounded-full ${isFlow ? 'animate-flow' : ''}`}
            style={lightStyle}
            {...powerOn(0.55)}
          />

          {/* Footwells — pooled light, not a line. Last to catch. */}
          <FootPool
            key={`pool-l-${swatch.id}`}
            className="bottom-[10%] left-[22%]"
            color={glow}
            isFlow={isFlow}
            {...powerOn(0.85)}
          />
          <FootPool
            key={`pool-r-${swatch.id}`}
            className="bottom-[10%] right-[22%]"
            color={glow}
            isFlow={isFlow}
            {...powerOn(0.85)}
          />

          {/* Windshield line, so the abstraction still reads as a cabin. */}
          <svg
            viewBox="0 0 400 225"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            fill="none"
            stroke="rgb(255 255 255 / 0.1)"
            strokeWidth="1"
          >
            <path d="M40 44 C120 24 280 24 360 44" />
            <path d="M56 52 L344 52" stroke="rgb(255 255 255 / 0.06)" />
            <path d="M148 225 L172 96 L228 96 L252 225" stroke="rgb(255 255 255 / 0.06)" />
          </svg>

          <motion.span
            key={`label-${swatch.id}`}
            className="label-mono absolute bottom-4 left-5 text-white/60 sm:bottom-6 sm:left-8"
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {t.flow.colors[swatch.id]}
          </motion.span>
        </div>
      </ScrollScale>

      {/* ---- Swatches ---- */}
      <Reveal delay={0.14}>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="label-mono t-fg-faint mr-1">{t.flow.swatchLabel}</span>
          {SWATCHES.map((item) => {
            const active = item.id === swatch.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSwatch(item)}
                aria-pressed={active}
                aria-label={t.flow.colors[item.id]}
                className="relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 hover:-translate-y-0.5"
              >
                <span
                  className="block h-7 w-7 rounded-full"
                  style={
                    item.color
                      ? { backgroundColor: item.color }
                      : { backgroundImage: SPECTRUM, backgroundSize: '200% 200%' }
                  }
                />
                <motion.span
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: 'rgb(var(--fg) / 0.7)' }}
                  initial={false}
                  animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.82 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                />
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* ---- Spec + price ---- */}
      <div className="mt-[clamp(3rem,8vh,5rem)] grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
        <div>
          <Reveal>
            <span className="label-mono t-fg-faint">{t.flow.includes}</span>
          </Reveal>

          <RevealGroup className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2" stagger={0.06}>
            {FLOW_INCLUDES.map((item) => {
              const copy = s(item);
              return (
                <RevealItem key={item.id}>
                  <div className="t-line-soft flex items-start gap-3 border-b py-3">
                    <Check
                      className="t-fg-muted mt-1 h-3.5 w-3.5 shrink-0"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="t-fg block text-[0.9375rem]">{copy.name}</span>
                      {copy.sub && (
                        <span className="t-fg-faint block text-[0.75rem]">{copy.sub}</span>
                      )}
                    </span>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>

        <Reveal delay={0.1}>
          <div className="t-line t-surface rounded-[var(--radius-panel)] border p-7 lg:w-[19rem]">
            <span className="label-mono t-fg-faint">{t.flow.flat}</span>
            <div className="tnum type-hero t-fg mt-3 leading-none">
              {money(FLOW.price, lang)}
            </div>
            <p className="t-fg-muted mt-4 text-[0.875rem] leading-relaxed text-pretty">
              {s(FLOW).note}
            </p>
            <button
              type="button"
              onClick={() => requestBooking([FLOW.id])}
              className="btn-invert mt-6 w-full rounded-full px-6 py-3.5 text-[0.9rem] font-medium"
            >
              {t.flow.cta}
            </button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function FootPool({ className, color, isFlow, ...motionProps }) {
  return (
    <motion.span
      {...motionProps}
      className={`absolute h-[14%] w-[18%] rounded-[50%] blur-[10px] ${className}`}
      style={{
        // In Flow mode the strips are already cycling the full spectrum, so the
        // pools go neutral white — a fixed blue pool under a rainbow dash reads
        // as two systems instead of one.
        background: isFlow
          ? 'radial-gradient(ellipse at center, rgb(255 255 255 / 0.5), transparent 70%)'
          : `radial-gradient(ellipse at center, ${color}aa, transparent 70%)`,
      }}
      aria-hidden="true"
    />
  );
}
