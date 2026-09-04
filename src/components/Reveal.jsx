import { motion, useReducedMotion } from 'framer-motion';

/**
 * The site's one entrance animation. Everything that arrives on scroll arrives
 * the same way — a short rise with an expo ease — so the page has a single
 * rhythm instead of six competing ones.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 26,
  duration = 0.85,
  once = true,
  amount = 0.35,
  as = 'div',
  className = '',
  ...rest
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduced) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggered variant for lists: the parent schedules, the children just rise.
 * Used for price cards and the "why us" grid.
 */
export function RevealGroup({ children, className = '', stagger = 0.08, delay = 0, amount = 0.25 }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className = '', y = 24, ...rest }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
