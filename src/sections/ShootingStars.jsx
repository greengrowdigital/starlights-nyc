import Section, { Container } from '../components/Section';
import Reveal from '../components/Reveal';
import Starfield from '../components/Starfield';
import { SHOOTING_STARS } from '../data/services';
import { useLang } from '../i18n/LanguageContext';
import { useBooking } from '../hooks/useBooking';
import { money } from '../lib/format';

/**
 * The add-on, given its own act because it is the one thing on the price list
 * that has to be seen moving to be understood. Full-bleed, no cards, no grid —
 * a stretch of sky with streaks crossing it and a single price.
 */
export default function ShootingStars() {
  const { t, lang } = useLang();
  const { requestBooking } = useBooking();

  return (
    <Section id="shooting" theme="dark" full pad="py-0">
      <div className="relative isolate flex min-h-[80svh] items-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-black">
          <Starfield density={420} shooting={4} seed={44} brightness={0.9} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgb(0 0 0 / 0.85), rgb(0 0 0 / 0.35) 40%, rgb(0 0 0 / 0.85))',
            }}
          />
          <div className="grain pointer-events-none absolute inset-0" />
        </div>

        <Container className="py-[clamp(4rem,12vh,8rem)]">
          <div className="max-w-2xl">
            <Reveal>
              <span className="label-mono text-white/60">{t.shooting.label}</span>
            </Reveal>

            <Reveal delay={0.06}>
              <h2 className="type-hero mt-6 text-balance text-white">
                {t.shooting.title} <span className="ital">{t.shooting.titleItalic}</span>
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="type-lead mt-6 max-w-[44ch] text-pretty text-white/70">
                {t.shooting.lead}
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <div className="flex items-baseline gap-3">
                  <span className="tnum type-display text-white">
                    {money(SHOOTING_STARS.price, lang)}
                  </span>
                  <span className="label-mono text-white/60">{t.shooting.unit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => requestBooking([SHOOTING_STARS.id])}
                  className="w-full rounded-full bg-white px-7 py-3.5 text-[0.9rem] font-medium text-black transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto"
                >
                  {t.shooting.cta}
                </button>
              </div>
            </Reveal>

          </div>
        </Container>
      </div>
    </Section>
  );
}
