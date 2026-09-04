import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Section, { SectionHead } from '../components/Section';
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal';
import Starfield from '../components/Starfield';
import { STAR_KITS } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import { money, number } from '../lib/format';

const KIT_IDS = STAR_KITS.map((k) => k.id);

/**
 * Act three: the configurator disguised as a product page.
 *
 * The number on the price card and the number of points in the preview are the
 * same number. Choosing 1,100 stars does not swap a photo — it fills the
 * ceiling above the cards, live, while you watch. That is the entire argument
 * for the more expensive kit, and no copy has to make it.
 */
export default function Starlight() {
  const { t, s, lang } = useLang();
  const { requestBooking } = useBooking();
  const [selected, setSelected] = useState(STAR_KITS[1].id);

  const kit = STAR_KITS.find((k) => k.id === selected) || STAR_KITS[1];
  const density = useTween(kit.stars, 900);

  return (
    <Section id="ceiling" theme="dark">
      <SectionHead
        index={t.starlight.index}
        label={t.starlight.label}
        title={t.starlight.title}
        italic={t.starlight.titleItalic}
        lead={t.starlight.lead}
      />

      {/* ---- The ceiling ---- */}
      <Reveal delay={0.1} className="mt-[clamp(2.5rem,6vh,4rem)]">
        <div className="relative">
          <div className="spot-warm pointer-events-none absolute -inset-x-10 -inset-y-16 -z-10" />

          <div
            className="t-line relative overflow-hidden rounded-[var(--radius-hero)] border bg-black"
            style={{ aspectRatio: '21 / 9' }}
          >
            <Starfield density={Math.round(density)} shooting={0} seed={21} />

            {/* Suede edge: the headliner the fiber sits behind. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 86% 94% at 50% 50%, transparent 58%, rgb(0 0 0 / 0.7) 100%)',
                boxShadow: 'inset 0 0 70px 18px rgb(0 0 0 / 0.85)',
              }}
            />
            <div className="grain pointer-events-none absolute inset-0" />

            {/* Live count, bottom-left, the way a spec plate would read. */}
            <div className="absolute bottom-4 left-5 flex items-baseline gap-2 sm:bottom-6 sm:left-8">
              <span className="tnum text-[1.75rem] font-semibold leading-none text-white sm:text-[2.5rem]">
                {number(Math.round(density), lang)}
              </span>
              <span className="label-mono text-white/60">{t.starlight.starsLabel}</span>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <p className="label-mono t-fg-faint mt-4 text-center">{t.starlight.previewCaption}</p>
      </Reveal>

      {/* ---- The kits ---- */}
      <RevealGroup className="mt-[clamp(3rem,8vh,5rem)] grid gap-4 sm:grid-cols-3" stagger={0.09}>
        {STAR_KITS.map((item) => {
          const active = item.id === selected;
          const copy = s(item);
          return (
            <RevealItem key={item.id}>
              <button
                type="button"
                onClick={() => setSelected(item.id)}
                aria-pressed={active}
                className="group relative flex h-full w-full flex-col rounded-[var(--radius-card)] border p-6 text-left transition-all duration-500 sm:p-7"
                style={{
                  borderColor: active ? 'rgb(var(--fg) / 0.5)' : 'rgb(var(--fg) / 0.14)',
                  backgroundColor: active ? 'rgb(var(--fg) / 0.07)' : 'transparent',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="type-title t-fg">{copy.name}</span>
                  <span
                    className="label-mono shrink-0 rounded-full px-2.5 py-1.5 transition-opacity duration-500"
                    style={{
                      backgroundColor: 'rgb(var(--fg))',
                      color: 'rgb(var(--bg))',
                      opacity: active ? 1 : 0,
                    }}
                    aria-hidden={!active}
                  >
                    {t.starlight.selected}
                  </span>
                </div>

                <p className="t-fg-muted mt-3 flex-1 text-[0.9375rem] leading-relaxed text-pretty">
                  {copy.note}
                </p>

                <div className="t-line mt-6 flex items-baseline justify-between border-t pt-5">
                  <span className="tnum type-title t-fg">{money(item.price, lang)}</span>
                  <span className="label-mono t-fg-faint">{t.common.installed}</span>
                </div>

                {/* Underline that draws in on hover — the only hover flourish
                    in the section, so it still means something. */}
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-6 bottom-0 h-px origin-left"
                  style={{ backgroundColor: 'rgb(var(--fg) / 0.4)' }}
                  initial={false}
                  animate={{ scaleX: active ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </button>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-fg-faint max-w-[46ch] text-[0.875rem] leading-relaxed text-pretty">
            {t.starlight.note}
          </p>
          <button
            type="button"
            onClick={() => requestBooking([selected], KIT_IDS)}
            className="btn-invert w-full shrink-0 rounded-full px-7 py-3.5 text-[0.9rem] font-medium sm:w-auto"
          >
            {t.starlight.cta}
          </button>
        </div>
      </Reveal>
    </Section>
  );
}

/**
 * Eases a number toward a target instead of snapping to it, so the ceiling
 * fills in rather than flickering to a new state. Respects reduced motion by
 * jumping straight to the value.
 */
function useTween(target, duration = 800) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      fromRef.current = target;
      setValue(target);
      return undefined;
    }

    fromRef.current = value;
    startRef.current = performance.now();

    const step = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1);
      // Expo-out: fast commitment, soft landing — the same curve as the CSS.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafRef.current);
    // `value` is intentionally not a dependency: it is the animation's start
    // point, read once per target change, never a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
