import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Section, { SectionHead } from '../components/Section';
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal';
import Placeholder from '../components/Placeholder';
import ScrollScale from '../components/ScrollScale';
import CarProfile from '../components/CarProfile';
import { HEADLINER, PILLARS, SUNROOF } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import { money } from '../lib/format';

const VEHICLE_IDS = HEADLINER.map((v) => v.id);
const PILLAR_IDS = PILLARS.map((p) => p.id);

/**
 * Act four, on white: the technical half of the offer.
 *
 * Pillars are the upsell nobody understands from a price list — a bare "+$50"
 * means nothing until you can see which piece of the car it is. So the line
 * drawing lights up the exact pillar as you tick it, and the total updates
 * underneath. The diagram is the explanation; the button names the price.
 */
export default function Headliner() {
  const { t, s, lang } = useLang();
  const { requestBooking } = useBooking();

  const [vehicle, setVehicle] = useState(HEADLINER[1].id);
  const [pillars, setPillars] = useState([]);
  const [sunroof, setSunroof] = useState(false);

  const base = HEADLINER.find((v) => v.id === vehicle) || HEADLINER[1];
  // Sum each pillar's own price rather than multiplying by the first one's.
  // That defensive choice paid off on 2026-09-12, when B-pillars went to $100
  // and A and C stayed at $50: the total was already correct.
  const total = useMemo(
    () => {
      const withPillars = pillars.reduce((sum, id) => {
        const pillar = PILLARS.find((p) => p.id === id);
        return sum + (pillar ? pillar.price : 0);
      }, base.price);
      return withPillars + (sunroof ? SUNROOF.price : 0);
    },
    [base.price, pillars, sunroof],
  );

  const togglePillar = (id) =>
    setPillars((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id],
    );

  return (
    <Section id="headliner" theme="light">
      <SectionHead
        index={t.headliner.index}
        label={t.headliner.label}
        title={t.headliner.title}
        italic={t.headliner.titleItalic}
        lead={t.headliner.lead}
      />

      <div className="mt-[clamp(2.5rem,7vh,4rem)] grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* ---- Left: the drawing + a slot for the real suede shot ---- */}
        <div className="flex flex-col gap-6">
          <ScrollScale>
            <div className="t-surface t-line rounded-[var(--radius-panel)] border p-6 sm:p-8">
              <CarProfile vehicle={vehicle} active={pillars} />
              <p className="label-mono t-fg-faint mt-4 text-center">
                {t.headliner.pillarNote}
              </p>
            </div>
          </ScrollScale>

          <ScrollScale>
            <Placeholder
              ratio="16 / 10"
              src="/media/photo-04.jpg"
              alt={t.headliner.photoCaption}
              label={t.headliner.photoLabel}
              caption={t.headliner.photoCaption}
            >
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10">
                <span className="label-mono text-white/75">{t.headliner.photoCaption}</span>
              </figcaption>
            </Placeholder>
          </ScrollScale>
        </div>

        {/* ---- Right: the configurator ---- */}
        <div>
          <Reveal>
            <span className="label-mono t-fg-faint">{t.headliner.vehicle}</span>
          </Reveal>

          <RevealGroup className="mt-4 flex flex-col gap-2.5" stagger={0.06}>
            {HEADLINER.map((item) => {
              const active = item.id === vehicle;
              const copy = s(item);
              return (
                <RevealItem key={item.id}>
                  <button
                    type="button"
                    onClick={() => setVehicle(item.id)}
                    aria-pressed={active}
                    className="flex w-full items-center justify-between gap-4 rounded-[var(--radius-field)] border px-5 py-4 text-left transition-all duration-500"
                    style={{
                      borderColor: active ? 'rgb(var(--fg) / 0.55)' : 'rgb(var(--fg) / 0.14)',
                      backgroundColor: active ? 'rgb(var(--fg) / 0.05)' : 'transparent',
                    }}
                  >
                    <span className="min-w-0">
                      <span className="t-fg block text-[1.0625rem] font-medium">
                        {copy.name}
                      </span>
                      <span className="t-fg-faint mt-0.5 block text-[0.8125rem]">
                        {copy.note}
                      </span>
                    </span>
                    <span className="tnum t-fg shrink-0 text-[1.0625rem] font-medium">
                      {money(item.price, lang)}
                    </span>
                  </button>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <Reveal delay={0.05} className="mt-9">
            <span className="label-mono t-fg-faint">{t.headliner.pillars}</span>
          </Reveal>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {PILLARS.map((item) => {
              const active = pillars.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => togglePillar(item.id)}
                  aria-pressed={active}
                  className="flex flex-col items-start gap-2 rounded-[var(--radius-field)] border px-4 py-4 text-left transition-all duration-500"
                  style={{
                    borderColor: active ? 'rgb(var(--fg) / 0.55)' : 'rgb(var(--fg) / 0.14)',
                    backgroundColor: active ? 'rgb(var(--fg) / 0.05)' : 'transparent',
                  }}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300"
                    style={{
                      borderColor: active ? 'transparent' : 'rgb(var(--fg) / 0.28)',
                      backgroundColor: active ? 'rgb(var(--fg))' : 'transparent',
                    }}
                  >
                    {active && (
                      <Check
                        className="h-3 w-3"
                        strokeWidth={3}
                        style={{ color: 'rgb(var(--bg))' }}
                      />
                    )}
                  </span>
                  <span className="t-fg text-[0.875rem] font-medium leading-tight">
                    {s(item).name}
                  </span>
                  {/* Each button carries its own figure. They are no longer one
                      price — B is $100 while A and C are $50 — so a single
                      "+$50 each" label under the diagram would undercharge. */}
                  <span className="tnum t-fg-muted text-[0.8125rem]">
                    +{money(item.price, lang)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* The sunroof panel: its own add-on, because the panel has to come
              out and go back in and that labour is what the price covers. */}
          <Reveal delay={0.05} className="mt-9">
            <span className="label-mono t-fg-faint">{t.headliner.sunroof}</span>
          </Reveal>

          <button
            type="button"
            onClick={() => setSunroof((on) => !on)}
            aria-pressed={sunroof}
            className="mt-4 flex w-full items-center justify-between gap-4 rounded-[var(--radius-field)] border px-5 py-4 text-left transition-all duration-500"
            style={{
              borderColor: sunroof ? 'rgb(var(--fg) / 0.55)' : 'rgb(var(--fg) / 0.14)',
              backgroundColor: sunroof ? 'rgb(var(--fg) / 0.05)' : 'transparent',
            }}
          >
            <span className="flex min-w-0 items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
                style={{
                  borderColor: sunroof ? 'transparent' : 'rgb(var(--fg) / 0.28)',
                  backgroundColor: sunroof ? 'rgb(var(--fg))' : 'transparent',
                }}
              >
                {sunroof && (
                  <Check className="h-3 w-3" strokeWidth={3} style={{ color: 'rgb(var(--bg))' }} />
                )}
              </span>
              <span className="min-w-0">
                <span className="t-fg block text-[1.0625rem] font-medium">
                  {s(SUNROOF).name}
                </span>
                <span className="t-fg-faint mt-0.5 block text-[0.8125rem]">
                  {s(SUNROOF).note}
                </span>
              </span>
            </span>
            <span className="tnum t-fg shrink-0 text-[1.0625rem] font-medium">
              +{money(SUNROOF.price, lang)}
            </span>
          </button>

          <Reveal delay={0.05}>
            <div className="t-line mt-9 border-t pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className="label-mono t-fg-faint">{t.headliner.total}</span>
                <motion.span
                  key={total}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="tnum type-display t-fg leading-none"
                >
                  {money(total, lang)}
                </motion.span>
              </div>

              <button
                type="button"
                onClick={() =>
                  requestBooking(
                    [vehicle, ...pillars, ...(sunroof ? [SUNROOF.id] : [])],
                    [...VEHICLE_IDS, ...PILLAR_IDS, SUNROOF.id],
                  )
                }
                className="btn-invert mt-6 w-full rounded-full px-7 py-4 text-[0.95rem] font-medium"
              >
                {t.headliner.cta}
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
