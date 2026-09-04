import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Section, { SectionHead } from '../components/Section';
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal';
import Placeholder from '../components/Placeholder';
import ScrollScale from '../components/ScrollScale';
import CarProfile from '../components/CarProfile';
import { HEADLINER, PILLARS } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import { money } from '../lib/format';

const VEHICLE_IDS = HEADLINER.map((v) => v.id);
const PILLAR_IDS = PILLARS.map((p) => p.id);

/**
 * Act four, on white: the technical half of the offer.
 *
 * Pillars are the upsell nobody understands from a price list — "+$50 each"
 * means nothing until you can see which piece of the car it is. So the line
 * drawing lights up the exact pillar as you tick it, and the total updates
 * underneath. The diagram is the explanation; the copy just names the price.
 */
export default function Headliner() {
  const { t, s, lang } = useLang();
  const { requestBooking } = useBooking();

  const [vehicle, setVehicle] = useState(HEADLINER[1].id);
  const [pillars, setPillars] = useState([]);

  const base = HEADLINER.find((v) => v.id === vehicle) || HEADLINER[1];
  // Sum each pillar's own price rather than multiplying by the first one's.
  // They all happen to be $50 today, so this reads the same — but the day the
  // shop charges more for C-pillars, the total would have quietly lied.
  const total = useMemo(
    () =>
      pillars.reduce((sum, id) => {
        const pillar = PILLARS.find((p) => p.id === id);
        return sum + (pillar ? pillar.price : 0);
      }, base.price),
    [base.price, pillars],
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
              label={t.headliner.photoLabel}
              caption={t.headliner.photoCaption}
            />
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
                </button>
              );
            })}
          </div>

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
                  requestBooking([vehicle, ...pillars], [...VEHICLE_IDS, ...PILLAR_IDS])
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
