import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * A one-pixel line at the top of the page. On a site that is a single scroll,
 * this is the only wayfinding the visitor gets — so it is worth the pixel.
 * Spring-smoothed so trackpad momentum does not make it jitter.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[120] h-px origin-left"
      style={{ scaleX, backgroundColor: 'rgb(var(--fg) / 0.55)' }}
    />
  );
}
