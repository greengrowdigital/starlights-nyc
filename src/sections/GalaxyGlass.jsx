import Section, { Container } from '../components/Section';
import Reveal from '../components/Reveal';
import MaskText from '../components/MaskText';
import ScrollScale from '../components/ScrollScale';
import Starfield from '../components/Starfield';
import { GALAXY_GLASS } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import { money } from '../lib/format';

/**
 * The second ceiling add-on: the panoramic roof itself, turned into a sky.
 *
 * Shown as the aperture you actually look up at from the seat — a trapezoid,
 * because the far edge of a roof panel is further away than the near one, and
 * a plain rectangle here reads as a poster rather than a roof. The glass is
 * the same live starfield the ceiling preview uses, so the two products are
 * visibly the same night; the surround is headliner, and a chrome catch-light
 * runs along the leading edge.
 *
 * The geometry is written once and shared by the CSS clip and the SVG frame,
 * so the drawn edge can never drift away from the clipped one.
 */

// x,y in a 160x100 box (the panel's 16:10 frame). Near edge at the bottom,
// which is why it is the wider one. The bottom stops short of the frame so the
// surround has room to read as headliner — and to hold the caption.
const APERTURE = [
  [28, 9],
  [132, 9],
  [148, 82],
  [12, 82],
];

const clipPath = `polygon(${APERTURE.map(([x, y]) => `${(x / 160) * 100}% ${y}%`).join(', ')})`;
const svgPoints = APERTURE.map(([x, y]) => `${x},${y}`).join(' ');

export default function GalaxyGlass() {
  const { t, lang } = useLang();
  const { requestBooking } = useBooking();

  return (
    <Section id="galaxy" theme="dark" full pad="py-0">
      <div className="relative isolate overflow-hidden py-[clamp(4rem,12vh,8rem)]">
        {/* A faint sky behind everything, so the section is not a flat plate. */}
        <div className="absolute inset-0 -z-10 bg-black">
          <Starfield density={220} seed={61} brightness={0.5} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 62% 50%, rgb(207 227 255 / 0.09), transparent 70%), linear-gradient(to bottom, rgb(0 0 0 / 0.9), rgb(0 0 0 / 0.55) 45%, rgb(0 0 0 / 0.9))',
            }}
          />
          <div className="grain pointer-events-none absolute inset-0" />
        </div>

        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            {/* ---- Copy ---- */}
            <div className="max-w-xl">
              <Reveal>
                <span className="label-mono text-white/60">{t.galaxy.label}</span>
              </Reveal>

              <MaskText
                as="h2"
                text={t.galaxy.title}
                italic={t.galaxy.titleItalic}
                delay={0.06}
                className="type-hero mt-6 text-white"
              />

              <Reveal delay={0.12}>
                <p className="type-lead mt-6 max-w-[44ch] text-pretty text-white/70">
                  {t.galaxy.lead}
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <div className="flex items-baseline gap-2.5">
                    <span className="label-mono text-white/60">{t.common.from}</span>
                    <span className="tnum type-display text-white">
                      {money(GALAXY_GLASS.price, lang)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => requestBooking([GALAXY_GLASS.id])}
                    className="w-full rounded-full bg-white px-7 py-3.5 text-[0.9rem] font-medium text-black transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto"
                  >
                    {t.galaxy.cta}
                  </button>
                </div>
              </Reveal>

              <Reveal delay={0.22}>
                <p className="mt-6 max-w-[46ch] text-pretty text-[0.8125rem] leading-relaxed text-white/60">
                  {t.galaxy.note}
                </p>
              </Reveal>
            </div>

            {/* ---- The roof ---- */}
            <ScrollScale from={0.95} dim={0.6}>
              <div
                className="relative overflow-hidden rounded-[var(--radius-hero)] border border-white/10"
                style={{ aspectRatio: '16 / 10', background: '#08080a' }}
              >
                {/* Headliner surround. Without a lit surface around it the
                    aperture reads as a shape floating on black rather than a
                    hole cut into a roof, so the surround gets its own tone,
                    a seam either side of the glass, and the page's grain. */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgb(255 255 255 / 0.10), rgb(255 255 255 / 0.04) 45%, rgb(255 255 255 / 0.09)), radial-gradient(ellipse 70% 60% at 50% 108%, rgb(255 255 255 / 0.09), transparent 60%)',
                  }}
                />
                <div className="grain pointer-events-none absolute inset-0" />

                {/* The glass */}
                <div className="absolute inset-0" style={{ clipPath }}>
                  <div className="absolute inset-0 bg-black">
                    <Starfield density={760} seed={33} />
                  </div>
                  {/* Glass tint and a raking sheen across the pane. */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(118deg, rgb(255 255 255 / 0.07) 0%, transparent 26%, transparent 62%, rgb(207 227 255 / 0.05) 100%)',
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 45%, rgb(0 0 0 / 0.55) 100%)',
                    }}
                  />
                </div>

                {/* Frame: the aperture edge, plus a catch-light on the leading
                    trim. vector-effect keeps the stroke even though the box is
                    stretched to the panel's aspect. */}
                <svg
                  viewBox="0 0 160 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  {/* Trim seams either side, running with the roof's taper. */}
                  <line
                    x1={APERTURE[0][0] - 9}
                    y1={APERTURE[0][1] - 3}
                    x2={APERTURE[3][0] - 9}
                    y2={APERTURE[3][1] + 6}
                    stroke="rgb(255 255 255 / 0.10)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={APERTURE[1][0] + 9}
                    y1={APERTURE[1][1] - 3}
                    x2={APERTURE[2][0] + 9}
                    y2={APERTURE[2][1] + 6}
                    stroke="rgb(255 255 255 / 0.10)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polygon
                    points={svgPoints}
                    fill="none"
                    stroke="rgb(255 255 255 / 0.3)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Catch-light on the leading trim. */}
                  <line
                    x1={APERTURE[0][0] + 2}
                    y1={APERTURE[0][1] + 1.5}
                    x2={APERTURE[1][0] - 2}
                    y2={APERTURE[1][1] + 1.5}
                    stroke="rgb(255 255 255 / 0.45)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <span className="label-mono absolute bottom-4 left-5 text-white/60 sm:bottom-6 sm:left-8">
                  {t.galaxy.caption}
                </span>
              </div>
            </ScrollScale>
          </div>
        </Container>
      </div>
    </Section>
  );
}
