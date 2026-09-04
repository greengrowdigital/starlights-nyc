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
 * word at a time. Each word owns a thin slice of the section's scroll and goes
 * from ghost to ink as the reader crosses it, so the pace of the sentence is
 * the pace of their own hand. Scrolling back un-writes it. That is the moment
 * the page stops being a hero and starts being a story.
 */
export default function Manifesto() {
  const { t } = useLang();
  const reduced = useReducedMotion();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  });

  const lines = t.manifesto.lines;
  // Flatten to words so every word can be given its own slice of the scroll,
  // while remembering which line it belongs to for layout.
  const words = [];
  lines.forEach((line, li) => {
    line.split(' ').forEach((w) => words.push({ w, li, accent: li === lines.length - 1 }));
  });
  const total = words.length;

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
          {lines.map((line, li) => (
            <p key={line} className="type-hero t-fg flex flex-wrap gap-x-[0.24em] text-balance">
              {words
                .filter((word) => word.li === li)
                .map((word) => {
                  const index = words.indexOf(word);
                  return (
                    <Word
                      key={`${word.w}-${index}`}
                      progress={scrollYProgress}
                      index={index}
                      total={total}
                      reduced={reduced}
                      accent={word.accent}
                    >
                      {word.w}
                    </Word>
                  );
                })}
            </p>
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

function Word({ progress, index, total, children, reduced, accent }) {
  // Slices overlap by about a word and a half, so the ink seems to flow along
  // the line rather than switch on word by word.
  const start = index / total;
  const end = Math.min(1, (index + 2.4) / total);

  const opacity = useTransform(progress, [start, end], [0.14, 1]);
  const y = useTransform(progress, [start, end], [10, 0]);

  if (reduced) {
    return <span className={accent ? 'ital' : undefined}>{children}</span>;
  }

  return (
    <motion.span className={`inline-block ${accent ? 'ital' : ''}`} style={{ opacity, y }}>
      {children}
    </motion.span>
  );
}
