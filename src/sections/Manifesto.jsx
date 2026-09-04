import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Container } from '../components/Section';
import Reveal from '../components/Reveal';
import Marquee from '../components/Marquee';
import { useLang } from '../i18n/LanguageContext';

/**
 * Act two: the handover from night to workshop.
 *
 * The statement is not revealed on entry — it is *written* by the scroll, one
 * line at a time, so the reader's own movement sets the pace of the sentence.
 * That is the moment the page stops being a hero and starts being a story.
 */
export default function Manifesto() {
  const { t } = useLang();
  const reduced = useReducedMotion();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.45'],
  });

  const lines = t.manifesto.lines;

  return (
    <section
      id="idea"
      data-theme="light"
      className="relative isolate py-[clamp(6rem,16vh,11rem)]"
    >
      <Container>
        <Reveal>
          <span className="label-mono t-fg-faint">{t.manifesto.label}</span>
        </Reveal>

        <div ref={ref} className="mt-10">
          {lines.map((line, i) => (
            <Line
              key={line}
              progress={scrollYProgress}
              index={i}
              total={lines.length}
              reduced={reduced}
              accent={i === lines.length - 1}
            >
              {line}
            </Line>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="t-fg-muted mt-12 max-w-[54ch] text-pretty text-[1.0625rem] leading-relaxed">
            {t.manifesto.body}
          </p>
        </Reveal>
      </Container>

      <Container className="mt-[clamp(4rem,10vh,7rem)]">
        <Marquee items={t.marquee} />
      </Container>
    </section>
  );
}

function Line({ progress, index, total, children, reduced, accent }) {
  // Each line owns a slice of the section's scroll, with the slices overlapping
  // slightly so the paragraph reads as one continuous sentence arriving rather
  // than six separate animations firing.
  const start = index / total;
  const end = (index + 0.85) / total;

  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const y = useTransform(progress, [start, end], [16, 0]);

  if (reduced) {
    return (
      <p className="type-hero t-fg text-balance">
        <span className={accent ? 'ital' : undefined}>{children}</span>
      </p>
    );
  }

  return (
    <motion.p className="type-hero t-fg text-balance" style={{ opacity, y }}>
      <span className={accent ? 'ital' : undefined}>{children}</span>
    </motion.p>
  );
}
