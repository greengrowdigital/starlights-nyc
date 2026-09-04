import { motion, useReducedMotion } from 'framer-motion';

/**
 * Words rising out of a mask — the one way a headline arrives on this site.
 *
 * Every word sits in its own overflow-hidden span and slides up from below its
 * baseline, staggered a few frames apart. The hero introduced the gesture; using
 * it for every section title makes the page read as one voice instead of eight
 * components with eight opinions about entrances.
 *
 * `italic` is the single serif word most headlines end on. It is passed in
 * separately rather than parsed out of the string so the dictionary never has
 * to carry markup.
 *
 * Two things that are load-bearing, learned the hard way:
 *  - The viewport observer lives on the HEADING, and the words only carry
 *    variants. A word starts translated fully outside its clipping mask, so an
 *    observer on the word itself sees zero intersection and never fires — the
 *    titles simply never arrived.
 *  - line-height stays >= 1 inside the mask: below that the mask clips the
 *    descenders of the display face ("y" in "sky", "p" in "up").
 */
export default function MaskText({
  text = '',
  italic,
  as = 'h2',
  className = '',
  delay = 0,
  stagger = 0.07,
  duration = 1,
  once = true,
  amount = 0.5,
  inView = true,
}) {
  const reduced = useReducedMotion();
  const words = text.split(' ').filter(Boolean).map((w) => ({ w, ital: false }));
  if (italic) words.push({ w: italic, ital: true });
  const label = `${text}${italic ? ' ' + italic : ''}`;

  if (reduced) {
    const Tag = as;
    return (
      <Tag className={className}>
        {words.map((word, i) => (
          <span key={`${word.w}-${i}`} className={word.ital ? 'ital' : undefined}>
            {word.w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Tag>
    );
  }

  const MotionTag = motion[as] || motion.h2;
  const trigger = inView
    ? { initial: 'hidden', whileInView: 'show', viewport: { once, amount } }
    : { initial: 'hidden', animate: 'show' };

  return (
    <MotionTag
      className={`${className} flex flex-wrap gap-x-[0.26em]`}
      aria-label={label}
      {...trigger}
    >
      {words.map((word, i) => (
        <span
          key={`${word.w}-${i}`}
          className="inline-block overflow-hidden pb-[0.08em] leading-[1]"
          aria-hidden="true"
        >
          <motion.span
            className={`inline-block ${word.ital ? 'ital' : ''}`}
            variants={{
              hidden: { y: '112%' },
              show: {
                y: '0%',
                transition: {
                  delay: delay + i * stagger,
                  duration,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
          >
            {word.w}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
