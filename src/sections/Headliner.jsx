import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import Section, { SectionHead } from '../components/Section';
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal';
import Placeholder from '../components/Placeholder';
import ScrollScale from '../components/ScrollScale';
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
              <CarDiagram vehicle={vehicle} active={pillars} />
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

/**
 * Three silhouettes with an identical command structure, so Framer can tween
 * one into the next: pick "SUV" and the roof rises and squares off; pick
 * "Coupe" and it drops and rakes back. The pillars move with the roof.
 *
 * Path structure is the contract: body = M C L L C L C L L C, glass =
 * M L C L C L Z. Change a shape, keep the commands, and the morph keeps working.
 */
const SHAPES = {
  'suede-coupe': {
    body: 'M28 128 C24 108 30 100 46 97 L118 90 L168 60 C178 52 190 50 204 50 L262 50 C280 50 296 56 306 66 L346 94 L382 99 C396 102 400 110 398 128',
    glass: 'M126 88 L176 62 C184 56 194 54 206 54 L262 54 C276 54 290 59 300 68 L334 92 Z',
    pillars: {
      'pillar-a': [168, 60, 126, 88],
      'pillar-b': [238, 54, 238, 90],
      'pillar-c': [306, 66, 334, 92],
    },
  },
  'suede-sedan': {
    body: 'M28 128 C24 108 30 100 46 97 L112 90 L152 58 C160 52 172 49 186 49 L286 49 C300 49 312 53 320 61 L352 92 L382 99 C396 102 400 110 398 128',
    glass: 'M120 88 L160 60 C166 55 174 53 184 53 L286 53 C297 53 306 56 312 63 L340 90 Z',
    pillars: {
      'pillar-a': [152, 58, 120, 88],
      'pillar-b': [232, 53, 232, 90],
      'pillar-c': [312, 63, 340, 90],
    },
  },
  'suede-suv': {
    body: 'M28 128 C24 104 30 96 46 93 L104 88 L136 46 C142 38 154 36 168 36 L318 36 C332 36 344 40 350 48 L364 88 L384 96 C396 100 400 110 398 128',
    glass: 'M112 86 L142 50 C148 42 158 40 170 40 L316 40 C328 40 338 44 344 52 L358 86 Z',
    pillars: {
      'pillar-a': [136, 46, 112, 86],
      'pillar-b': [232, 40, 232, 86],
      'pillar-c': [344, 52, 358, 86],
    },
  },
};

const STROKE = {
  duration: 1.4,
  ease: [0.16, 1, 0.3, 1],
};

/**
 * Side-profile line drawing. Deliberately a technical sketch rather than an
 * illustration: it has to read as a diagram of *your* car, not a picture of
 * one particular model.
 *
 * It draws itself when scrolled into view — body first, then glass, then
 * wheels — the way a pen would. After that, every change is a morph: the
 * vehicle type reshapes the roofline and a ticked pillar traces its stroke in.
 */
function CarDiagram({ vehicle, active = [] }) {
  const reduced = useReducedMotion();
  const shape = SHAPES[vehicle] || SHAPES['suede-sedan'];
  const draw = (delay) => ({
    hidden: { pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 },
    show: {
      pathLength: 1,
      opacity: 1,
      transition: { pathLength: { ...STROKE, delay }, opacity: { duration: 0.2, delay } },
    },
  });

  return (
    <motion.svg
      viewBox="0 0 420 170"
      className="w-full"
      role="img"
      aria-label="Side profile of a vehicle showing the A, B and C pillars"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
    >
      <g
        fill="none"
        stroke="rgb(var(--fg) / 0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Body — morphs between silhouettes, draws in on first sight. */}
        <motion.path
          variants={draw(0)}
          animate={{ d: shape.body }}
          transition={{ d: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
          d={shape.body}
        />
        <motion.path
          variants={draw(0.35)}
          d="M28 128 L392 128"
          strokeDasharray="2 6"
          stroke="rgb(var(--fg) / 0.16)"
        />
        {/* Glass line */}
        <motion.path
          variants={draw(0.5)}
          animate={{ d: shape.glass }}
          transition={{ d: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
          d={shape.glass}
          stroke="rgb(var(--fg) / 0.16)"
        />
      </g>

      {/* Pillars — each one is the exact piece the checkbox above buys. */}
      {['pillar-a', 'pillar-b', 'pillar-c'].map((id, i) => (
        <Pillar
          key={id}
          points={shape.pillars[id]}
          lit={active.includes(id)}
          label={['A', 'B', 'C'][i]}
          delay={0.8 + i * 0.12}
          reduced={reduced}
        />
      ))}

      {/* Wheels */}
      <g fill="none" stroke="rgb(var(--fg) / 0.3)" strokeWidth="1.5">
        <motion.circle variants={draw(0.9)} cx="112" cy="128" r="24" />
        <motion.circle variants={draw(1.05)} cx="112" cy="128" r="10" stroke="rgb(var(--fg) / 0.16)" />
        <motion.circle variants={draw(0.95)} cx="318" cy="128" r="24" />
        <motion.circle variants={draw(1.1)} cx="318" cy="128" r="10" stroke="rgb(var(--fg) / 0.16)" />
      </g>
    </motion.svg>
  );
}

function Pillar({ points, lit, label, delay, reduced }) {
  const [x1, y1, x2, y2] = points;
  const d = `M${x1} ${y1} L${x2} ${y2}`;
  // Label sits just off the pillar's midpoint, on the cabin side.
  const lx = (x1 + x2) / 2 + (label === 'C' ? -14 : 7);
  const ly = (y1 + y2) / 2 + 3;

  return (
    <g>
      {/* Grey track: always there, moves with the silhouette. */}
      <motion.path
        variants={{
          hidden: { pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 },
          show: { pathLength: 1, opacity: 1, transition: { ...STROKE, delay } },
        }}
        animate={{ d }}
        transition={{ d: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
        d={d}
        fill="none"
        stroke="rgb(var(--fg) / 0.28)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Lit stroke: traces in when ticked, un-traces when unticked. */}
      <motion.path
        d={d}
        fill="none"
        stroke="rgb(var(--fg))"
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
        animate={{ d, pathLength: lit ? 1 : 0, opacity: lit ? 1 : 0 }}
        transition={{
          d: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
          pathLength: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: lit ? 0.1 : 0.35, delay: lit ? 0 : 0.2 },
        }}
      />
      <motion.text
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill="rgb(var(--fg))"
        initial={false}
        animate={{ x: lx, y: ly, opacity: lit ? 0.85 : 0.25 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {label}
      </motion.text>
    </g>
  );
}
